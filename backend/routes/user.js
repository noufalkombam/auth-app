const router = require("express").Router();
const { query } = require("../config/db");
const { cacheGet, cacheSet, cacheDel } = require("../config/redis");
const { requireAuth } = require("../middleware/auth");

// All user routes require auth
router.use(requireAuth);

// ── GET /users/profile ───────────────────────────────────────────
// Returns full profile, uses Redis cache (TTL: 5 min)
router.get("/profile", async (req, res) => {
  const cacheKey = `user:profile:${req.user.id}`;
  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ source: "cache", ...cached });
    }

    const result = await query(
      `SELECT id, email, display_name, first_name, last_name,
              avatar_url, locale, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) return res.status(404).json({ error: "User not found" });

    const profile = result.rows[0];
    await cacheSet(cacheKey, profile, 300); // 5 minute cache

    res.json({ source: "db", ...profile });
  } catch (err) {
    console.error("[User] Profile fetch error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ── GET /users/activity ──────────────────────────────────────────
// Returns last 10 login events for the current user
router.get("/activity", async (req, res) => {
  const cacheKey = `user:activity:${req.user.id}`;
  try {
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ source: "cache", events: cached });

    const result = await query(
      `SELECT event_type, ip_address, user_agent, created_at
       FROM login_events
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    await cacheSet(cacheKey, result.rows, 60); // 1 minute cache
    res.json({ source: "db", events: result.rows });
  } catch (err) {
    console.error("[User] Activity fetch error:", err);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// ── DELETE /users/account ────────────────────────────────────────
// Permanently deletes the user account
router.delete("/account", async (req, res) => {
  const userId = req.user.id;
  try {
    await cacheDel(`user:profile:${userId}`);
    await cacheDel(`user:activity:${userId}`);
    await query("DELETE FROM users WHERE id = $1", [userId]);

    req.logout((err) => {
      if (err) console.error("[User] Logout error on delete:", err);
      req.session.destroy(() => res.json({ message: "Account deleted" }));
    });
  } catch (err) {
    console.error("[User] Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

module.exports = router;
