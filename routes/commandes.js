const express = require('express');
const router = express.Router();
const db = require('../db');

// --- ROUTE : Créer une commande ---
router.post('/creer', async (req, res) => {
  try {
    const { client_id, couturier_id, modele_id, mesures, prix_propose, delai_propose_jours, adresse_livraison } = req.body;

    const nouvelleMesure = await db.query(
      `INSERT INTO mesures (client_id, epaules, poitrine, taille, hanches, longueur_totale) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [client_id, mesures.epaules, mesures.poitrine, mesures.taille, mesures.hanches, mesures.longueur_totale]
    );
    const mesures_id = nouvelleMesure.rows[0].id;

    const reference = `CMD-${Date.now().toString().slice(-6)}`;
    const nouvelleCommande = await db.query(
      `INSERT INTO commandes (reference, client_id, couturier_id, modele_id, mesures_id, prix_propose, delai_propose_jours, adresse_livraison) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [reference, client_id, couturier_id, modele_id, mesures_id, prix_propose, delai_propose_jours, adresse_livraison]
    );

    res.status(201).json({ message: "Commande créée avec succès !", commande: nouvelleCommande.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la création de la commande." });
  }
});

// --- ROUTE : Voir les commandes d'un couturier ---
router.get('/couturier/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const commandes = await db.query(`
      SELECT c.*, m.titre as modele_titre, m.photos as modele_photos, u.nom as client_nom, u.prenom as client_prenom
      FROM commandes c
      JOIN modeles m ON c.modele_id = m.id
      JOIN users u ON c.client_id = u.id
      WHERE c.couturier_id = $1
      ORDER BY c.date_creation DESC
    `, [id]);
    res.json(commandes.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des commandes." });
  }
});

// --- ROUTE : Voir les commandes d'un client ---
router.get('/client/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const commandes = await db.query(`
      SELECT c.*, m.titre as modele_titre, m.photos as modele_photos, 
             u.nom as couturier_nom, u.prenom as couturier_prenom
      FROM commandes c
      JOIN modeles m ON c.modele_id = m.id
      JOIN users u ON c.couturier_id = u.id
      WHERE c.client_id = $1
      ORDER BY c.date_creation DESC
    `, [id]);
    res.json(commandes.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des commandes." });
  }
});

// --- ROUTE : Changer le statut d'une commande ---
router.put('/:id/statut', async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const commandeMiseAJour = await db.query(
      'UPDATE commandes SET statut = $1, date_mise_a_jour = NOW() WHERE id = $2 RETURNING *',
      [statut, id]
    );
    if (commandeMiseAJour.rows.length === 0) return res.status(404).json({ error: "Commande introuvable." });
    res.json({ message: "Statut mis à jour !", commande: commandeMiseAJour.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
  }
});

// --- ROUTE : FIXER LE PRIX ET LE DÉLAI (Négociation) ---
router.put('/:id/fixer-prix', async (req, res) => {
  try {
    const { id } = req.params;
    const { prix_final, delai_final_jours } = req.body;

    const commandeMiseAJour = await db.query(
      'UPDATE commandes SET prix_final = $1, delai_final_jours = $2, statut = $3, date_mise_a_jour = NOW() WHERE id = $4 RETURNING *',
      [prix_final, delai_final_jours, 'acceptee', id]
    );

    if (commandeMiseAJour.rows.length === 0) return res.status(404).json({ error: "Commande introuvable." });
    res.json({ message: "Prix et délai validés !", commande: commandeMiseAJour.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la validation du prix." });
  }
});

// --- ROUTE : Envoyer un message ---
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params; 
    const { expediteur_id, contenu } = req.body;
    const nouveauMessage = await db.query(
      `INSERT INTO messages (commande_id, expediteur_id, contenu) VALUES ($1, $2, $3) RETURNING *`,
      [id, expediteur_id, contenu]
    );
    res.status(201).json(nouveauMessage.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
});

// --- ROUTE : Récupérer les messages ---
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await db.query(
      `SELECT m.*, u.nom, u.prenom FROM messages m
       JOIN users u ON m.expediteur_id = u.id
       WHERE m.commande_id = $1 ORDER BY m.date_envoi ASC`,
      [id]
    );
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des messages." });
  }
});

module.exports = router;