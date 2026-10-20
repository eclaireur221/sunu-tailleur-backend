const { Pool } = require('pg');
require('dotenv').config();

// On utilise directement l'URL complète fournie par Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Obligatoire pour se connecter à Neon
  }
});

pool.connect()
  .then(() => console.log(' Connecté à la base de données Neon (Cloud)'))
  .catch(err => console.error('!! Erreur de connexion à la base:', err.message));

module.exports = pool;