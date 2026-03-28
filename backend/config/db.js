const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20,                  // max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === "production" && process.env.DB_SSL === "true"
    ? { rejectUnauthorized: false }
    : false,
});

pool.on("connect", () => {
  if (process.env.NODE_ENV !== "test") {
    console.log("[DB] New PostgreSQL connection established");
  }
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected PostgreSQL error:", err.message);
});

/**
 * Wrapper for single queries — automatically acquires & releases client
 */
const query = (text, params) => pool.query(text, params);

/**
 * Transaction helper — commits on success, rolls back on error
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, withTransaction };
