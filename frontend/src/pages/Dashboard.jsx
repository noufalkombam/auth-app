import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../components/AuthContext.jsx";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile]   = useState(null);
  const [activity, setActivity] = useState([]);
  const [health, setHealth]     = useState(null);
  const [tab, setTab]           = useState("overview");
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    axios.get("/users/profile").then(r => setProfile(r.data)).catch(() => {});
    axios.get("/users/activity").then(r => setActivity(r.data.events || [])).catch(() => {});
    axios.get("/health").then(r => setHealth(r.data)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete your account? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await axios.delete("/users/account");
      window.location.href = "/login";
    } catch { setDeleting(false); }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString() : "—";
  const initials = user
    ? (user.firstName?.[0] || "") + (user.lastName?.[0] || user.displayName?.[0] || "")
    : "?";

  return (
    <div style={s.root}>
      {/* Background */}
      <div style={s.grid} aria-hidden="true" />

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="url(#lg2)"/>
            <path d="M12 20L20 12L28 20L20 28Z" fill="white" fillOpacity="0.9"/>
            <defs>
              <linearGradient id="lg2" x1="0" y1="0" x2="40" y2="40">
                <stop stopColor="#4f8ef7"/><stop offset="1" stopColor="#7c6af7"/>
              </linearGradient>
            </defs>
          </svg>
          <span style={s.brandName}>AuthApp</span>
        </div>

        <nav style={s.nav}>
          {[
            ["overview",  "⊞", "Overview"],
            ["activity",  "◷", "Activity"],
            ["health",    "◈", "Health"],
            ["settings",  "◎", "Settings"],
          ].map(([id, icon, label]) => (
            <button
              key={id}
              style={{ ...s.navBtn, ...(tab === id ? s.navBtnActive : {}) }}
              onClick={() => setTab(id)}
            >
              <span style={s.navIcon}>{icon}</span> {label}
            </button>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.avatar}>{initials.toUpperCase()}</div>
          <div style={{ minWidth: 0 }}>
            <div style={s.avatarName}>{user?.displayName || "User"}</div>
            <div style={s.avatarEmail}>{user?.email}</div>
          </div>
          <button
            style={s.logoutBtn}
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
          >
            {loggingOut ? <span className="spinner"/> : "→"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={s.main}>
        {/* Header */}
        <header style={s.header} className="fade-up">
          <div>
            <h1 style={s.pageTitle}>
              {tab === "overview" ? "Dashboard" :
               tab === "activity" ? "Login Activity" :
               tab === "health"   ? "System Health" : "Settings"}
            </h1>
            <p style={s.pageSub}>
              {tab === "overview" ? `Welcome back, ${user?.firstName || user?.displayName}!` :
               tab === "activity" ? "Your recent authentication events" :
               tab === "health"   ? "Infrastructure service status" :
               "Manage your account preferences"}
            </p>
          </div>
          {profile?.source && (
            <span style={{ ...s.badge, ...(profile.source === "cache" ? s.cacheBadge : s.dbBadge) }}>
              {profile.source === "cache" ? "🔴 Redis Cache" : "🐘 PostgreSQL"}
            </span>
          )}
        </header>

        {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
        {tab === "overview" && (
          <div style={s.grid2} className="fade-up fade-up-1">
            {/* Profile card */}
            <div style={{ ...s.card, gridColumn: "1 / -1" }}>
              <div style={s.profileRow}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" style={s.profileImg} referrerPolicy="no-referrer"/>
                  : <div style={s.profileInitials}>{initials.toUpperCase()}</div>
                }
                <div>
                  <h2 style={s.profileName}>{user?.displayName}</h2>
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>{user?.email}</p>
                  <div style={s.pills}>
                    <span style={s.pill}>Google Account</span>
                    <span style={{ ...s.pill, ...s.pillGreen }}>Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            {[
              { label: "Member since", value: fmt(user?.createdAt).split(",")[0], icon: "📅" },
              { label: "Last login", value: fmt(user?.lastLogin), icon: "🔐" },
              { label: "Login events", value: activity.length, icon: "📊" },
            ].map((stat) => (
              <div key={stat.label} style={s.statCard}>
                <span style={s.statIcon}>{stat.icon}</span>
                <div style={s.statValue}>{stat.value}</div>
                <div style={s.statLabel}>{stat.label}</div>
              </div>
            ))}

            {/* Info table */}
            <div style={{ ...s.card, gridColumn: "1 / -1" }}>
              <h3 style={s.cardTitle}>Account Details</h3>
              <table style={s.table}>
                <tbody>
                  {[
                    ["User ID",    profile?.id],
                    ["First Name", profile?.first_name],
                    ["Last Name",  profile?.last_name],
                    ["Locale",     profile?.locale || "en"],
                    ["Email",      profile?.email],
                  ].map(([k, v]) => (
                    <tr key={k} style={s.tr}>
                      <td style={s.tdKey}>{k}</td>
                      <td style={s.tdVal}>{v || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ACTIVITY TAB ─────────────────────────────────────── */}
        {tab === "activity" && (
          <div className="fade-up fade-up-1">
            <div style={s.card}>
              <h3 style={s.cardTitle}>Recent Events</h3>
              {activity.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>No events recorded yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activity.map((ev, i) => (
                    <div key={i} style={s.eventRow}>
                      <div style={{
                        ...s.eventDot,
                        background: ev.event_type === "login" ? "var(--success)" : "var(--warn)"
                      }}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, textTransform: "capitalize" }}>
                          {ev.event_type}
                        </div>
                        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>
                          IP: {ev.ip_address || "unknown"} · {fmt(ev.created_at)}
                        </div>
                      </div>
                      <span style={{
                        ...s.pill,
                        ...(ev.event_type === "login" ? s.pillGreen : s.pillWarn)
                      }}>
                        {ev.event_type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HEALTH TAB ────────────────────────────────────────── */}
        {tab === "health" && (
          <div style={s.grid2} className="fade-up fade-up-1">
            {health ? (
              <>
                <div style={{ ...s.card, gridColumn: "1 / -1" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <h3 style={s.cardTitle}>Overall Status</h3>
                    <span style={{ ...s.pill, ...s.pillGreen, fontSize: 13 }}>
                      {health.status === "ok" ? "✓ All Systems Operational" : "⚠ Degraded"}
                    </span>
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>
                    Last checked: {fmt(health.timestamp)}
                  </p>
                </div>

                {[
                  { name: "PostgreSQL", key: "postgres", icon: "🐘", desc: "Primary database" },
                  { name: "Redis",      key: "redis",    icon: "🔴", desc: "Session & cache store" },
                ].map(({ name, key, icon, desc }) => {
                  const up = health.services[key] === "connected";
                  return (
                    <div key={key} style={s.healthCard}>
                      <div style={s.healthTop}>
                        <span style={s.healthIcon}>{icon}</span>
                        <span style={{ ...s.pill, ...(up ? s.pillGreen : s.pillRed) }}>
                          {up ? "Connected" : "Error"}
                        </span>
                      </div>
                      <div style={s.healthName}>{name}</div>
                      <div style={{ color: "var(--muted)", fontSize: 13 }}>{desc}</div>
                      <div style={s.healthBar}>
                        <div style={{ ...s.healthBarFill, width: up ? "100%" : "30%",
                          background: up ? "var(--success)" : "var(--danger)" }}/>
                      </div>
                    </div>
                  );
                })}

                <div style={{ ...s.card, gridColumn: "1 / -1" }}>
                  <h3 style={s.cardTitle}>API Response</h3>
                  <pre style={s.pre}>{JSON.stringify(health, null, 2)}</pre>
                </div>
              </>
            ) : (
              <div style={{ ...s.card, gridColumn:"1/-1", display:"flex", gap:12, alignItems:"center" }}>
                <div className="spinner"/>
                <span style={{ color:"var(--muted)" }}>Fetching health data…</span>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ─────────────────────────────────────── */}
        {tab === "settings" && (
          <div className="fade-up fade-up-1" style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Preferences</h3>
              <p style={{ color:"var(--muted)", fontSize:14 }}>
                Notification and display settings coming soon.
              </p>
            </div>
            <div style={{ ...s.card, border:"1px solid rgba(248,113,113,0.25)" }}>
              <h3 style={{ ...s.cardTitle, color:"var(--danger)" }}>Danger Zone</h3>
              <p style={{ color:"var(--muted)", fontSize:14, marginBottom:16 }}>
                Permanently deletes your account and all associated data. This action cannot be undone.
              </p>
              <button
                style={s.deleteBtn}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <><span className="spinner"/>&nbsp;Deleting…</> : "Delete Account"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  root: {
    display: "flex", minHeight: "100vh", position: "relative", overflow: "hidden",
  },
  grid: {
    position: "fixed", inset: 0, zIndex: 0,
    backgroundImage: `linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)`,
    backgroundSize: "48px 48px",
    pointerEvents: "none",
  },
  sidebar: {
    width: 240, minHeight: "100vh", background: "var(--surface)",
    borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", padding: "24px 16px",
    position: "sticky", top: 0, height: "100vh",
    zIndex: 10,
  },
  brand: { display:"flex", alignItems:"center", gap:10, marginBottom:32, paddingLeft:8 },
  brandName: { fontSize:18, fontWeight:700, letterSpacing:"-0.3px" },
  nav: { display:"flex", flexDirection:"column", gap:4, flex:1 },
  navBtn: {
    display:"flex", alignItems:"center", gap:10,
    padding:"10px 12px", borderRadius:8, fontSize:14,
    background:"transparent", color:"var(--muted)",
    transition:"all 0.15s", textAlign:"left", fontWeight:500,
  },
  navBtnActive: { background:"rgba(79,142,247,0.12)", color:"var(--accent)" },
  navIcon: { fontSize:16, width:20, textAlign:"center" },
  sidebarFooter: {
    display:"flex", alignItems:"center", gap:10,
    padding:"12px", borderTop:"1px solid var(--border)", marginTop:16,
  },
  avatar: {
    width:36, height:36, borderRadius:99,
    background:"linear-gradient(135deg, #4f8ef7, #7c6af7)",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:13, fontWeight:700, flexShrink:0,
  },
  avatarName: { fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  avatarEmail: { fontSize:11, color:"var(--muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  logoutBtn: {
    marginLeft:"auto", background:"transparent", color:"var(--muted)",
    fontSize:16, padding:"4px 8px", borderRadius:6,
    transition:"color 0.2s",
  },
  main: { flex:1, padding:"32px", zIndex:1, maxWidth:"calc(100vw - 240px)", overflowX:"hidden" },
  header: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 },
  pageTitle: { fontSize:24, fontWeight:700, letterSpacing:"-0.5px" },
  pageSub: { color:"var(--muted)", fontSize:14, marginTop:4 },
  badge: { padding:"6px 14px", borderRadius:99, fontSize:12, fontWeight:600, fontFamily:"var(--font-mono)" },
  cacheBadge: { background:"rgba(248,113,113,0.15)", color:"#f87171", border:"1px solid rgba(248,113,113,0.3)" },
  dbBadge:    { background:"rgba(52,211,153,0.1)",  color:"var(--success)", border:"1px solid rgba(52,211,153,0.3)" },
  grid2: { display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16 },
  card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:24 },
  cardTitle: { fontSize:15, fontWeight:600, marginBottom:16 },
  profileRow: { display:"flex", alignItems:"center", gap:20 },
  profileImg: { width:72, height:72, borderRadius:99, border:"2px solid var(--border)" },
  profileInitials: {
    width:72, height:72, borderRadius:99,
    background:"linear-gradient(135deg,#4f8ef7,#7c6af7)",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:24, fontWeight:700,
  },
  profileName: { fontSize:20, fontWeight:700, letterSpacing:"-0.3px" },
  pills: { display:"flex", gap:6, marginTop:10, flexWrap:"wrap" },
  pill: {
    padding:"3px 10px", borderRadius:99, fontSize:12,
    background:"rgba(255,255,255,0.06)", border:"1px solid var(--border)", color:"var(--muted)",
  },
  pillGreen: { background:"rgba(52,211,153,0.1)", color:"var(--success)", border:"1px solid rgba(52,211,153,0.25)" },
  pillWarn:  { background:"rgba(251,191,36,0.1)",  color:"var(--warn)",    border:"1px solid rgba(251,191,36,0.25)" },
  pillRed:   { background:"rgba(248,113,113,0.1)", color:"var(--danger)",  border:"1px solid rgba(248,113,113,0.25)" },
  statCard: {
    background:"var(--surface)", border:"1px solid var(--border)",
    borderRadius:16, padding:24, display:"flex", flexDirection:"column", gap:4,
  },
  statIcon: { fontSize:22, marginBottom:4 },
  statValue: { fontSize:18, fontWeight:700 },
  statLabel: { color:"var(--muted)", fontSize:13 },
  table: { width:"100%", borderCollapse:"collapse" },
  tr: { borderBottom:"1px solid var(--border)" },
  tdKey: { padding:"12px 0", color:"var(--muted)", fontSize:13, width:140, fontFamily:"var(--font-mono)" },
  tdVal: { padding:"12px 0", fontSize:14, wordBreak:"break-all" },
  eventRow: {
    display:"flex", alignItems:"center", gap:14,
    padding:"12px 16px", borderRadius:10,
    background:"var(--surface2)", border:"1px solid var(--border)",
  },
  eventDot: { width:10, height:10, borderRadius:99, flexShrink:0 },
  healthCard: {
    background:"var(--surface)", border:"1px solid var(--border)",
    borderRadius:16, padding:24,
  },
  healthTop: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  healthIcon: { fontSize:28 },
  healthName: { fontSize:17, fontWeight:700, marginBottom:4 },
  healthBar: { height:4, background:"var(--border)", borderRadius:99, marginTop:16, overflow:"hidden" },
  healthBarFill: { height:"100%", borderRadius:99, transition:"width 1s ease" },
  pre: {
    background:"var(--surface2)", borderRadius:8, padding:16,
    fontSize:12, fontFamily:"var(--font-mono)", color:"var(--muted)",
    overflowX:"auto", lineHeight:1.7,
  },
  deleteBtn: {
    padding:"10px 20px", borderRadius:8, fontSize:14, fontWeight:600,
    background:"rgba(248,113,113,0.15)", color:"var(--danger)",
    border:"1px solid rgba(248,113,113,0.3)",
    display:"flex", alignItems:"center", gap:8, transition:"all 0.2s",
  },
};
