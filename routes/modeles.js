const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Module pour gérer les dossiers
const db = require('../db');

//  SÉCURITÉ : Créer le dossier 'uploads' s'il n'existe pas
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(" Dossier 'uploads' créé automatiquement.");
}

// Configuration de Multer pour stocker les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // On utilise le chemin absolu sécurisé
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- ROUTE : Ajouter un modèle ---
router.post('/ajouter', upload.single('photo'), async (req, res) => {
  try {
    console.log(" Requête d'ajout reçue");
    const { couturier_id, titre, description, prix_min, prix_max, delai_jours } = req.body;

    // Vérification des données reçues
    if (!couturier_id || !titre) {
      return res.status(400).json({ error: "Le titre et l'ID du couturier sont obligatoires." });
    }

    // Vérification de l'image
    let photoPath = null;
    if (req.file) {
      photoPath = `/uploads/${req.file.filename}`;
    } else {
      return res.status(400).json({ error: "Veuillez fournir une photo pour le modèle." });
    }

    // Insertion dans la base de données
    const newModele = await db.query(
      `INSERT INTO modeles (couturier_id, titre, description, prix_min, prix_max, delai_jours, photos) 
       VALUES ($1, $2, $3, $4, $5, $6, ARRAY[$7]) RETURNING *`,
      [couturier_id, titre, description, prix_min, prix_max, delai_jours, photoPath]
    );

    console.log(" Modèle ajouté en base de données");
    res.status(201).json({ message: "Modèle ajouté avec succès !", modele: newModele.rows[0] });
    
  } catch (err) {
    //  AFFICHAGE DE L'ERREUR DÉTAILLÉE DANS LE TERMINAL
    console.error(" ERREUR BACKEND :", err.message); 
    res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
});

// --- ROUTE : Voir les modèles d'un couturier spécifique ---
router.get('/couturier/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const modeles = await db.query('SELECT * FROM modeles WHERE couturier_id = $1 ORDER BY date_creation DESC', [id]);
    res.json(modeles.rows);
  } catch (err) {
    console.error(err.message);
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
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;