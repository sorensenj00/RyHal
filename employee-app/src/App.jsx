import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { APP_ACCESS, fetchAuthMe, getAdminAppHomeUrl, getLoginUrl, getApiBaseUrl } from "./auth/session";
import "./App.css";

const DEFAULT_WEEK_DAYS = 7;

function formatMinutes(totalMinutes = 0) {
  return `${(totalMinutes / 60).toFixed(2)} timer`;
}

function formatDate(value) {
  if (!value) return "Ingen dato";
  const date = new Date(value);
  return new Intl.DateTimeFormat("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

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

function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [hoursOverview, setHoursOverview] = useState(null);
  const [swapRequests, setSwapRequests] = useState([]);
  const [activeView, setActiveView] = useState("home");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("Henter medarbejderportal...");

  const weekRange = useMemo(() => getWeekRange(), []);

  useEffect(() => {
    let active = true;

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

    const redirectToLogin = async (message) => {
      if (!active) return;
      setStatusMessage(message || "Sender dig til login...");
      setLoading(false);
      await supabase?.auth.signOut();
      window.location.replace(getLoginUrl());
    };

    const loadEmployeeData = async (token) => {
      const [overview, swaps] = await Promise.all([
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

      setHoursOverview(overview);
      setSwapRequests(Array.isArray(swaps) ? swaps : []);
    };

    const resolveSession = async (nextSession) => {
      if (!nextSession?.access_token) {
        await redirectToLogin("Ingen aktiv medarbejdersession.");
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
        await redirectToLogin(err.message || "Kunne ikke bekræfte adgang.");
      }
    };

    if (!supabase?.auth) {
      redirectToLogin("Supabase er ikke konfigureret.");
      return () => {
        active = false;
      };
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      resolveSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [weekRange.end, weekRange.start]);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    window.location.replace(getLoginUrl());
  };

  const summary = hoursOverview?.summary || {};
  const rows = hoursOverview?.rows || [];
  const firstRow = rows[0] || null;
  const latestSwap = swapRequests[0] || null;

  const navItems = [
    { key: "home", label: "Oversigt" },
    { key: "hours", label: "Mine timer" },
    { key: "swaps", label: "Bytteforespørgsler" },
    { key: "profile", label: "Profil" },
  ];

  if (loading) {
    return (
      <div className="employee-app">
        <div className="employee-loading">
          <p className="eyebrow">Medarbejderportal</p>
          <h1>{statusMessage}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-app-shell">
      <aside className="employee-sidebar">
        <div>
          <div className="employee-brand">
            <div className="employee-brand-mark">RH</div>
            <div>
              <strong>RyHal</strong>
              <span>Medarbejderportal</span>
            </div>
          </div>

          <nav className="employee-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`employee-nav-item ${activeView === item.key ? "active" : ""}`}
                onClick={() => setActiveView(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="employee-sidebar-footer">
          <div className="employee-user-chip">
            <span>{profile?.firstName?.[0] || "M"}</span>
            <div>
              <strong>{profile?.firstName} {profile?.lastName}</strong>
              <p>{profile?.email}</p>
            </div>
          </div>

          <button className="employee-logout" onClick={handleLogout}>
            Log ud
          </button>
        </div>
      </aside>

      <main className="employee-main">
        <header className="employee-hero">
          <div>
            <p className="eyebrow">Medarbejderportal</p>
            <h1>Velkommen tilbage, {profile?.firstName || "medarbejder"}</h1>
            <p className="hero-copy">
              Her kan du holde styr på dine timer, se bytteforespørgsler og få et hurtigt overblik over din uge.
            </p>
          </div>

          <div className="employee-hero-badge">
            <span>App-adgang</span>
            <strong>{profile?.appAccess}</strong>
          </div>
        </header>

        {error && <div className="employee-alert">{error}</div>}

        {(activeView === "home" || activeView === "hours" || activeView === "swaps" || activeView === "profile") && (
          <section className="employee-stats">
            <article className="stat-card accent">
              <span>Mine timer</span>
              <strong>{formatMinutes(summary.totalMinutes || 0)}</strong>
              <p>i uge {formatDate(weekRange.start)}</p>
            </article>

            <article className="stat-card">
              <span>Mine vagter</span>
              <strong>{summary.totalShiftCount ?? 0}</strong>
              <p>registreret denne uge</p>
            </article>

            <article className="stat-card">
              <span>Bytteforespørgsler</span>
              <strong>{swapRequests.length}</strong>
              <p>aktive eller historiske</p>
            </article>
          </section>
        )}

        {activeView === "home" && (
          <section className="employee-grid">
            <article className="panel panel-wide">
              <div className="panel-header">
                <h2>Din uge</h2>
                <span>{formatDate(weekRange.start)} - {formatDate(weekRange.end)}</span>
              </div>

              <div className="panel-content">
                {firstRow ? (
                  <div className="info-list">
                    <div>
                      <span>Navn</span>
                      <strong>{firstRow.fullName}</strong>
                    </div>
                    <div>
                      <span>Rolle</span>
                      <strong>{firstRow.roleName}</strong>
                    </div>
                    <div>
                      <span>Seneste vagt</span>
                      <strong>{formatDate(firstRow.lastShiftEnd)}</strong>
                    </div>
                    <div>
                      <span>Gennemsnit pr. vagt</span>
                      <strong>{firstRow.averageHoursPerShift} timer</strong>
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">Ingen timer fundet for den valgte periode.</p>
                )}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <h2>Seneste bytte</h2>
                <span>Opdateres løbende</span>
              </div>
              <div className="panel-content">
                {latestSwap ? (
                  <div className="stacked-card">
                    <strong># {latestSwap.swapRequestId}</strong>
                    <p>Status: {latestSwap.status?.name || "Ukendt"}</p>
                    <p>Oprettet: {formatDate(latestSwap.createdAt)}</p>
                  </div>
                ) : (
                  <p className="empty-state">Ingen bytteforespørgsler endnu.</p>
                )}
              </div>
            </article>
          </section>
        )}

        {activeView === "hours" && (
          <section className="panel panel-full">
            <div className="panel-header">
              <h2>Mine timer</h2>
              <span>{rows.length} række(r)</span>
            </div>

            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Navn</th>
                    <th>Rolle</th>
                    <th>Vagter</th>
                    <th>Timer</th>
                    <th>Første vagt</th>
                    <th>Sidste vagt</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.employeeId}>
                      <td>{row.fullName}</td>
                      <td>{row.roleName}</td>
                      <td>{row.shiftCount}</td>
                      <td>{row.totalHours}</td>
                      <td>{formatDate(row.firstShiftStart)}</td>
                      <td>{formatDate(row.lastShiftEnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeView === "swaps" && (
          <section className="employee-grid">
            <article className="panel panel-full">
              <div className="panel-header">
                <h2>Bytteforespørgsler</h2>
                <span>{swapRequests.length} total</span>
              </div>

              <div className="stack-list">
                {swapRequests.length > 0 ? (
                  swapRequests.map((swap) => (
                    <div key={swap.swapRequestId} className="stacked-card">
                      <strong>Swap #{swap.swapRequestId}</strong>
                      <p>Status: {swap.status?.name || "Ukendt"}</p>
                      <p>Requester: {swap.requesterId} • Target: {swap.targetEmployeeId}</p>
                      <p>Oprettet: {formatDate(swap.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">Ingen bytteforespørgsler for dig endnu.</p>
                )}
              </div>
            </article>
          </section>
        )}

        {activeView === "profile" && (
          <section className="employee-grid">
            <article className="panel panel-full">
              <div className="panel-header">
                <h2>Profil</h2>
                <span>Din konto</span>
              </div>

              <div className="panel-content">
                <div className="info-list">
                  <div>
                    <span>Navn</span>
                    <strong>{profile?.firstName} {profile?.lastName}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{profile?.email}</strong>
                  </div>
                  <div>
                    <span>Medarbejder-ID</span>
                    <strong>{profile?.employeeId}</strong>
                  </div>
                  <div>
                    <span>Supabase ID</span>
                    <strong>{profile?.supabaseUserId}</strong>
                  </div>
                  <div>
                    <span>App-adgang</span>
                    <strong>{profile?.appAccess}</strong>
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default App;
