import { required } from "./config";
let cache: { token: string; expires: number } | undefined;
async function headers() {
  if (!cache || cache.expires < Date.now()) {
    const response = await fetch("https://api.dropbox.com/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: required("DROPBOX_AET_App_REFRESH_TOKEN"),
        client_id: required("DROPBOX_AET_App_KEY"),
        client_secret: required("DROPBOX_AET_App_SECRET"),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error("dropbox_auth_failed");
    const value = await response.json();
    cache = {
      token: value.access_token,
      expires: Date.now() + (value.expires_in - 120) * 1000,
    };
  }
  return {
    Authorization: "Bearer " + cache.token,
    "Dropbox-API-Path-Root": JSON.stringify({
      ".tag": "namespace_id",
      namespace_id: required("DROPBOX_AET_App_NAMESPACE_ID"),
    }),
  };
}
export function filePath(applicationId: string, id: string, ext: string) {
  const root = required("PREEVAL_DROPBOX_ROOT");
  if (!root.includes("AET-PreEvaluation-Test"))
    throw new Error("An isolated Dropbox test directory is required.");
  return `${root}/${applicationId}/${id}.${ext}`;
}
export async function uploadFile(path: string, data: Buffer) {
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/upload",
    {
      method: "POST",
      headers: {
        ...(await headers()),
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path,
          mode: "overwrite",
          autorename: false,
          mute: true,
        }),
      },
      body: new Uint8Array(data),
      signal: AbortSignal.timeout(90000),
    },
  );
  if (!response.ok) throw new Error("dropbox_upload_failed");
  return response.json();
}
export async function downloadFile(path: string) {
  if (!path.startsWith(required("PREEVAL_DROPBOX_ROOT") + "/"))
    throw new Error("invalid_file_path");
  const response = await fetch(
    "https://content.dropboxapi.com/2/files/download",
    {
      method: "POST",
      headers: {
        ...(await headers()),
        "Dropbox-API-Arg": JSON.stringify({ path }),
      },
      signal: AbortSignal.timeout(60000),
    },
  );
  if (!response.ok) throw new Error("dropbox_download_failed");
  return Buffer.from(await response.arrayBuffer());
}
