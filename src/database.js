const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'bot.db');

// S'assurer que le dossier data existe
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialisation des tables
  db.run(`
    CREATE TABLE IF NOT EXISTS levels (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      messages INTEGER DEFAULT 0,
      last_xp INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE,
      channel_id TEXT,
      guild_id TEXT,
      prize TEXT,
      winners INTEGER DEFAULT 1,
      end_time INTEGER,
      ended INTEGER DEFAULT 0,
      host_id TEXT
    );

    CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      guild_id TEXT,
      reason TEXT,
      moderator_id TEXT,
      timestamp INTEGER
    );

    CREATE TABLE IF NOT EXISTS reaction_roles (
      message_id TEXT,
      emoji TEXT,
      role_id TEXT,
      PRIMARY KEY (message_id, emoji)
    );
  `);

  save();
  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Sauvegarde automatique toutes les 30 secondes
setInterval(save, 30000);

// Wrappers synchrones pour simplifier l'usage
const dbProxy = {
  prepare: (sql) => ({
    run: (...params) => {
      if (!db) throw new Error('DB non initialisée');
      db.run(sql, params);
      save();
    },
    get: (...params) => {
      if (!db) throw new Error('DB non initialisée');
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return null;
    },
    all: (...params) => {
      if (!db) throw new Error('DB non initialisée');
      const results = [];
      const stmt = db.prepare(sql);
      stmt.bind(params);
      while (stmt.step()) results.push(stmt.getAsObject());
      stmt.free();
      return results;
    },
  }),
  exec: (sql) => {
    if (!db) throw new Error('DB non initialisée');
    db.run(sql);
    save();
  },
  init: getDb,
  save,
};

module.exports = dbProxy;
