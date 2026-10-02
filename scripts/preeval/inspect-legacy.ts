import { readFile, mkdir, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
async function main() {
  // Read only three pre-evaluation records; never copy identities or send notifications.
  const legacy = parseEnv(await readFile("../aet-app/.env", "utf8"));
  const base = legacy.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    legacy.SUPABASE_SERVICE_ROLE_KEY ||
    legacy.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!base || !key)
    throw new Error("Legacy Supabase configuration is missing.");
  async function get(path: string) {
    const response = await fetch(base + "/rest/v1/" + path, {
      headers: { apikey: key, Authorization: "Bearer " + key },
    });
    if (!response.ok) throw new Error("Legacy read failed: " + response.status);
    return await response.json();
  }
  const apps = await get(
    "aet_core_applications?select=id,purpose,status,created_at&purpose=eq.degree-equivalency&order=created_at.desc&limit=3",
  );
  const samples = [];
  for (const [index, app] of apps.entries()) {
    const educations = await get(
      "aet_core_educations?select=country_of_study,degree_obtained,school_name,study_start_date,study_end_date,ai_output&application_id=eq." +
        encodeURIComponent(app.id),
    );
    const payments = await get(
      "aet_core_payments?select=due_amount,payment_status,paid_at,source&application_id=eq." +
        encodeURIComponent(app.id),
    );
    samples.push({
      sample: index + 1,
      purpose: app.purpose,
      status: app.status,
      educationCount: educations.length,
      educationFields: educations.map((e: any) => ({
        countryPresent: !!e.country_of_study,
        institutionPresent: !!e.school_name,
        degreePresent: !!e.degree_obtained,
        startKeys: Object.keys(e.study_start_date || {}),
        endKeys: Object.keys(e.study_end_date || {}),
        aiOutputPresent: !!e.ai_output,
      })),
      paymentCount: payments.length,
      paymentFields: payments[0] ? Object.keys(payments[0]) : [],
    });
  }
  await mkdir(".local", { recursive: true });
  await writeFile(
    ".local/legacy-sample-report.json",
    JSON.stringify(
      { readOnly: true, inspected: samples.length, samples },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({ readOnly: true, inspected: samples.length, samples }),
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
