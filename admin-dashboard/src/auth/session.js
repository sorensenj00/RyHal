const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5172/api";
const adminAppUrl = process.env.REACT_APP_ADMIN_APP_URL || window.location.origin;
const employeeAppUrl = process.env.REACT_APP_EMPLOYEE_APP_URL || "http://localhost:5173";
const loginUrl = process.env.REACT_APP_LOGIN_URL || `${adminAppUrl.replace(/\/$/, "")}/login`;
const resetPasswordUrl = process.env.REACT_APP_RESET_PASSWORD_URL || `${adminAppUrl.replace(/\/$/, "")}/reset-password`;

export const APP_ACCESS = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

export const REDIRECT_TARGET = {
  ADMIN: "admin-dashboard",
  EMPLOYEE: "employee-app",
};

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function getAdminAppUrl() {
  return adminAppUrl;
}

export function getEmployeeAppUrl() {
  return employeeAppUrl;
}

export async function createEmployeeAppTransferUrl(session) {
  const baseUrl = employeeAppUrl.replace(/\/$/, "");

  if (!hasToken(session?.access_token) || !hasToken(session?.refresh_token)) {
    return baseUrl;
  }

  const response = await fetch(`${apiBaseUrl}/auth/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      refreshToken: session.refresh_token,
    }),
  });

  const payload = await safeReadJson(response);
  if (!response.ok) {
    const message = payload?.message || payload?.Message || "Kunne ikke oprette sikker app-overførsel.";
    throw new AuthRequestError(message, {
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  const url = new URL(baseUrl);
  url.searchParams.set("transfer_code", payload.transferCode || payload.TransferCode);
  return url.toString();
}

export function getLoginUrl() {
  return loginUrl;
}

export function getResetPasswordUrl() {
  return resetPasswordUrl;
}

export function getAppUrlForRedirectTarget(target) {
  return target === REDIRECT_TARGET.EMPLOYEE ? employeeAppUrl : adminAppUrl;
}

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
