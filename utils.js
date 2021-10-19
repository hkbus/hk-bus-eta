module.exports = {
  isSafari: navigator 
    && navigator.userAgent 
    && navigator.userAgent.includes('Safari/') 
    && !(navigator.userAgent.includes('Chrome/') || navigator.userAgent.includes('Chromium/'))
}