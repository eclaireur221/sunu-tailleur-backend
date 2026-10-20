const jwt = require('jsonwebtoken');

// Vérifier si l'utilisateur est connecté (a un token valide)
const verifierToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: "Accès refusé. Veuillez vous connecter." });

  try {
    // On enlève le mot "Bearer " du token
    const tokenValide = token.replace('Bearer ', '');
    const decoded = jwt.verify(tokenValide, process.env.JWT_SECRET);
    req.user = decoded; // On ajoute les infos de l'utilisateur à la requête
    next(); // On passe à la suite
  } catch (err) {
    res.status(400).json({ error: "Token invalide." });
  }
};

// Vérifier si l'utilisateur est un couturier
const estCouturier = (req, res, next) => {
  if (req.user.role !== 'couturier') {
    return res.status(403).json({ error: "Accès réservé aux couturiers." });
  }
  next();
};

// Vérifier si l'utilisateur est un client
const estClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ error: "Accès réservé aux clients." });
  }
  next();
};

module.exports = { verifierToken, estCouturier, estClient };