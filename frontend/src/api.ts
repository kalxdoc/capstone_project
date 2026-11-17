export type Flag = {
  code: string;
  severity: 'info' | 'caution' | 'warning';
  title_bn: string;
  title_en: string;
  reason_bn: string;
  reason_en: string;
};

export type Agency = {
  name: string;
  license_no: string;
  status: string;
  valid_until?: string | null;
};

export type Result = {
  status: 'verified' | 'not_found' | 'mismatch' | 'warning' | 'caution' | 'no_issues_found';
  summary_bn: string;
  summary_en: string;
  flags: Flag[];
  source?: string | null;
  agency?: Agency | null;
  extracted?: { line1: string; line2: string } | null;
  disclaimer_bn: string;
  disclaimer_en: string;
};

// Empty in development (the Vite proxy forwards /api to the backend).
// In production set VITE_API_URL to the deployed backend address.
const BASE = import.meta.env.VITE_API_URL ?? '';

async function handle(res: Response): Promise<Result> {
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

function postJson(path: string, body: unknown): Promise<Result> {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(handle);
}

export const verifyAgency = (agency_name: string, license_no: string) =>
  postJson('/api/v1/agency/verify', { agency_name, license_no });

export const checkMrz = (line1: string, line2: string) =>
  postJson('/api/v1/visa/mrz', { line1, line2 });

// Phone photos can be very large, so shrink before upload.
async function shrink(file: File, max = 2000): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.92),
  );
}

export async function analyzeVisaImage(file: File): Promise<Result> {
  const form = new FormData();
  form.append('image', await shrink(file), 'visa.jpg');
  return handle(await fetch(`${BASE}/api/v1/visa/analyze`, { method: 'POST', body: form }));
}
