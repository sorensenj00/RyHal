/**
 * dateUtils.js
 *
 * Centraliseret datohåndtering for admin-dashboard.
 *
 * Grundregel: Alle timestamps fra dette API er "timestamp without time zone"
 * (lokal vægur-tid, ingen offset). Brug aldrig new Date("YYYY-MM-DD") direkte –
 * det tolkes som UTC midnight og viser forkert dato i DK. Brug parseDateOnly() i stedet.
 */

import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parser en dato-only streng ("YYYY-MM-DD") sikkert som lokal midnat.
 * Undgår UTC-midnight-fælden ved new Date("YYYY-MM-DD").
 *
 * For datetime-strenge ("YYYY-MM-DDTHH:mm:ss") bruges parseISO direkte.
 *
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
export const parseDateSafe = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const str = String(value);

  // Timestamp med timezone-markør: parse med parseISO (respekterer offset)
  // Timestamp uden timezone og date-only: parseISO fortolker begge som lokal tid
  try {
    const parsed = parseISO(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Input-felthjælpere  (<input type="date"> / <input type="time">)
// ---------------------------------------------------------------------------

/**
 * Returnerer "YYYY-MM-DD" fra en datetime-streng/Date til brug i <input type="date">.
 * Bruger string-split frem for new Date() for at undgå UTC-drift.
 *
 * @param {string|Date|null|undefined} dateTime
 * @returns {string}
 */
export const toLocalDateInput = (dateTime) => {
  if (!dateTime) return '';

  const str = String(dateTime);
  // Hvis det allerede er et ISO-timestamp uden timezone, tag datodelen direkte
  if (/^\d{4}-\d{2}-\d{2}(T|$)/.test(str)) {
    return str.slice(0, 10);
  }

  // Fallback: parse og formatér lokalt
  const parsed = parseDateSafe(dateTime);
  if (!parsed) return '';
  return format(parsed, 'yyyy-MM-dd');
};

/**
 * Returnerer "HH:mm" fra en datetime-streng/Date til brug i <input type="time">.
 *
 * @param {string|Date|null|undefined} dateTime
 * @returns {string}
 */
export const toLocalTimeInput = (dateTime) => {
  if (!dateTime) return '';

  const str = String(dateTime);

  // Fast-path for "...THH:mm..." strenge
  if (str.includes('T')) {
    return str.split('T')[1]?.slice(0, 5) || '';
  }

  // Streng der kun er et klokkeslæt "HH:mm(:ss)"
  if (/^\d{2}:\d{2}/.test(str)) {
    return str.slice(0, 5);
  }

  const parsed = parseDateSafe(dateTime);
  if (!parsed) return '';
  return format(parsed, 'HH:mm');
};

// ---------------------------------------------------------------------------
// API-serialisering
// ---------------------------------------------------------------------------

/**
 * Sammensætter et lokal datetime-timestamp ("YYYY-MM-DDTHH:mm:ss") til API-kald.
 * Sender aldrig et Z-suffix eller offset for at undgå 2-timers drift i backend.
 *
 * @param {string} datePart  "YYYY-MM-DD"
 * @param {string} timePart  "HH:mm" eller "HH:mm:ss"
 * @returns {string|null}
 */
export const toApiLocalDateTime = (datePart, timePart) => {
  if (!datePart || !timePart) return null;
  // Normaliser til HH:mm:ss
  const time = timePart.length === 5 ? `${timePart}:00` : timePart;
  return `${datePart}T${time}`;
};

// ---------------------------------------------------------------------------
// Dato-nøgler (filtrering / sammenligning)
// ---------------------------------------------------------------------------

/**
 * Returnerer "YYYY-MM-DD" fra en hvilken som helst datoværdi.
 * Håndterer timestamps med og uden timezone-markør korrekt:
 *  - Med markør (Z / +HH:MM): konverteres til lokal kalenderdag
 *  - Uden markør: ISO-datodelen udtrækkes direkte uden parsing
 *
 * @param {string|Date|null|undefined} value
 * @returns {string|null}
 */
export const toDateKey = (value) => {
  if (!value) return null;

  const str = String(value);
  const hasTimeZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(str);

  if (hasTimeZone) {
    const parsed = parseDateSafe(str);
    return parsed ? format(parsed, 'yyyy-MM-dd') : null;
  }

  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const parsed = parseDateSafe(str);
  return parsed ? format(parsed, 'yyyy-MM-dd') : null;
};

// ---------------------------------------------------------------------------
// Visningsformatering
// ---------------------------------------------------------------------------

/**
 * Formaterer en datetime-streng til "dd-MM-yyyy HH:mm" (dansk visning).
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback='—']
 * @returns {string}
 */
export const formatDateTime = (value, fallback = '—') => {
  if (!value) return fallback;
  const parsed = parseDateSafe(value);
  if (!parsed) return fallback;
  return format(parsed, 'dd-MM-yyyy HH:mm', { locale: da });
};

/**
 * Formaterer en dato-streng til "dd-MM-yyyy" (dansk visning).
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback='Ikke angivet']
 * @returns {string}
 */
export const formatDateOnly = (value, fallback = 'Ikke angivet') => {
  if (!value) return fallback;

  const str = String(value);
  // Fast-path: undgå parsing for date-only ISO-strenge
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }

  const parsed = parseDateSafe(value);
  if (!parsed) return fallback;
  return format(parsed, 'dd-MM-yyyy', { locale: da });
};

/**
 * Formaterer en datetime-streng til "d. MMMM yyyy" (fx "4. maj 2026").
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback='Dato ikke angivet']
 * @returns {string}
 */
export const formatDateLong = (value, fallback = 'Dato ikke angivet') => {
  if (!value) return fallback;
  const parsed = parseDateSafe(value);
  if (!parsed) return fallback;
  return format(parsed, 'd. MMMM yyyy', { locale: da });
};

/**
 * Formaterer en datetime-streng til "HH:mm".
 *
 * @param {string|Date|null|undefined} value
 * @param {string} [fallback='Ikke angivet']
 * @returns {string}
 */
export const formatTimeOnly = (value, fallback = 'Ikke angivet') => {
  if (!value) return fallback;

  const str = String(value);
  // Fast-path for timestamps uden timezone
  if (str.includes('T')) {
    const timePart = str.split('T')[1];
    if (timePart) return timePart.slice(0, 5);
  }

  const parsed = parseDateSafe(value);
  if (!parsed) return fallback;
  return format(parsed, 'HH:mm');
};

/**
 * Formaterer et tidsrum til "HH:mm – HH:mm".
 *
 * @param {string|Date|null|undefined} start
 * @param {string|Date|null|undefined} end
 * @param {string} [fallback='Tidspunkt ikke angivet']
 * @returns {string}
 */
export const formatTimeRange = (start, end, fallback = 'Tidspunkt ikke angivet') => {
  const s = formatTimeOnly(start, null);
  const e = formatTimeOnly(end, null);
  if (!s || !e) return fallback;
  return `${s} – ${e}`;
};

// ---------------------------------------------------------------------------
// Alder / fødselsdagsberegning
// ---------------------------------------------------------------------------

/**
 * Beregner alder i hele år fra en fødselsdag-streng ("YYYY-MM-DD").
 * Returnerer null ved ugyldigt input.
 *
 * @param {string|Date|null|undefined} birthday
 * @returns {number|null}
 */
export const calcAge = (birthday) => {
  const birth = parseDateSafe(birthday);
  if (!birth) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

/**
 * Returnerer true hvis personen er 18 år eller ældre, false hvis yngre, null ved ugyldigt input.
 *
 * @param {string|Date|null|undefined} birthday
 * @returns {boolean|null}
 */
export const isOver18 = (birthday) => {
  const age = calcAge(birthday);
  return age === null ? null : age >= 18;
};

// ---------------------------------------------------------------------------
// Hjælpere til skift og vagtberegning
// ---------------------------------------------------------------------------

/**
 * Beregner varighedeni timer mellem to timestamp-strenge.
 * Returnerer 0 ved ugyldigt input.
 *
 * @param {string|Date|null|undefined} startTime
 * @param {string|Date|null|undefined} endTime
 * @returns {number}
 */
export const shiftDurationHours = (startTime, endTime) => {
  const start = parseDateSafe(startTime);
  const end = parseDateSafe(endTime);
  if (!start || !end) return 0;
  return Math.max((end - start) / 3_600_000, 0);
};

// ---------------------------------------------------------------------------
// Diverse
// ---------------------------------------------------------------------------

/**
 * Returnerer en standardreccurrence-slutdato 30 dage efter baseDate ("YYYY-MM-DD").
 *
 * @param {string|null|undefined} baseDate  "YYYY-MM-DD"
 * @returns {string}  "YYYY-MM-DD"
 */
export const getDefaultRecurrenceEndDate = (baseDate) => {
  let seed;

  if (baseDate) {
    const [year, month, day] = String(baseDate).split('-').map(Number);
    seed = new Date(year, (month || 1) - 1, day || 1);
  } else {
    seed = new Date();
  }

  seed.setDate(seed.getDate() + 30);
  return format(seed, 'yyyy-MM-dd');
};
