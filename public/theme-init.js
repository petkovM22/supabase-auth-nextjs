;(function () {
  try {
    var m = localStorage.getItem('theme') || 'system'
    var dark =
      m === 'dark' ||
      (m === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  } catch (e) {}
})()
