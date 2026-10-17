export const signatureFiles = [
  "beatriz-signature.png",
  "hongjian-chen-signature.png",
  "jeremy-yan-signature.png",
  "jianjun-zhao-signature.png",
  "luguan-yan-signature.png",
  "peiheng-li-signature.png",
  "tong-liu-signature.png",
  "yang-song-signature.png",
  "yue-qi-signature.png",
  "zhihua-zhao-signature.png",
];
export function signatureUrl(value: string) {
  const name = value.replace(/^\//, "");
  if (signatureFiles.includes(name)) return `/api/admin/eval/assets/${name}`;
  if (
    /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value) &&
    value.length <= 400000
  )
    return value;
  return "";
}
