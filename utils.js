module.exports = {
  isSafari: (() => {
    try {
      return (
        navigator &&
        navigator.userAgent &&
        navigator.userAgent.includes("Safari/") &&
        !(
          navigator.userAgent.includes("Chrome/") ||
          navigator.userAgent.includes("Chromium/")
        )
      );
    } catch {
      return false;
    }
  })(),
};
