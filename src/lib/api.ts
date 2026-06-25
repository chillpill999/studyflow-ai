import axios from "axios";

// Origin of the FastAPI backend (Hugging Face Space)
const _origin = (
  process.env.NEXT_PUBLIC_API_URL || ''
).replace(/\/$/, '');

/** Full base including /api — use for all REST calls (e.g. `${API_BASE}/documents`) */
export const API_BASE = `${_origin}/api`;

/** Build a full URL for a path relative to the server root */
export function apiUrl(path: string): string {
  return `${_origin}${path.startsWith('/') ? path : '/' + path}`;
}

const API = axios.create({
  baseURL: _origin,
  timeout: 60000, // 60s timeout — HF Spaces can be slow to wake
});

export const uploadDocument = async (
  file: File,
  onProgress?: (pct: number) => void
) => {
  // Step 1: Wake up the HF Space first by pinging /health
  try {
    await axios.get(`${_origin}/health`, {
      timeout: 30000
    });
  } catch (e) {
    // Space is waking up or already awake, continue anyway
  }

  // Step 2: Build FormData — NEVER set Content-Type manually with FormData
  const formData = new FormData();
  formData.append("file", file);

  // Step 3: Upload with progress tracking
  const res = await API.post("/api/documents/upload", formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    }
    // DO NOT set Content-Type header — browser sets it automatically with boundary
  });

  return res.data;
};
