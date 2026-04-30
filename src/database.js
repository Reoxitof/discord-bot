const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.PG_HOST     || 'postgres-5ljq.internal',
  port:     parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DB       || 'mydb',
  user:     process.env.PG_USER     || 'postgres',
  password: process.env.PG_PASSWORD || 'montage2026',
  ssl: false
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS levels (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      messages INTEGER DEFAULT 0,
      last_xp BIGINT DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS giveaways (
      id SERIAL PRIMARY KEY,
      message_id TEXT UNIQUE,
      channel_id TEXT,
      guild_id TEXT,
      prize TEXT,
      winners INTEGER DEFAULT 1,
      end_time BIGINT,
      ended INTEGER DEFAULT 0,
      host_id TEXT
    );

    CREATE TABLE IF NOT EXISTS warns (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      guild_id TEXT,
      reason TEXT,
      moderator_id TEXT,
      timestamp BIGINT
    );

    CREATE TABLE IF NOT EXISTS reaction_roles (
      message_id TEXT,
      emoji TEXT,
      role_id TEXT,
      PRIMARY KEY (message_id, emoji)
    );
  `);
  console.log('✅ PostgreSQL prêt');
}

// Helper: convertit les ? en $1, $2...
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Interface compatible avec l'ancien dbProxy (synchrone simulé via proxy async)
const db = {
  prepare: (sql) => ({
    run: async (...params) => {
      await pool.query(toPg(sql), params);
    },
    get: async (...params) => {
      const res = await pool.query(toPg(sql), params);
      return res.rows[0] || null;
    },
    all: async (...params) => {
      const res = await pool.query(toPg(sql), params);
      return res.rows;
    },
  }),
  exec: async (sql) => {
    await pool.query(sql);
  },
  init,
  save: () => {}, // no-op avec Postgres
  pool,
};

module.exports = db;
