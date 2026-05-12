const express = require('express');
const cors = require('cors');

const authRoutes = require('./auth/auth');
const areaRoutes = require('./area/quartieri');
const ingombrantiRoutes = require('./ingombranti/ingombranti');
const isoleRoutes = require('./isole/isole');
const notificheRoutes = require('./notifiche/notifiche');
const segnalazioniRoutes = require('./segnalazioni/segnalazioni');
const stradeRoutes = require('./strade/strade');
const utentiRoutes = require('./utenti/utenti');
const utentiAuth = require('./middleware/tokenChecker/utentiAuth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/area', areaRoutes);
app.use('/api/v1/strade', stradeRoutes);
app.use('/api/v1/isole', isoleRoutes);
app.use('/api/v1/utenti', utentiRoutes);
app.use('/api/v1/segnalazioni', utentiAuth, segnalazioniRoutes);
app.use('/api/v1/ingombranti', utentiAuth, ingombrantiRoutes);
app.use('/api/v1/notifiche', utentiAuth, notificheRoutes);

app.get('/', (req, res) => res.json({ message: 'API v1 attiva' }));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

module.exports = app;  // ← esporta senza listen