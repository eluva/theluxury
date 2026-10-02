// Thin wrapper over the Telegram Mini App SDK (https://core.telegram.org/bots/webapps).
// Every call is safe outside Telegram (regular browser), so the site works as a normal web shop too.

interface TgButton {
  show(): void;
  hide(): void;
  onClick(cb: () => void): void;
  offClick(cb: () => void): void;
}

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string } };
  colorScheme: 'light' | 'dark';
  platform: string;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  enableClosingConfirmation(): void;
  disableVerticalSwipes?: () => void;
  openTelegramLink(url: string): void;
  openLink(url: string): void;
  onEvent(event: string, cb: () => void): void;
  BackButton: TgButton;
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TgWebApp };
  }
}

const webApp = window.Telegram?.WebApp;

/** True only when opened inside the Telegram client (initData is empty in a plain browser). */
export const isTelegram = Boolean(webApp?.initData);

export const tg: TgWebApp | undefined = isTelegram ? webApp : undefined;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes?.();
  try {
    tg.setHeaderColor('#0b0b0b');
    tg.setBackgroundColor('#0b0b0b');
  } catch {
    /* older clients */
  }
}

export const haptic = {
  tap: () => tg?.HapticFeedback?.impactOccurred('light'),
  select: () => tg?.HapticFeedback?.selectionChanged(),
  success: () => tg?.HapticFeedback?.notificationOccurred('success'),
  error: () => tg?.HapticFeedback?.notificationOccurred('error'),
};

export function openTelegram(url: string) {
  if (tg) tg.openTelegramLink(url);
  else window.open(url, '_blank');
}

export function openExternal(url: string) {
  if (tg) tg.openLink(url);
  else window.open(url, '_blank');
}

export const tgUser = tg?.initDataUnsafe?.user;
