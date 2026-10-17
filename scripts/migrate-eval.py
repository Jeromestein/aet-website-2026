#!/usr/bin/env python3
"""Export, copy, and verify the HTML Editor dataset without exposing credentials.

Only the four evaluation tables and one attachment bucket are in scope.
Schema installation is a separate, reviewed Supabase migration.
"""

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.error
import urllib.parse
import urllib.request

SOURCE = "dsmihkfffzlhcbjwvdvo"
TARGET = "qrxztgdemfodemlcabcq"
SOURCE_BUCKET = "chat-images"
TARGET_BUCKET = "aet-eval-attachments"
# Counts independently checked in the source SQL Editor on 2026-10-17.
EXPECTED = {
    "aet_fce_aice_report": 17,
    "report_history": 193,
    "report_chat_history": 16,
    "aet_aice_grade_conversion_rules": 17,
}
EXPECTED_FILES = 7


def env_file(path):
    result = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            result[key.strip()] = value.strip().strip("\"'")
    return result


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with path.open("xb") as handle:
        os.chmod(path, 0o600)
        handle.write(data)


class API:
    def __init__(self, url, key, ref):
        assert urllib.parse.urlparse(url).hostname == ref + ".supabase.co", "Unexpected project"
        self.url, self.key = url.rstrip("/"), key

    def request(self, path, method="GET", data=None, headers=None, allowed=()):
        request = urllib.request.Request(
            self.url + path, method=method, data=data,
            headers={"apikey": self.key, "Authorization": "Bearer " + self.key, **(headers or {})},
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.status, response.read(), response.headers
        except urllib.error.HTTPError as error:
            if error.code in allowed:
                return error.code, b"", error.headers
            raise RuntimeError(f"API {method} failed (HTTP {error.code}); response omitted") from None
        except urllib.error.URLError:
            raise RuntimeError("API connection failed; credentials and request details omitted") from None

    def rows(self, table):
        rows, total = [], None
        while total is None or len(rows) < total:
            _, data, headers = self.request(
                f"/rest/v1/{table}?select=*&order=id.asc&offset={len(rows)}&limit=100",
                headers={"Prefer": "count=exact"},
            )
            batch = json.loads(data)
            count = int(headers["Content-Range"].split("/")[-1])
            assert total is None or count == total, "Source changed during pagination"
            total = count
            if not batch:
                assert len(rows) == total, "Incomplete response"
                break
            rows.extend(batch)
        assert len(rows) == total and len({row["id"] for row in rows}) == total
        return rows

    def objects(self, bucket, prefix=""):
        result, offset = [], 0
        while True:
            _, raw, _ = self.request(
                "/storage/v1/object/list/" + bucket, "POST",
                canonical({"prefix": prefix, "limit": 100, "offset": offset,
                           "sortBy": {"column": "name", "order": "asc"}}),
                {"Content-Type": "application/json"},
            )
            entries = json.loads(raw)
            for entry in entries:
                name = prefix + entry["name"]
                if entry.get("id"):
                    result.append({**entry, "name": name})
                else:
                    result.extend(self.objects(bucket, name + "/"))
            if len(entries) < 100:
                break
            offset += len(entries)
        return sorted(result, key=lambda item: item["name"])


def source_api(args):
    env = env_file(args.source_env)
    return API(env["NEXT_PUBLIC_SUPABASE_URL"], env["NEXT_PUBLIC_SUPABASE_ANON_KEY"], SOURCE)


def target_api(args):
    env = env_file(args.target_env)
    return API(env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"], TARGET), env


def object_path(bucket, name):
    assert name and not any(part in ("", ".", "..") for part in name.split("/")), "Unsafe object path"
    return bucket + "/" + urllib.parse.quote(name, safe="/")


def export(args):
    api = source_api(args)
    root = Path(args.backup).resolve()
    root.mkdir(mode=0o700, parents=True, exist_ok=False)
    os.chmod(root, 0o700)
    tables = {table: api.rows(table) for table in EXPECTED}
    assert {key: len(value) for key, value in tables.items()} == EXPECTED, "Re-audit source counts"
    objects = api.objects(SOURCE_BUCKET)
    assert len(objects) == EXPECTED_FILES, "Re-audit source storage count"
    manifest = {"source": SOURCE, "target": TARGET, "exported_at": dt.datetime.now(dt.timezone.utc).isoformat(),
                "tables": {}, "objects": [], "source_bucket": SOURCE_BUCKET, "target_bucket": TARGET_BUCKET}
    for table, rows in tables.items():
        data = canonical(rows)
        save(root / "tables" / (table + ".json"), data)
        manifest["tables"][table] = {"rows": len(rows), "sha256": sha(data)}
    for entry in objects:
        _, data, headers = api.request("/storage/v1/object/" + object_path(SOURCE_BUCKET, entry["name"]))
        expected_size = entry.get("metadata", {}).get("size")
        assert expected_size is None or len(data) == expected_size, "Object size mismatch"
        save(root / "objects" / entry["name"], data)
        manifest["objects"].append({**entry, "sha256": sha(data), "bytes": len(data),
                                    "content_type": headers.get("Content-Type", "application/octet-stream")})
    # Detect edits during export. The source is never written to by this script.
    for table, rows in tables.items():
        assert api.rows(table) == rows, "Source changed during export; take a new snapshot"
    assert api.objects(SOURCE_BUCKET) == objects, "Storage changed during export"
    save(root / "manifest.json", canonical(manifest))
    print(json.dumps({"backup": str(root), "rows": EXPECTED, "files": len(objects),
                      "bytes": sum(x["bytes"] for x in manifest["objects"])}))


def load_backup(args):
    root = Path(args.backup).resolve()
    manifest = json.loads((root / "manifest.json").read_bytes())
    assert manifest["source"] == SOURCE and manifest["target"] == TARGET
    tables = {}
    for table in EXPECTED:
        raw = (root / "tables" / (table + ".json")).read_bytes()
        assert sha(raw) == manifest["tables"][table]["sha256"], "Backup hash mismatch"
        tables[table] = json.loads(raw)
        assert len(tables[table]) == manifest["tables"][table]["rows"]
    for entry in manifest["objects"]:
        object_path(SOURCE_BUCKET, entry["name"])
        assert sha((root / "objects" / entry["name"]).read_bytes()) == entry["sha256"]
    return root, manifest, tables


def transform(tables, manifest):
    replacements = {}
    for entry in manifest["objects"]:
        for kind in ("public", "authenticated"):
            old = f"https://{SOURCE}.supabase.co/storage/v1/object/{kind}/" + object_path(SOURCE_BUCKET, entry["name"])
            replacements[old] = f"https://{TARGET}.supabase.co/storage/v1/object/authenticated/" + object_path(TARGET_BUCKET, entry["name"])

    def replace(value):
        if isinstance(value, str):
            for old, new in replacements.items():
                value = value.replace(old, new)
            assert SOURCE + ".supabase.co" not in value, "Unmapped source reference"
        elif isinstance(value, list):
            return [replace(item) for item in value]
        elif isinstance(value, dict):
            return {key: replace(item) for key, item in value.items()}
        return value

    return replace(tables), replacements


def psql(env, query):
    url = urllib.parse.urlparse(env["STAFF_AUTH_DATABASE_URL"])
    user = urllib.parse.unquote(url.username or "")
    assert user == "postgres." + TARGET and url.hostname.endswith(".pooler.supabase.com"), "Unexpected database"
    child_env = {**os.environ, "PGHOST": url.hostname, "PGPORT": str(url.port or 5432),
                 "PGUSER": user, "PGPASSWORD": urllib.parse.unquote(url.password or ""),
                 "PGDATABASE": url.path.lstrip("/"), "PGSSLMODE": "require", "PGCONNECT_TIMEOUT": "20"}
    result = subprocess.run(["psql", "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1"],
                            input=query, text=True, capture_output=True, env=child_env, timeout=180)
    if result.returncode:
        # SQL may include private report data. Never echo query text or server errors.
        raise RuntimeError("Database operation failed; private error details omitted")
    return result.stdout.strip()


def import_data(args):
    root, manifest, original = load_backup(args)
    tables, replacements = transform(original, manifest)
    api, env = target_api(args)
    counts = json.loads(psql(env, "select json_build_object(" + ",".join(
        f"'{table}',(select count(*) from public.{table})" for table in EXPECTED) + ");"))
    assert all(counts[t] in (0, len(tables[t])) for t in tables), "Target contains unexpected data"
    status, raw, _ = api.request("/storage/v1/bucket/" + TARGET_BUCKET, allowed=(400, 404))
    if status != 200:
        api.request("/storage/v1/bucket", "POST", canonical({"id": TARGET_BUCKET, "name": TARGET_BUCKET, "public": False}),
                    {"Content-Type": "application/json"})
    else:
        assert json.loads(raw)["public"] is False, "Target bucket must be private"
    known = {entry["name"]: entry for entry in api.objects(TARGET_BUCKET)}
    assert set(known).issubset({item["name"] for item in manifest["objects"]}), "Unexpected target objects"
    for entry in manifest["objects"]:
        path = "/storage/v1/object/" + object_path(TARGET_BUCKET, entry["name"])
        if entry["name"] not in known:
            api.request(path, "POST", (root / "objects" / entry["name"]).read_bytes(),
                        {"Content-Type": entry["content_type"], "x-upsert": "false"})
        _, data, _ = api.request(path)
        assert sha(data) == entry["sha256"], "Target attachment differs; nothing overwritten"
    statements = ["begin;", "set local statement_timeout = '60s';", "set local timezone = 'UTC';",
                  "set local standard_conforming_strings = on;"]
    statements.append("lock table " + ", ".join("public." + t for t in tables) + " in share row exclusive mode;")
    for table, rows in tables.items():
        # JSON is escaped as a SQL string literal and transmitted on stdin, never argv.
        literal = canonical(rows).decode().replace("'", "''")
        statements.extend([
            f"create temp table incoming_{table} (like public.{table}) on commit drop;",
            f"insert into incoming_{table} select * from jsonb_populate_recordset(null::public.{table}, '{literal}'::jsonb);",
            f"do $$ begin if exists (select 1 from public.{table} t where not exists (select 1 from incoming_{table} s where s.id=t.id and to_jsonb(s)=to_jsonb(t))) then raise exception 'Target differs'; end if; end $$;",
            f"insert into public.{table} select * from incoming_{table} on conflict (id) do nothing;",
            f"do $$ begin if exists (select 1 from incoming_{table} s where not exists (select 1 from public.{table} t where s.id=t.id and to_jsonb(s)=to_jsonb(t))) then raise exception 'Import differs'; end if; end $$;",
        ])
    statements.append("commit;")
    psql(env, "\n".join(statements))
    if not (root / "url-map.json").exists():
        save(root / "url-map.json", canonical(replacements))
    verify(args)


def verify(args):
    root, manifest, original = load_backup(args)
    expected, _ = transform(original, manifest)
    target, env = target_api(args)
    source = source_api(args)
    table_results = {}
    for table, rows in expected.items():
        actual = target.rows(table)
        # Later application migrations may add columns; compare the exported schema.
        source_columns = set(rows[0]) if rows else set()
        actual = [{key: value for key, value in row.items() if key in source_columns} for row in actual]
        assert actual == rows, f"Target content mismatch: {table}"
        assert source.rows(table) == original[table], "Source changed since backup"
        table_results[table] = {"rows": len(rows), "sha256": sha(canonical(actual))}
    current_source_objects = source.objects(SOURCE_BUCKET)
    original_objects = [{key: value for key, value in item.items()
                         if key not in ("sha256", "bytes", "content_type")}
                        for item in manifest["objects"]]
    assert current_source_objects == original_objects, "Source storage changed since backup"
    objects = target.objects(TARGET_BUCKET)
    assert [item["name"] for item in objects] == [item["name"] for item in manifest["objects"]]
    for entry in manifest["objects"]:
        _, raw, _ = target.request("/storage/v1/object/" + object_path(TARGET_BUCKET, entry["name"]))
        assert sha(raw) == entry["sha256"]
        _, raw, _ = target.request("/storage/v1/object/authenticated/" + object_path(TARGET_BUCKET, entry["name"]))
        assert sha(raw) == entry["sha256"], "Stored attachment URL does not resolve"
    reports = {row["id"] for row in expected["aet_fce_aice_report"]}
    orphans = {table: sum(row["report_id"] not in reports for row in expected[table])
               for table in ("report_history", "report_chat_history")}
    anon = API(env["SUPABASE_URL"], env["SUPABASE_ANON_KEY"], TARGET)
    for table in EXPECTED:
        status, raw, _ = anon.request(f"/rest/v1/{table}?select=id&limit=1", allowed=(401, 403))
        assert status in (401, 403) or json.loads(raw) == [], "Anonymous table access"
    for entry in manifest["objects"]:
        status, _, _ = anon.request("/storage/v1/object/public/" + object_path(TARGET_BUCKET, entry["name"]), allowed=(400, 401, 403, 404))
        assert status != 200, "Public attachment access"
        status, _, _ = anon.request("/storage/v1/object/authenticated/" + object_path(TARGET_BUCKET, entry["name"]), allowed=(400, 401, 403, 404))
        assert status != 200, "Anonymous attachment access"
    result = {"verified_at": dt.datetime.now(dt.timezone.utc).isoformat(), "source": SOURCE, "target": TARGET,
              "tables": table_results, "files": len(objects), "file_bytes": sum(x["bytes"] for x in manifest["objects"]),
              "orphans": orphans, "source_unchanged": True, "anonymous_access_blocked": True}
    output = root / ("verification-" + dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ") + ".json")
    save(output, canonical(result))
    print(json.dumps(result))


if __name__ == "__main__":
    if not __debug__:
        raise RuntimeError("Run without Python optimization; integrity guards must remain enabled")
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("export", "import", "verify"))
    parser.add_argument("--backup", required=True)
    parser.add_argument("--source-env", required=True)
    parser.add_argument("--target-env")
    args = parser.parse_args()
    if args.action != "export" and not args.target_env:
        parser.error("--target-env is required")
    {"export": export, "import": import_data, "verify": verify}[args.action](args)
