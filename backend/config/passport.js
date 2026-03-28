const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { query } = require("./db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;
        const firstName = profile.name?.givenName;
        const lastName = profile.name?.familyName;
        const avatarUrl = profile.photos?.[0]?.value;
        const locale = profile._json?.locale;

        // Upsert user: insert on first login, update on subsequent logins
        const result = await query(
          `INSERT INTO users
             (google_id, email, display_name, first_name, last_name, avatar_url, locale, last_login)
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
           ON CONFLICT (google_id) DO UPDATE SET
             email        = EXCLUDED.email,
             display_name = EXCLUDED.display_name,
             first_name   = EXCLUDED.first_name,
             last_name    = EXCLUDED.last_name,
             avatar_url   = EXCLUDED.avatar_url,
             locale       = EXCLUDED.locale,
             last_login   = NOW()
           RETURNING *`,
          [googleId, email, displayName, firstName, lastName, avatarUrl, locale]
        );

        return done(null, result.rows[0]);
      } catch (err) {
        console.error("[Passport] Google strategy error:", err);
        return done(err, null);
      }
    }
  )
);

// Store user UUID in session (not the whole object)
passport.serializeUser((user, done) => done(null, user.id));

// Restore full user from DB on each request
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0] || false);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
