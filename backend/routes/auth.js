const router = require("express").Router();
const passport = require("../config/passport");
const { query } = require("../config/db");
const { attachClientIp } = require("../middleware/auth");

// ── Initiate Google OAuth ────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",  // always show account picker
  })
);

// ── Google OAuth callback ────────────────────────────────────────
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
    session: true,
  }),
  attachClientIp,
  async (req, res) => {
    try {
      // Log the login event (non-blocking)
      query(
        `INSERT INTO login_events (user_id, ip_address, user_agent, event_type)
         VALUES ($1, $2, $3, 'login')`,
        [req.user.id, req.clientIp, req.headers["user-agent"]]
      ).catch((e) => console.error("[Auth] Failed to write login event:", e.message));

      res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (err) {
      console.error("[Auth] Callback error:", err);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  }
);

// ── Get current session user ─────────────────────────────────────
router.get("/me", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ authenticated: false });
  }
  const { id, email, display_name, first_name, last_name, avatar_url, created_at, last_login } = req.user;
  res.json({
    authenticated: true,
    user: { id, email, displayName: display_name, firstName: first_name, lastName: last_name, avatarUrl: avatar_url, createdAt: created_at, lastLogin: last_login },
  });
});

// ── Logout ───────────────────────────────────────────────────────
router.post("/logout", attachClientIp, async (req, res) => {
  if (req.user) {
    // Log the logout event (non-blocking)
    query(
      `INSERT INTO login_events (user_id, ip_address, user_agent, event_type)
       VALUES ($1, $2, $3, 'logout')`,
      [req.user.id, req.clientIp, req.headers["user-agent"]]
    ).catch((e) => console.error("[Auth] Failed to write logout event:", e.message));
  }

  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    req.session.destroy(() => {
      res.clearCookie("sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

module.exports = router;
