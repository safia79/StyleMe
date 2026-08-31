// FR-03: Clothing Upload & AI Tagging
// Small helper so every request sends the session cookie to the backend.
// FR-01 / FR-02 / FR-08 / FR-09 / FR-10 / FR-11 / FR-12 also use this file.
// Shared helpers for talking to the Express backend. Pages import these
// instead of writing fetch() themselves, so cookies and errors stay consistent.

export const API_BASE = "http://localhost:3001";

// Turn a stored image path into a full URL the <img> tag can load.
export function imageSrc(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE}${imageUrl}`;
}

// One helper for JSON API calls. Always sends the session cookie.
// Returns { ok, status, data } so callers can show a message without crashing.
export async function apiRequest(path, { method = "GET", body } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      // Only set JSON headers when we are actually sending a body.
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Some error responses may not be JSON — treat that as an empty object.
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: "Cannot reach the server. Is the backend running?" },
    };
  }
}

// Used for clothing photos so we can show an upload progress bar
// fetch() cannot report upload percent easily, so this uses XMLHttpRequest.
export function uploadImage(path, file, { onProgress, onUploadComplete } = {}) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("image", file);

    xhr.open("POST", `${API_BASE}${path}`);
    xhr.withCredentials = true;

    // Called many times while the file is sending — used for the progress bar.
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    // Bytes have left the browser; the server may still be analysing the photo.
    xhr.upload.onload = () => {
      if (onUploadComplete) onUploadComplete();
    };

    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = { error: "Could not read the server response." };
      }
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data,
      });
    };

    xhr.onerror = () => {
      resolve({
        ok: false,
        status: 0,
        data: { error: "Cannot reach the server. Is the backend running?" },
      });
    };

    xhr.send(form);
  });
}
