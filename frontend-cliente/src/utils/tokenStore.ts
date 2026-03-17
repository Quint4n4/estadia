/**
 * In-memory token store for the cliente PWA.
 *
 * Access token: kept ONLY in memory (never in localStorage/sessionStorage).
 *   - XSS scripts cannot read it via document.cookie or Storage APIs.
 *   - Each browser tab has its own independent in-memory token.
 *
 * Refresh token: sessionStorage (per-tab, cleared automatically on tab close).
 *
 * Profile snapshot: sessionStorage (survives F5 in the same tab).
 */

let _accessToken: string | null = null;

export const tokenStore = {
  // ── Access token (memory only) ────────────────────────────────────────────
  getAccessToken: (): string | null => _accessToken,
  setAccessToken: (token: string | null): void => { _accessToken = token; },
  clearAccessToken: (): void => { _accessToken = null; },

  // ── Refresh token (sessionStorage — per tab) ──────────────────────────────
  getRefresh: (): string | null => sessionStorage.getItem('mqf_refresh'),
  setRefresh: (token: string): void => { sessionStorage.setItem('mqf_refresh', token); },

  // ── Profile snapshot (sessionStorage — survives F5) ───────────────────────
  getProfile: (): string | null => sessionStorage.getItem('mqf_profile'),
  setProfile: (profileJson: string): void => { sessionStorage.setItem('mqf_profile', profileJson); },

  // ── Clear everything for this tab ─────────────────────────────────────────
  clear: (): void => {
    _accessToken = null;
    sessionStorage.removeItem('mqf_refresh');
    sessionStorage.removeItem('mqf_profile');
  },
};
