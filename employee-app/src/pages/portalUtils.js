export function formatMinutes(totalMinutes = 0) {
  return `${(totalMinutes / 60).toFixed(2)} timer`;
}

/**
 * Parser en datoværdi sikkert som lokal tid.
 * new Date("YYYY-MM-DD") tolkes som UTC midnight og kan vise forkert dag i DK.
 * new Date("YYYY-MM-DDTHH:mm:ss") tolkes som lokal tid og er korrekt.
 */
function parseDateLocal(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value);
  // Dato-only (YYYY-MM-DD): parse manuelt som lokal midnat for at undgå UTC-shift
  const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  return new Date(str);
}

export function formatDate(value) {
  if (!value) return "Ingen dato";
  const date = parseDateLocal(value);
  if (!date || Number.isNaN(date.getTime())) return "Ingen dato";
  return new Intl.DateTimeFormat("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
