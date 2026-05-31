const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`API server v1 ascolta su http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Errore connessione MongoDB:', err);
    });