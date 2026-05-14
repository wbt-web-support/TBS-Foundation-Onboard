/**
 * Bunny.net Storage — HTTP PUT upload.
 * Set `BUNNY_*` env vars (see `example.env.local`). Reference: Bunny dashboard → Storage → FTP & HTTP API.
 */

const STORAGE_HOST_BY_REGION: Record<string, string> = {
  de: "storage.bunnycdn.com",
  uk: "uk.storage.bunnycdn.com",
  ny: "ny.storage.bunnycdn.com",
  la: "la.storage.bunnycdn.com",
  sg: "sg.storage.bunnycdn.com",
  se: "se.storage.bunnycdn.com",
  br: "br.storage.bunnycdn.com",
  jh: "jh.storage.bunnycdn.com",
  syd: "syd.storage.bunnycdn.com",
};

function storageHost(region: string): string {
  const r = region.trim().toLowerCase();
  return STORAGE_HOST_BY_REGION[r] ?? `${r}.storage.bunnycdn.com`;
}

function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

function publicBaseFromEnv(): string {
  return cleanEnv(process.env.BUNNY_PUBLIC_CDN_BASE || process.env.BUNNY_PUBLIC_BASE_URL);
}

export function isBunnyStorageConfigured(): boolean {
  const zone = cleanEnv(process.env.BUNNY_STORAGE_ZONE);
  const key = cleanEnv(process.env.BUNNY_STORAGE_API_KEY);
  const cdn = publicBaseFromEnv();
  return Boolean(zone && key && cdn);
}

export async function uploadToBunnyStorage(params: {
  relativePath: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ path: string; publicUrl: string }> {
  const zone = cleanEnv(process.env.BUNNY_STORAGE_ZONE);
  const accessKey = cleanEnv(process.env.BUNNY_STORAGE_API_KEY);
  const region = cleanEnv(process.env.BUNNY_STORAGE_REGION) || "de";
  const publicBase = publicBaseFromEnv().replace(/\/+$/, "");

  if (!zone || !accessKey || !publicBase) {
    throw new Error("Bunny storage env incomplete");
  }

  const host = cleanEnv(process.env.BUNNY_STORAGE_HOST) || storageHost(region);
  const pathSegments = params.relativePath.split("/").map((s) => encodeURIComponent(s));
  const pathEncoded = pathSegments.join("/");
  const putUrl = `https://${host}/${encodeURIComponent(zone)}/${pathEncoded}`;

  const res = await fetch(putUrl, {
    method: "PUT",
    headers: {
      AccessKey: accessKey,
      "Content-Type": params.contentType || "application/octet-stream",
    },
    body: params.buffer,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Bunny upload ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }

  const publicUrl = `${publicBase}/${params.relativePath}`;
  return { path: params.relativePath, publicUrl };
}
