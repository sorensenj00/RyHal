export const ASSOCIATION_COLOR_FALLBACK = '--color-andet';

const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeAssociationColorToken = (value) => {
  const trimmed = toTrimmedString(value);
  return trimmed || ASSOCIATION_COLOR_FALLBACK;
};

export const toAssociationCssColorValue = (value) => {
  const token = normalizeAssociationColorToken(value);
  return token.startsWith('--') ? `var(${token})` : token;
};

export const resolveAssociationColorValue = (value) => {
  const token = normalizeAssociationColorToken(value);

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
    .getPropertyValue(ASSOCIATION_COLOR_FALLBACK)
    .trim();

  return fallbackResolved || '#94A3B8';
};

const parseHexToRgb = (value) => {
  const hex = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return {
      r: parseInt(`${hex[1]}${hex[1]}`, 16),
      g: parseInt(`${hex[2]}${hex[2]}`, 16),
      b: parseInt(`${hex[3]}${hex[3]}`, 16),
    };
  }

  if (/^#[0-9a-f]{6}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  return null;
};

const parseRgbToRgb = (value) => {
  const match = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) {
    return null;
  }

  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
};

const getRelativeLuminance = ({ r, g, b }) => {
  const channels = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
};

export const getAssociationTextColor = (value) => {
  const resolved = resolveAssociationColorValue(value);
  const rgb = parseHexToRgb(resolved) || parseRgbToRgb(resolved);

  if (!rgb) {
    return '#ffffff';
  }

  return getRelativeLuminance(rgb) > 0.5 ? '#0f172a' : '#ffffff';
};
