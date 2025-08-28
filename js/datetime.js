(function () {
  const el = document.getElementById('datetime');
  if (!el) return;

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short' // shows PST/PDT automatically
  });

  function update() {
    el.textContent = fmt.format(new Date());
  }

  // Align the first tick to the next full second to avoid drift.
  function startTicker() {
    update();
    const msToNext = 1000 - (new Date()).getMilliseconds();
    setTimeout(function tick() {
      update();
      setTimeout(tick, 1000);
    }, msToNext);
  }

  // Keep the time fresh when tab regains focus
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });

  // If the script is deferred, DOM is ready; start immediately.
  startTicker();
})();
