import express from 'express';
import operatoriAuth from './middleware/tokenChecker/operatoriAuth.js';
const router = express.Router();
//import Segnalazioni from './models/segnalazioni.js'; // get our mongoose model
    
/*
    - (post) aggiunta di una nuova segnalazione
    - (get) richiesta per avere tutte le sagnalazioni
    - (get) richiesta per info di una segnalazione in base all'id
    - (delete) rimuovere una segnalazione
    - (patch) modificare lo stato della segnalazione
*/

// inserire nuova segnalazione
router.post('/', async (req, res) => {

    // info da aggiornare
    let segnalazione = new Segnalazioni({
        utente: req.loggedUser.id,
        tipo: req.body.tipo,
        descrizione: req.body.descrizione,
        via: req.body.via,
        data: req.body.data,
        foto: req.body.foto,
        stato: 'nuova'
    });

    segnalazione = await segnalazione.save();

    let segnalazioneID = segnalazione._id;

    console.log('segnalazione inserita');
    // link alla nuova segnalazione creata
    res.location('/api/v1/segnalazioni/' + segnalazioneID).status(201).send();
});



// ritorna tutte le segnalazioni con eventuali filtri da url 
router.get('/', async (req, res) => {
    let filtro = {};

    if (req.loggedUser.ruolo !== 'operatore') {
        filtro.utente = req.loggedUser.id;
    }

    if (req.query.utente && req.loggedUser.ruolo === 'operatore') {
        filtro.utente = req.query.utente;
    }

    if (req.query.tipo) {
        filtro.tipo = req.query.tipo;
    }

    if (req.query.via) {
        filtro.via = req.query.via;
    }

    if (req.query.stato) {
        filtro.stato = req.query.stato;
    }

    if (req.query.data) {
        filtro.data = req.query.data;
    }

    let segnalazioni = await Segnalazioni.find(filtro);

    segnalazioni = segnalazioni.map((segnalazione) => {
        return {
            self: '/api/v1/segnalazioni/' + segnalazione.id,
            title: segnalazione.tipo,
            foto: segnalazione.foto
        };
    });

    res.status(200).json(segnalazioni);
});



// intercetta richieste con un id per controllare se esiste
router.use('/:id', async (req, res, next) => {
    let segnalazione = await Segnalazioni.findById(req.params.id).exec();
    if (!segnalazione) {
        res.status(404).send();
        console.log('segnalazione non trovata');
        return;
    }
    req['segnalazione'] = segnalazione;
    next();
});

// ritorna info sulla segnalazione
router.get('/:id', async (req, res) => {
    let segnalazione = req['segnalazione'];
    res.status(200).json({
        self: '/api/v1/segnalazioni/' + segnalazione.id,
        ...segnalazione.toObject()
    });
});

// rimuovere segnalazione
router.delete('/:id', async (req, res) => {
    let segnalazione = req['segnalazione'];
    await Segnalazioni.deleteOne({ _id: req.params.id });
    console.log('segnalazione rimossa');
    res.status(204).send();
});

// mette come presa in carico la segnalazione
router.patch('/:id/presaInCarico', operatoriAuth, async (req, res) => {
    let segnalazione = req['segnalazione'];
    segnalazione.stato = 'Presa_in_carico';

    await segnalazione.save(); // salva le modifiche su MongoDB
    res.status(200).json({
        self: '/api/v1/segnalazioni/' + segnalazione.id,
        ...segnalazione.toObject({ versionKey: false })
    });
});

// mette come risolta la segnalazione
router.patch('/:id/risolta', operatoriAuth, async (req, res) => {
    let segnalazione = req['segnalazione'];
    segnalazione.stato = 'risolta';

    await segnalazione.save(); // salva le modifiche su MongoDB
    res.status(200).json({
        self: '/api/v1/segnalazioni/' + segnalazione.id,
        ...segnalazione.toObject({ versionKey: false })
    });
});

export default router