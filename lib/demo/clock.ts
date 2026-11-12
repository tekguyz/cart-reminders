// The demo clock's words. Minute 0 is a Tuesday at 2:00 pm. Pure.

const DAYS = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
const START_MIN = 14 * 60;

export function clockLabel(min: number): string {
  const total = START_MIN + Math.max(0, Math.floor(min));
  const day = DAYS[Math.floor(total / 1440) % 7];
  const inDay = total % 1440;
  const h24 = Math.floor(inDay / 60);
  const m = inDay % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${day} ${h}:${String(m).padStart(2, "0")} ${h24 < 12 ? "am" : "pm"}`;
}

/** "in 1 hour", "in 23 hours" until a future demo-clock minute. */
export function untilLabel(fromMin: number, toMin: number): string {
  const h = Math.round((toMin - fromMin) / 60);
  return h <= 1 ? "in 1 hour" : `in ${h} hours`;
}
