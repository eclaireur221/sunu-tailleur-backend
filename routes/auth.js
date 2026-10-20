const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// --- ROUTE : INSCRIPTION ---
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, telephone, email, mot_de_passe, role, nom_atelier } = req.body;

    const userExists = await db.query('SELECT * FROM users WHERE telephone = $1', [telephone]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Ce numéro de téléphone est déjà utilisé." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mot_de_passe, salt);

    const newUser = await db.query(
      `INSERT INTO users (nom, prenom, telephone, email, mot_de_passe_hash, role) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nom, prenom, role`,
      [nom, prenom, telephone, email, hashedPassword, role]
    );

    if (role === 'couturier') {
      const nomAtelierFinal = nom_atelier || `Atelier de ${prenom}`;
      await db.query(
        `INSERT INTO couturiers (user_id, nom_atelier) VALUES ($1, $2)`,
        [newUser.rows[0].id, nomAtelierFinal]
      );
    }

    res.status(201).json({ message: "Inscription réussie !", user: newUser.rows[0] });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

// --- ROUTE : CONNEXION ---
router.post('/login', async (req, res) => {
  try {
    const { telephone, mot_de_passe } = req.body;

    // On joint la table couturiers pour récupérer l'ID du couturier et son statut
    const user = await db.query(`
      SELECT u.*, c.id as couturier_id, c.verifie 
      FROM users u 
      LEFT JOIN couturiers c ON u.id = c.user_id 
      WHERE u.telephone = $1
    `, [telephone]);

    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Numéro de téléphone ou mot de passe incorrect." });
    }

    const validPassword = await bcrypt.compare(mot_de_passe, user.rows[0].mot_de_passe_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Numéro de téléphone ou mot de passe incorrect." });
    }

    if (user.rows[0].suspendu) {
      return res.status(403).json({ error: "Votre compte a été suspendu. Contactez l'administrateur." });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({ 
      message: "Connexion réussie !", 
      token, 
      user: { 
        id: user.rows[0].id, 
        nom: user.rows[0].nom, 
        prenom: user.rows[0].prenom, 
        role: user.rows[0].role,
        verifie: user.rows[0].verifie,
        couturier_id: user.rows[0].couturier_id // <-- L'ID du profil couturier
      } 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur lors de la connexion." });
  }
});

module.exports = router;