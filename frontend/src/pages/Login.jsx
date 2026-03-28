import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const ERROR_MAP = {
  auth_failed: "Google sign-in was unsuccessful. Please try again.",
  server_error: "A server error occurred. Please try again shortly.",
};

export default function Login() {
  const [params] = useSearchParams();
  const [hover, setHover] = useState(false);
  const errorMsg = ERROR_MAP[params.get("error")] || null;

  return (
    <div style={styles.root}>
      {/* Background grid */}
      <div style={styles.grid} aria-hidden="true" />

      {/* Glow orbs */}
      <div style={{...styles.orb, ...styles.orb1}} aria-hidden="true" />
      <div style={{...styles.orb, ...styles.orb2}} aria-hidden="true" />

      <div style={styles.card} className="fade-up">
        {/* Logo mark */}
        <div style={styles.logoWrap}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="url(#lg)" />
            <path d="M12 20 L20 12 L28 20 L20 28 Z" fill="white" fillOpacity="0.9"/>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
                <stop stopColor="#4f8ef7"/>
                <stop offset="1" stopColor="#7c6af7"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 style={styles.heading} className="fade-up fade-up-1">Welcome back</h1>
        <p style={styles.sub} className="fade-up fade-up-2">
          Sign in with your Google account to continue
        </p>

        {errorMsg && (
          <div style={styles.errorBanner}>
            <span>⚠</span> {errorMsg}
          </div>
        )}

        <a
          href="/auth/google"
          style={{ ...styles.googleBtn, ...(hover ? styles.googleBtnHover : {}) }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="fade-up fade-up-3"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <p style={styles.terms} className="fade-up fade-up-4">
          By signing in, you agree to our{" "}
          <span style={{ color: "var(--accent)" }}>Terms of Service</span> and{" "}
          <span style={{ color: "var(--accent)" }}>Privacy Policy</span>
        </p>
      </div>

      {/* Tech stack pills */}
      <div style={styles.pills} className="fade-up fade-up-4">
        {["Node.js", "React", "PostgreSQL", "Redis", "Docker"].map((t) => (
          <span key={t} style={styles.pill}>{t}</span>
        ))}
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: "24px",
    gap: "24px",
  },
  grid: {
    position: "fixed", inset: 0,
    backgroundImage: `linear-gradient(rgba(79,142,247,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(79,142,247,0.04) 1px, transparent 1px)`,
    backgroundSize: "48px 48px",
    pointerEvents: "none",
  },
  orb: {
    position: "fixed", borderRadius: "50%",
    filter: "blur(80px)", pointerEvents: "none",
  },
  orb1: {
    width: 500, height: 500, top: "-150px", right: "-100px",
    background: "radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)",
  },
  orb2: {
    width: 400, height: 400, bottom: "-100px", left: "-80px",
    background: "radial-gradient(circle, rgba(124,106,247,0.1) 0%, transparent 70%)",
  },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
    position: "relative",
    zIndex: 1,
  },
  logoWrap: { marginBottom: "8px" },
  heading: { fontSize: "26px", fontWeight: 600, letterSpacing: "-0.5px" },
  sub: { color: "var(--muted)", fontSize: "14px", textAlign: "center" },
  errorBanner: {
    background: "rgba(248,113,113,0.12)",
    border: "1px solid rgba(248,113,113,0.3)",
    color: "#f87171",
    borderRadius: 8, padding: "12px 16px",
    fontSize: "13px", width: "100%",
    display: "flex", gap: "8px", alignItems: "center",
  },
  googleBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "12px", width: "100%", padding: "14px",
    background: "white", color: "#1f2937",
    borderRadius: 10, fontWeight: 600, fontSize: "15px",
    transition: "all 0.2s", boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
    marginTop: "8px",
  },
  googleBtnHover: {
    background: "#f3f4f6",
    transform: "translateY(-1px)",
    boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
  },
  terms: { fontSize: "12px", color: "var(--muted)", textAlign: "center", lineHeight: 1.6 },
  pills: {
    display: "flex", gap: "8px", flexWrap: "wrap",
    justifyContent: "center", position: "relative", zIndex: 1,
  },
  pill: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border)",
    borderRadius: 99, padding: "4px 12px",
    fontSize: "12px", color: "var(--muted)",
    fontFamily: "var(--font-mono)",
  },
};
