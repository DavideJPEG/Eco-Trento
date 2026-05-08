import express from 'express';
const router = express.Router();
import Ingombranti from '../models/ingombranti.js'; // get our mongoose model
import Notifiche from '../models/notifiche.js'; // get our mongoose model
import operatoriAuth from '../middleware/tokenChecker/operatoriAuth.js';
import utentiAuth from '../middleware/tokenChecker/utentiAuth.js';

// ritorna tutte le richieste (operatore = tutte, utente = solo le sue)
router.get('/', async (req, res) => {
    let filtro = {};

    if (req.loggedUser.ruolo !== 'operatore') {
        filtro.utente = req.loggedUser.id;
    }

    if (req.query.stato) {
        filtro.stato = req.query.stato; // es. ?stato=In_Attesa
    }

    let richieste = await Ingombranti.find(filtro);

    richieste = richieste.map((richiesta) => {
        return {
            self: '/api/v1/ingombranti/' + richiesta.id,
            descrizioneOggetti: richiesta.descrizioneOggetti,
            stato: richiesta.stato,
            dataRitiroRichiesta: richiesta.dataRitiroRichiesta
        };
    });

    res.status(200).json(richieste);
});

// intercetta richieste con un id per controllare se esiste
router.use('/:id', async (req, res, next) => {
    let richiesta = await Ingombranti.findById(req.params.id).exec();
    if (!richiesta) {
        res.status(404).send();
        return;
    }
    if (req.loggedUser.ruolo !== 'operatore' &&
        richiesta.utente.toString() !== req.loggedUser.id) {
        return res.status(403).json({ message: 'Accesso non autorizzato' });
    }
    req['richiesta'] = richiesta;
    next();
});

// ritorna info sulla richiesta
router.get('/:id', async (req, res) => {
    let richiesta = req['richiesta'];
    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});

// elimina richiesta
router.delete('/:id', async (req, res) => {
    let richiesta = req['richiesta'];
    await Ingombranti.deleteOne({ _id: richiesta.id });
    res.status(204).send();
});

// inserisce nuova richiesta (solo utenti)
router.post('/', async (req, res) => {
    let richiesta = new Ingombranti({
        utente: req.loggedUser.id,         // preso dal token, non dal body
        viaRitiro: req.body.viaRitiro,
        descrizioneOggetti: req.body.descrizioneOggetti,
        dataRitiroRichiesta: req.body.dataRitiroRichiesta,
        fasciaOraria: req.body.fasciaOraria,
        stato: 'In_Attesa'                 // sempre In_Attesa alla creazione
    });

    richiesta = await richiesta.save();

    res.location('/api/v1/ingombranti/' + richiesta.id).status(201).send();
});

// operatore accetta la richiesta
router.patch('/:id/accetta', operatoriAuth, async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.stato = 'Accettata';
    await richiesta.save();

    try {
        await Notifiche.create({
            utente: richiesta.utente,
            tipo: 'Avviso_Ingombranti',
            titolo: 'Richiesta accettata',
            messaggio: 'È stata accettata la richiesta di ritiro rifiuti',
            linkAzione: '/api/v1/ingombranti/' + richiesta.id
        });
    } catch (err) {
        console.error('Errore creazione notifica:', err);
    }

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});

// operatore propone una modifica (data/orario/note diversi)
router.patch('/:id/proponiModifica', operatoriAuth, async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.stato = 'Modifica_Proposta';
    if (req.body.dataRitiroRichiesta) richiesta.dataRitiroRichiesta = req.body.dataRitiroRichiesta;
    if (req.body.fasciaOraria) richiesta.fasciaOraria = req.body.fasciaOraria;
    if (req.body.noteOperatore) richiesta.noteOperatore = req.body.noteOperatore;
    await richiesta.save();

    try {
        await Notifiche.create({
            utente: richiesta.utente,
            tipo: 'Avviso_Ingombranti',
            titolo: 'Richiesta modificata',
            messaggio: 'È stata apportata una modifica alla richiesta di ritiro rifiuti',
            linkAzione: '/api/v1/ingombranti/' + richiesta.id
        });
    } catch (err) {
        console.error('Errore creazione notifica:', err);
    }

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});

// utente accetta la modifica proposta dall'operatore
router.patch('/:id/accettaModifica', async (req, res) => {
    let richiesta = req['richiesta'];

    if (richiesta.utente.toString() !== req.loggedUser.id) {
        return res.status(403).send();
    }

    if (richiesta.stato !== 'Modifica_Proposta') {
        return res.status(400).json({ message: 'Nessuna modifica da accettare' });
    }

    richiesta.stato = 'Accettata';
    await richiesta.save();

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});

// operatore imposta la richiesta come completata
router.patch('/:id/completa', operatoriAuth, async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.stato = 'Completata';
    await richiesta.save();

    try {
        await Notifiche.create({
            utente: richiesta.utente,
            tipo: 'Avviso_Ingombranti',
            titolo: 'Richiesta completata',
            messaggio: 'I rifiuti sono stati prelevati',
            linkAzione: '/api/v1/ingombranti/' + richiesta.id
        });
    } catch (err) {
        console.error('Errore creazione notifica:', err);
    }

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});

// utente o operatore annulla la richiesta
router.patch('/:id/annulla', async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.stato = 'Annullata';
    await richiesta.save();

    try {
        await Notifiche.create({
            utente: richiesta.utente,
            tipo: 'Avviso_Ingombranti',
            titolo: 'Richiesta annullata',
            messaggio: 'È stata annullata la richiesta di ritiro rifiuti',
            linkAzione: '/api/v1/ingombranti/' + richiesta.id
        });
    } catch (err) {
        console.error('Errore creazione notifica:', err);
    }

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});

export default router;