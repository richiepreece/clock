import { useState, useEffect, useMemo } from 'react';

function getLocaleOverride(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  return params.get('locale') || undefined;
}

function formatDate(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTime(date: Date, locale?: string): string {
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Detect if daylight saving time is currently active.
 * Compares the current UTC offset to the January offset —
 * if they differ, DST is in effect.
 */
function isDST(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return date.getTimezoneOffset() < stdOffset;
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96.98 96.98"
      className="sun-icon"
    >
      <circle cx="48.49" cy="48.49" r="29.24" fill="#fff" />
      <rect x="45.35" width="6.21" height="15.14" fill="#fff" />
      <rect x="45.35" y="81.84" width="6.21" height="15.14" fill="#fff" />
      <rect x="86.3" y="42.4" width="6.21" height="15.14" fill="#fff" transform="translate(139.38 -39.43) rotate(90)" />
      <rect x="4.47" y="42.4" width="6.21" height="15.14" fill="#fff" transform="translate(57.54 42.4) rotate(90)" />
      <rect x="74.32" y="12.89" width="6.21" height="15.14" fill="#fff" transform="translate(37.15 -48.75) rotate(45)" />
      <rect x="16.45" y="70.76" width="6.21" height="15.14" fill="#fff" transform="translate(61.12 9.11) rotate(45)" />
      <rect x="73.74" y="71.33" width="6.21" height="15.14" fill="#fff" transform="translate(186.99 80.36) rotate(135)" />
      <rect x="15.88" y="13.47" width="6.21" height="15.14" fill="#fff" transform="translate(47.28 22.49) rotate(135)" />
    </svg>
  );
}

export function TimeOverlay() {
  const [now, setNow] = useState(new Date());
  const locale = useMemo(() => getLocaleOverride(), []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dst = isDST(now);

  return (
    <div className="time-overlay">
      <div className="time-date">{formatDate(now, locale)}</div>
      <div className="time-clock">
        {dst && <SunIcon />}
        {formatTime(now, locale)}
      </div>
    </div>
  );
}
