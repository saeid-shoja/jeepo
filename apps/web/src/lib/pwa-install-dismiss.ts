const PWA_INSTALL_DISMISSED_KEY = 'jeepo-pwa-install-dismissed';

export function isPwaInstallDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPwaInstallDismissed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1');
  } catch {
    // ignore quota / private mode
  }
}
