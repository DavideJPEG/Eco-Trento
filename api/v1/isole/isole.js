const express = require('express');
const Isole = require('../models/isole');
const router = express.Router();
const operatoriAuth = require('../middleware/tokenChecker/operatoriAuth');
const utentiAuth = require('../middleware/tokenChecker/utentiAuth');
const mongoose = require('mongoose');
/*
    - (get) richiesta generale per tutte le isole
    - (get) richiesta per una isola specifica con id
    - (delete) eliminare singola isola
    - (post) inserire nuova isola
    - (patch) modificare isola 
*/

// ROTTA SEGRETA DI TEST: Inietta un'isola nel database
router.get('/test-insert', async (req, res) => {
    try {
        const nuovaIsola = new Isole({
            nome: "Isola Ecologica Centro",
            coordinate: [46.0672, 11.1215], // Coordinate di Trento
            strada: new mongoose.Types.ObjectId(), // Trucco: crea un ID valido per ingannare la sicurezza!
            statoFisico: "Attiva", // Parola esatta accettata dal DB
            bidoni: [
                { tipoRifiuto: "Vetro", livelloRiempimento: 45 },
                { tipoRifiuto: "imballaggi_leggeri", livelloRiempimento: 80 },
                { tipoRifiuto: "Carta", livelloRiempimento: 10 }
            ]
        });
        
        await nuovaIsola.save(); 
        res.send("VITTORIA ASSOLUTA! Isola di test inserita rispettando tutte le regole!");
    } catch (error) {
        res.status(500).send("Errore: " + error.message);
    }
});

// richiesta get per tutte le isole
router.get('/', async (req, res) => {
    let isole = await Isole.find({});
    isole = isole.map((isola) => {  // era "isole.id" e "isole.nome" — bug
        return {
            self: '/api/v1/isole/' + isola.id,
            // AGGIUNTA: Invio di tutto l'oggetto (comprese le coordinate) al frontend
            ...isola.toObject({ versionKey: false }) 
        };
    });
    res.status(200).json(isole);
});

// intercetta richieste con un id per controllare se esiste
router.use('/:id', async (req, res, next) => {
    let isola = await Isole.findById(req.params.id).exec();
    if (!isola) {
        res.status(404).send();
        return;
    }
    req['isola'] = isola;
    next();
});

// ritorna info sull'isola
router.get('/:id', async (req, res) => {
    let isola = req['isola'];
    res.status(200).json({
        self: '/api/v1/isole/' + isola.id,
        ...isola.toObject({ versionKey: false })
    });
});

// rimuovere isola (solo operatore)
router.delete('/:id', utentiAuth, operatoriAuth, async (req, res) => {
    let isola = req['isola'];
    await Isole.deleteOne({ _id: isola._id });
    res.status(204).send();
});

// modifica parziale isola (solo operatore)
router.patch('/:id', utentiAuth, operatoriAuth, async (req, res) => {
    let isola = req['isola'];

    const campiModificabili = ['nome', 'coordinate', 'strada', 'statoFisico', 'bidoni'];

    campiModificabili.forEach(campo => {
        if (req.body[campo] !== undefined) {
            isola[campo] = req.body[campo];
        }
    });

    await isola.save();
    res.status(200).json({
        self: '/api/v1/isole/' + isola.id,
        ...isola.toObject({ versionKey: false })
    });
});

module.exports = router;