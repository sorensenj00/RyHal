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

export function getLoginUrl() {
  return loginUrl;
}

export function getResetPasswordUrl() {
  return resetPasswordUrl;
}

export function getAppUrlForRedirectTarget(target) {
  return target === REDIRECT_TARGET.EMPLOYEE ? employeeAppUrl : adminAppUrl;
}

export async function fetchAuthMe(accessToken) {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await safeReadJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || "Kunne ikke hente login-oplysninger.");
  }

  return payload;
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
