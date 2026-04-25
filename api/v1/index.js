import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './auth/auth.js';
import areaRoutes from './area/quartieri.js';
import ingombrantiRoutes from './ingombranti/ingombranti.js';
import isoleRoutes from './isole/isole.js';
import notificheRoutes from './notifiche/notifiche.js';     
import operatoriRoutes from './operatori/oper.js';
import segnalazioniRoutes from './segnalazioni/segnalazioni.js';
import stradeRoutes from './strade/strade.js';
import utentiRoutes from './utenti/utenti.js';
import utentiAuth from './middleware/tokenChecker/utentiAuth.js';
import operatoriAuth from './middleware/tokenChecker/operatoriAuth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// pubbliche
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/area', areaRoutes);
app.use('/api/v1/strade', stradeRoutes);

//singole dichiarazioni
app.use('/api/v1/isole', isoleRoutes);

// solo utenti
app.use('/api/v1/segnalazioni', utentiAuth, segnalazioniRoutes);
app.use('/api/v1/ingombranti', utentiAuth, ingombrantiRoutes);
app.use('/api/v1/notifiche', utentiAuth, notificheRoutes);
app.use('/api/v1/utenti', utentiAuth, utentiRoutes);
 
// solo operatori
app.use('/api/v1/operatori', utentiAuth, operatoriAuth, operatoriRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'API v1 attiva' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
/*
mongoose.connect(MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`API server v1 ascolta su http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Errore connessione MongoDB:', err);
    });
*/

app.listen(PORT, () => {
    console.log(`API server v1 ascolta su http://localhost:${PORT}`);
});
export default app;