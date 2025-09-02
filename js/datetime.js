/* js/datetime.js
   - Updates #datetime (footer) and #tagline-datetime (hero)
   - No globals leaked; safe if either element is missing
*/

(() => {
  const FOOTER_ID = 'datetime';
  const TAGLINE_ID = 'tagline-datetime';

  const footerEl = document.getElementById(FOOTER_ID);
  const tagEl = document.getElementById(TAGLINE_ID);

  // If neither element exists, do nothing.
  if (!footerEl && !tagEl) return;

  // Basic formatter (e.g., "Mon • Sep 1, 2025 — 11:07 AM")
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const SEP_MAIN = ' — ';
  const SEP_DOT = ' • ';

  function formatNow() {
    // Intl already formats most pieces; we just insert a mid-dot between weekday and date.
    const now = new Date();
    // Break into parts so we can place our custom separators consistently.
    const parts = fmt.formatToParts(now);
    let weekday = '';
    let month = '';
    let day = '';
    let year = '';
    let hour = '';
    let minute = '';
    let dayPeriod = '';

    for (const p of parts) {
      switch (p.type) {
        case 'weekday': weekday = p.value; break;
        case 'month':   month = p.value;   break;
        case 'day':     day = p.value;     break;
        case 'year':    year = p.value;    break;
        case 'hour':    hour = p.value;    break;
        case 'minute':  minute = p.value;  break;
        case 'dayPeriod': dayPeriod = p.value; break; // AM/PM if locale uses it
        default: break;
      }
    }

    const dateStr = `${weekday}${SEP_DOT}${month} ${day}, ${year}`;
    const timeStr = dayPeriod ? `${hour}:${minute} ${dayPeriod}` : `${hour}:${minute}`;
    return `${dateStr}${SEP_MAIN}${timeStr}`;
  }

  function getNowParts() {
  const now = new Date();
  const p = fmt.formatToParts(now);
  const obj = {};
  for (const x of p) obj[x.type] = x.value;

  const weekday = obj.weekday || '';
  const month   = obj.month || '';
  const day     = obj.day || '';
  const year    = obj.year || '';
  const hour    = obj.hour || '';
  const minute  = obj.minute || '';
  const dayPeriod = obj.dayPeriod || '';

  return {
    weekday,
    month,
    day,
    year,
    time: dayPeriod ? `${hour}:${minute} ${dayPeriod}` : `${hour}:${minute}`
  };
}

   
  function tick() {
  const nowText = formatNow(); // your existing formatted single line

  // Update footer (single line)
  if (footerEl) footerEl.textContent = nowText;

  // Update tagline (structured spans for CSS control)
  if (tagEl) {
    const parts = getNowParts(); // helper below
    tagEl.innerHTML = `
      <span class="dt-day">${parts.weekday}</span>
      <span class="dt-date">${parts.month} ${parts.day}, ${parts.year}</span>
      <span class="dt-time">${parts.time}</span>
    `;
  }
}

  // Initial paint
  tick();
  // Update every second
  const interval = setInterval(tick, 1000);

  // Clean up if the page uses hot-reload or swaps DOM
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') clearInterval(interval);
  }, { once: true });
})();
