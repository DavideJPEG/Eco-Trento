import express from 'express';
const router = express.Router();
import utentiAuth from './middleware/tokenChecker/utentiAuth.js';
//import Notifiche from './models/notifiche.js'; // get our mongoose model

/*
    - (post) inserisce una nuova notifica
    - (get) richiesta per avere tutte le notifiche dell'utente loggato
    - (get) richiesta per info di una notifica specifica
    - (patch) modifica di una notifica da non letta a letta
*/

// crea nuova notifica
router.post('/', async (req, res) => {

    
    let notifica = new Notifiche({
        utente: req.body.utente,
        tipo: req.body.tipo,
        titolo: req.body.titolo,
        messaggio: req.body.messaggio,
        link: req.body.link,
        riferimento: req.body.riferimento,
        letta: false
    });

    notifica = await notifica.save();

    console.log('notifica inserita');
    res.location('/api/v1/notifiche/' + notifica._id).status(201).send();
});


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

export default router;