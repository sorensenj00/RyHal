const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5172/api";
const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:3000";
const loginUrl = import.meta.env.VITE_LOGIN_URL || "http://localhost:3000/login";

export const APP_ACCESS = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

export class AuthRequestError extends Error {
  constructor(message, { status = null, retryable = false } = {}) {
    super(message);
    this.name = "AuthRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

export async function fetchAuthMe(accessToken) {
  if (!hasToken(accessToken)) {
    throw new AuthRequestError("Manglende adgangstoken.", {
      status: 401,
    });
  }

  let response;

  try {
    response = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    throw new AuthRequestError("Kunne ikke kontakte serveren for at bekræfte login.", {
      retryable: true,
    });
  }

  const payload = await safeReadJson(response);

  if (!response.ok) {
    const message = payload?.message || payload?.Message || "Kunne ikke hente login-oplysninger.";
    throw new AuthRequestError(message, {
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  return payload;
}

export async function redeemTransferCode(transferCode) {
  let response;

  try {
    response = await fetch(`${apiBaseUrl}/auth/transfer/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transferCode }),
    });
  } catch {
    throw new AuthRequestError("Kunne ikke kontakte serveren for at overtage login.", {
      retryable: true,
    });
  }

  const payload = await safeReadJson(response);

  if (!response.ok) {
    const message = payload?.message || payload?.Message || "Transfer-koden er ugyldig eller udløbet.";
    throw new AuthRequestError(message, {
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  return {
    access_token: payload.accessToken || payload.AccessToken,
    refresh_token: payload.refreshToken || payload.RefreshToken,
  };
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function getAdminAppHomeUrl() {
  return `${adminAppUrl.replace(/\/$/, "")}/home`;
}

export function getLoginUrl() {
  return loginUrl;
}

export function shouldSignOutOnAuthError(error) {
  return error?.status === 401 || error?.status === 403;
}

export function isRetryableAuthError(error) {
  return Boolean(error?.retryable);
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function hasToken(token) {
  return typeof token === "string" && token.trim().length > 0;
}
