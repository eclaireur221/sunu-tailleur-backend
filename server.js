const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const modeleRoutes = require('./routes/modeles');
app.use('/api/modeles', modeleRoutes);

// LA ROUTE DES COMMANDES (NE PAS OUBLIER)
const commandeRoutes = require('./routes/commandes');
app.use('/api/commandes', commandeRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});