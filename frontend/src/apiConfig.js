// Centralized API Base configuration
// Normalizes VITE_API_BASE:
// - Removes trailing slash if present (e.g. "https://backend.railway.app/" -> "https://backend.railway.app")
// - Removes trailing "/api" if present (prevents accidental "https://backend.railway.app/api/api/...")
const raw = (import.meta.env.VITE_API_BASE || '').trim().replace(/\/+$/, '')
export const API_BASE = raw.endsWith('/api') ? raw.slice(0, -4) : raw
