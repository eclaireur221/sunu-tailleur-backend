const express = require('express');
const router = express.Router();
const db = require('../db');

// --- ROUTE : Voir tous les utilisateurs ---
router.get('/utilisateurs', async (req, res) => {
  try {
    const users = await db.query(`
      SELECT u.id, u.nom, u.prenom, u.telephone, u.role, u.suspendu, u.date_creation, c.verifie, c.nom_atelier
      FROM users u
      LEFT JOIN couturiers c ON u.id = c.user_id
      ORDER BY u.date_creation DESC
    `);
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// --- ROUTE : Valider un couturier ---
router.put('/verifier-couturier/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE couturiers SET verifie = true WHERE user_id = $1', [id]);
    res.json({ message: "Couturier validé avec succès !" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// --- ROUTE : Suspendre / Réactiver un utilisateur ---
router.put('/suspendre/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { suspendu } = req.body;
    await db.query('UPDATE users SET suspendu = $1 WHERE id = $2', [suspendu, id]);
    res.json({ message: suspendu ? "Compte suspendu." : "Compte réactivé." });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// --- ROUTE : Refuser (Supprimer) un utilisateur ---
router.delete('/utilisateur/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: "Compte supprimé avec succès." });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// --- ROUTE : Voir toutes les commandes ---
router.get('/commandes', async (req, res) => {
  try {
    const commandes = await db.query(`
      SELECT c.*, m.titre as modele_titre, 
             u1.nom as client_nom, u1.prenom as client_prenom,
             u2.nom as couturier_nom, u2.prenom as couturier_prenom
      FROM commandes c
      JOIN modeles m ON c.modele_id = m.id
      JOIN users u1 ON c.client_id = u1.id
      JOIN couturiers co ON c.couturier_id = co.id
      JOIN users u2 ON co.user_id = u2.id
      ORDER BY c.date_creation DESC
    `);
    res.json(commandes.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;