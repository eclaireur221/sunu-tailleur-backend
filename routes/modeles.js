const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const db = require('../db');

// Configuration de Cloudinary avec les variables d'environnement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration de Multer pour envoyer les images sur Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sunu-tailleur',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage: storage });

// --- ROUTE : Ajouter un modèle ---
router.post('/ajouter', upload.single('photo'), async (req, res) => {
  try {
    const { couturier_id, titre, description, prix_min, prix_max, delai_jours } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Aucune photo fournie." });
    }

    // L'URL complète de l'image générée par Cloudinary
    const photoUrl = req.file.path;

    const newModele = await db.query(
      `INSERT INTO modeles (couturier_id, titre, description, prix_min, prix_max, delai_jours, photos) 
       VALUES ($1, $2, $3, $4, $5, $6, ARRAY[$7]) RETURNING *`,
      [couturier_id, titre, description, prix_min, prix_max, delai_jours, photoUrl]
    );

    res.status(201).json({ message: "Modèle ajouté avec succès !", modele: newModele.rows[0] });
  } catch (err) {
    console.error("Erreur Backend:", err.message);
    res.status(500).json({ error: "Erreur lors de l'ajout du modèle." });
  }
});

// --- ROUTE : Voir les modèles d'un couturier spécifique ---
router.get('/couturier/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const modeles = await db.query('SELECT * FROM modeles WHERE couturier_id = $1 ORDER BY date_creation DESC', [id]);
    res.json(modeles.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// --- ROUTE : Voir TOUS les modèles (Page d'accueil) ---
router.get('/tous', async (req, res) => {
  try {
    const tousLesModeles = await db.query(
      `SELECT m.*, u.nom as couturier_nom, u.prenom as couturier_prenom, c.verifie as couturier_verifie
       FROM modeles m 
       JOIN couturiers c ON m.couturier_id = c.id
       JOIN users u ON c.user_id = u.id 
       WHERE m.actif = true 
       AND c.verifie = true 
       AND u.suspendu = false
       ORDER BY m.date_creation DESC`
    );
    res.json(tousLesModeles.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;