import express from 'express';
const router = express.Router();
import Segnalazioni from '../models/segnalazioni.js'; // get our mongoose model
import Notifiche from '../models/notifiche.js'; // get our mongoose model
import utentiAuth from '../middleware/tokenChecker/utentiAuth.js';
import operatoriAuth from '../middleware/tokenChecker/operatoriAuth.js';
    
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

    let segnalazioni = await Segnalazioni.find(filtro);

    segnalazioni = segnalazioni.map((segnalazione) => {
        return {
            self: '/api/v1/segnalazioni/' + segnalazione.id,
            title: segnalazione.tipo,
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

    // solo l'autore o un operatore può cancellare
    if (req.loggedUser.ruolo !== 'operatore' &&
        segnalazione.utente.toString() !== req.loggedUser.id) {
        return res.status(403).send();
    }

    await Segnalazioni.deleteOne({ _id: req.params.id });
    res.status(204).send();
});

// mette come presa in carico la segnalazione
router.patch('/:id/presaInCarico', operatoriAuth, async (req, res) => {
    let segnalazione = req['segnalazione'];
    segnalazione.stato = 'In_Lavorazione';

    try {
        await Notifiche.create({
            utente: segnalazione.utente,
            tipo: 'Aggiornamento_Segnalazione',
            titolo: 'Segnalazione presa in carico',
            messaggio: 'È stata presa in carico una recente segnalazione effettuata',
            linkAzione: '/api/v1/segnalazioni/' + segnalazione.id
        });
    } catch (err) {
        console.error('Errore creazione notifica:', err);
    }

    await segnalazione.save(); // salva le modifiche su MongoDB
    res.status(200).json({
        self: '/api/v1/segnalazioni/' + segnalazione.id,
        ...segnalazione.toObject({ versionKey: false })
    });
});

// mette come risolta la segnalazione
router.patch('/:id/risolta', operatoriAuth, async (req, res) => {
    let segnalazione = req['segnalazione'];
    segnalazione.stato = 'Risolta';

    try {
        await Notifiche.create({
            utente: segnalazione.utente,
            tipo: 'Aggiornamento_Segnalazione',
            titolo: 'Segnalazione risolta',
            messaggio: 'È stata risolta una recente segnalazione effettuata',
            linkAzione: '/api/v1/segnalazioni/' + segnalazione.id
        });
    } catch (err) {
        console.error('Errore creazione notifica:', err);
    }
    
    await segnalazione.save(); // salva le modifiche su MongoDB
    res.status(200).json({
        self: '/api/v1/segnalazioni/' + segnalazione.id,
        ...segnalazione.toObject({ versionKey: false })
    });
});

export default router