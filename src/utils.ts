export const isSafari = (() => {
  try {
    return Boolean(
      navigator &&
        navigator.userAgent &&
        navigator.userAgent.includes("Safari/") &&
        !(
          navigator.userAgent.includes("Chrome/") ||
          navigator.userAgent.includes("Chromium/")
        ),
    );
  } catch {
    return false;
  }
})();

export function getPlatformDisplay(
  plat: number | string, 
  lang: string
): string {
  const number = typeof plat === 'string' ? parseInt(plat) : plat;
  if (number < 0 || number > 20) {
    return lang == "en" ? `Platform ${number}` : `${number}號月台`;
  }
  if (number === 0) {
    return "⓿";
  }
  if (number > 10) {
    return String.fromCharCode(9451 + (number - 11));
  }
  return String.fromCharCode(10102 + (number - 1));
}