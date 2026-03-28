require("dotenv").config();
const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { redis } = require("./config/redis");
const { pool } = require("./config/db");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// ── Security headers ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,                     // required for cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));


app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,        // MUST be false (no HTTPS)
    httpOnly: true,
    sameSite: "lax",      // IMPORTANT for your setup
  },
}));


// ── Request logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// ── Body parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/auth", limiter);

// ── Redis-backed session ─────────────────────────────────────────
app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: process.env.SESSION_SECRET || "dev_secret_change_me",
    name: "sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: parseInt(process.env.SESSION_TTL || "86400") * 1000,
    },
  })
);


// -- FIX SESSION CONFIG (CRITICAL) -----------------------------------
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,        // 🔥 MUST be false (no HTTPS yet)
    httpOnly: true,
    sameSite: "lax",      // 🔥 important for your setup
  },
}));


// ── Passport ─────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ───────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// ── Health check ─────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  try {
    const [dbRes, redisRes] = await Promise.allSettled([
      pool.query("SELECT 1"),
      redis.ping(),
    ]);
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        postgres: dbRes.status === "fulfilled" ? "connected" : "error",
        redis: redisRes.status === "fulfilled" ? "connected" : "error",
      },
    });
  } catch (err) {
    res.status(503).json({ status: "degraded", error: err.message });
  }
});

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.path} not found` }));

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   Client URL  : ${process.env.CLIENT_URL}\n`);
});

module.exports = app;
