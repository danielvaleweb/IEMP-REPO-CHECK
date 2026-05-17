/**
 * Imperative modal helpers – use these in places where you can't use hooks
 * (e.g. outside components, or when you only have access to the module scope).
 *
 * For components, prefer `useAppModal()` hook instead.
 */

// We store a reference to the context functions once the Provider mounts
let _showAlert: ((msg: string, type?: any, title?: string) => Promise<void>) | null = null;
let _showConfirm: ((msg: string, title?: string, confirmText?: string) => Promise<boolean>) | null = null;

export function __registerModalFns(
  showAlert: (msg: string, type?: any, title?: string) => Promise<void>,
  showConfirm: (msg: string, title?: string, confirmText?: string) => Promise<boolean>
) {
  _showAlert = showAlert;
  _showConfirm = showConfirm;
}

/**
 * Drop-in replacement for `alert()`.
 * Falls back to native alert on server/test environments.
 */
export async function appAlert(
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
  title?: string
): Promise<void> {
  if (_showAlert) return _showAlert(message, type, title);
  // fallback
  window.alert(message);
}

/**
 * Drop-in replacement for `confirm()`.
 * Returns `true` if user confirms, `false` if cancels.
 * Falls back to native confirm on server/test environments.
 */
export async function appConfirm(
  message: string,
  title?: string,
  confirmText?: string
): Promise<boolean> {
  if (_showConfirm) return _showConfirm(message, title, confirmText);
  // fallback
  return window.confirm(message);
}
