export const ROLE_COLOR_FALLBACK = '--color-andet';

const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeRoleColorToken = (value) => {
  const trimmed = toTrimmedString(value);
  return trimmed || ROLE_COLOR_FALLBACK;
};

export const toCssColorValue = (value) => {
  const token = normalizeRoleColorToken(value);
  return token.startsWith('--') ? `var(${token})` : token;
};

export const resolveRoleColorValue = (value) => {
  const token = normalizeRoleColorToken(value);

  if (!token.startsWith('--')) {
    return token;
  }

  if (typeof window === 'undefined') {
    return token;
  }

  const resolved = getComputedStyle(document.documentElement).getPropertyValue(token).trim();

  if (resolved) {
    return resolved;
  }

  const fallbackResolved = getComputedStyle(document.documentElement)
    .getPropertyValue(ROLE_COLOR_FALLBACK)
    .trim();

  return fallbackResolved || '#94A3B8';
};

export const getPrimaryRole = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return null;
  }

  return roles[0] || null;
};
