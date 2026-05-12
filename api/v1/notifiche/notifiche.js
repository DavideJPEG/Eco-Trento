const express = require('express');
const router = express.Router();
const utentiAuth = require('../middleware/tokenChecker/utentiAuth');
const Notifiche = require('../models/notifiche');

/*
    - (get) richiesta per avere tutte le notifiche dell'utente loggato
    - (get) richiesta per info di una notifica specifica
    - (patch) modifica di una notifica da non letta a letta
*/

// ritorna tutte le notifiche dell'utente loggato
router.get('/', utentiAuth, async (req, res) => {
    let filtro = {
        utente: req.loggedUser.id
    };

    if (req.query.letta !== undefined) {
        filtro.letta = req.query.letta === 'true';
    }

    if (req.query.tipo) {
        filtro.tipo = req.query.tipo;
    }

    let notifiche = await Notifiche.find(filtro).sort({ createdAt: -1 });

    notifiche = notifiche.map((notifica) => {
        return {
            self: '/api/v1/notifiche/' + notifica.id,
            titolo: notifica.titolo,
            messaggio: notifica.messaggio,
            letta: notifica.letta
        };
    });

    res.status(200).json(notifiche);
});


// intercetta richieste con un id per controllare se esiste
router.use('/:id', async (req, res, next) => {
    let notifica = await Notifiche.findById(req.params.id).exec();
    if (!notifica) {
        res.status(404).send();
        console.log('notifica non trovata');
        return;
    }
    // controlla che la notifica appartenga all'utente loggato
    if (notifica.utente.toString() !== req.loggedUser.id) {
        return res.status(403).json({ message: 'Accesso non autorizzato' });
    }
    req['notifica'] = notifica;
    next();
});


// ritorna info della notifica
router.get('/:id', async (req, res) => {
    let notifica = req['notifica'];
    res.status(200).json({
        self: '/api/v1/notifiche/' + notifica.id,
        ...notifica.toObject()
    });
});

// mette come letta la notifica
router.patch('/:id/letta', async (req, res) => {
    let notifica = req['notifica'];
    notifica.letta = true;

    await notifica.save();
    res.status(200).json({
        self: '/api/v1/notifiche/' + notifica.id,
        ...notifica.toObject({ versionKey: false })
    });
});

module.exports = router;