const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5172/api";
const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:3000";
const loginUrl = import.meta.env.VITE_LOGIN_URL || "http://localhost:3000/login";

export const APP_ACCESS = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

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

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function getAdminAppHomeUrl() {
  return `${adminAppUrl.replace(/\/$/, "")}/home`;
}

export function getLoginUrl() {
  return loginUrl;
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
