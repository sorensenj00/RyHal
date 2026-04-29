export function formatMinutes(totalMinutes = 0) {
  return `${(totalMinutes / 60).toFixed(2)} timer`;
}

export function formatDate(value) {
  if (!value) return "Ingen dato";
  const date = new Date(value);
  return new Intl.DateTimeFormat("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
