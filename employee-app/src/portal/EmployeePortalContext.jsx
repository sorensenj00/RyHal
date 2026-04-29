/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { APP_ACCESS, fetchAuthMe, getAdminAppHomeUrl, getApiBaseUrl, getLoginUrl, isRetryableAuthError, shouldSignOutOnAuthError } from "../auth/session";

const DEFAULT_WEEK_DAYS = 7;
const EmployeePortalContext = createContext(null);

function getWeekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const start = new Date(now);
  start.setDate(now.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + DEFAULT_WEEK_DAYS - 1);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function buildApiUrl(path, params = {}) {
  const url = new URL(path, getApiBaseUrl());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function getTransferredSessionFromUrl() {
  const url = new URL(window.location.href);
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  url.searchParams.delete("access_token");
  url.searchParams.delete("refresh_token");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function EmployeePortalProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [hoursOverview, setHoursOverview] = useState(null);
  const [swapRequests, setSwapRequests] = useState([]);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Henter medarbejderportal...");
  const [authRetryTick, setAuthRetryTick] = useState(0);
  const weekRange = useMemo(() => getWeekRange(), []);
  const isRedirectingRef = useRef(false);
  const retryAuth = () => {
    isRedirectingRef.current = false;
    setError("");
    setStatusMessage("Prøver at gendanne session...");
    setLoading(true);
    setAuthRetryTick((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const fetchJson = async (url, token) => {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await safeReadJson(response);

      if (!response.ok) {
        throw new Error(payload?.message || "Noget gik galt.");
      }

      return payload;
    };

    const redirectToLogin = async (message, { signOut = true } = {}) => {
      if (isRedirectingRef.current) {
        return;
      }

      isRedirectingRef.current = true;
      if (!active) return;
      setProfile(null);
      setHoursOverview(null);
      setSwapRequests([]);
      setError("");
      setStatusMessage(message || "Sender dig til login...");
      setLoading(false);

      if (signOut) {
        await supabase?.auth.signOut();
      }

      window.location.replace(getLoginUrl());
    };

    const loadEmployeeData = async (token) => {
      const [overviewResult, swapsResult] = await Promise.allSettled([
        fetchJson(
          buildApiUrl("/api/employee-hours", {
            startDate: weekRange.start.toISOString(),
            endDate: weekRange.end.toISOString(),
          }),
          token
        ),
        fetchJson(buildApiUrl("/api/swaprequests"), token),
      ]);

      if (!active) return;

      const nextErrors = [];

      if (overviewResult.status === "fulfilled") {
        setHoursOverview(overviewResult.value);
      } else {
        setHoursOverview(null);
        nextErrors.push(overviewResult.reason?.message || "Kunne ikke hente timeoversigten.");
      }

      if (swapsResult.status === "fulfilled") {
        setSwapRequests(Array.isArray(swapsResult.value) ? swapsResult.value : []);
      } else {
        setSwapRequests([]);
        nextErrors.push(swapsResult.reason?.message || "Kunne ikke hente bytteforespørgsler.");
      }

      setError(nextErrors.join(" "));
    };

    const resolveSession = async (nextSession, { hasRetried = false, hasRefreshed = false } = {}) => {
      if (isRedirectingRef.current) {
        return;
      }

      if (!nextSession?.access_token) {
        await redirectToLogin("Ingen aktiv medarbejdersession.", { signOut: false });
        return;
      }

      try {
        const authMe = await fetchAuthMe(nextSession.access_token);

        if (!active) return;

        if (authMe.appAccess !== APP_ACCESS.EMPLOYEE) {
          setStatusMessage("Denne bruger hører til admin-dashboardet.");
          setLoading(false);
          window.location.replace(getAdminAppHomeUrl());
          return;
        }

        setProfile(authMe);
        setError("");
        await loadEmployeeData(nextSession.access_token);

        if (!active) return;
        setLoading(false);
      } catch (err) {
        if (!hasRefreshed && shouldSignOutOnAuthError(err) && nextSession?.refresh_token) {
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          if (!active) return;

          if (!refreshError && data?.session?.access_token) {
            await resolveSession(data.session, { hasRetried, hasRefreshed: true });
            return;
          }
        }

        if (!hasRetried && isRetryableAuthError(err)) {
          await pause(1000);
          if (!active) return;

          const { data: { session: latestSession } } = await supabase.auth.getSession();
          await resolveSession(latestSession ?? nextSession, { hasRetried: true, hasRefreshed });
          return;
        }

        if (shouldSignOutOnAuthError(err)) {
          await redirectToLogin(err.message || "Kunne ikke bekræfte adgang.");
          return;
        }

        setError(err.message || "Kunne ikke bekræfte adgang lige nu.");
        setStatusMessage(err.message || "Kunne ikke bekræfte adgang lige nu.");
        setLoading(false);
      }
    };

    if (!supabase?.auth) {
      redirectToLogin("Supabase er ikke konfigureret.");
      return () => {
        active = false;
      };
    }

    const bootstrapSession = async () => {
      const transferredSession = getTransferredSessionFromUrl();

      if (transferredSession) {
        const { data, error } = await supabase.auth.setSession(transferredSession);

        if (error) {
          await redirectToLogin("Kunne ikke overtage login-sessionen.", { signOut: false });
          return;
        }

        await resolveSession(data.session);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      await resolveSession(session);
    };

    bootstrapSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT" && isRedirectingRef.current) {
        return;
      }

      resolveSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authRetryTick, weekRange.end, weekRange.start]);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    window.location.replace(getLoginUrl());
  };

  return (
    <EmployeePortalContext.Provider
      value={{
        error,
        handleLogout,
        hoursOverview,
        loading,
        profile,
        retryAuth,
        canRetryAuth: !loading && !profile && !isRedirectingRef.current,
        statusMessage,
        swapRequests,
        weekRange,
      }}
    >
      {children}
    </EmployeePortalContext.Provider>
  );
}

export function useEmployeePortal() {
  const context = useContext(EmployeePortalContext);

  if (!context) {
    throw new Error("useEmployeePortal skal bruges inde i EmployeePortalProvider.");
  }

  return context;
}
