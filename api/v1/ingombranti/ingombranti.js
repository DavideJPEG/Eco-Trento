import express from 'express';
const router = express.Router();
//import Ingombranti from './models/ingombranti.js'; // get our mongoose model
//import Notifiche from './models/notifiche.js'; // get our mongoose model
import operatoriAuth from './middleware/tokenChecker/operatoriAuth.js';

/*
    (get) richiesta per avere tutte le richieste di rifiuti in base al ruolo dell'utente
    (get) richiesta per una singola richiesta in base all'id
    (delete) rimuove una richiesta
    (post) aggiunge una richiesta
    (patch) richieste di modifica delle richieste. Differenziate da operatori e utenti normali
*/


// ritorna tutte le prenotazioni dei rifiuti ingombranti sia per opeatore (tutte) sia per utente (solo le sue)
router.get('/', async (req, res) => {
    let filtro = {};

    if (req.loggedUser.ruolo !== 'operatore') {
        filtro.utente = req.loggedUser.id;
    }

    if (req.query.stato === 'attive') {
        filtro.$or = [
            { statoOperatore: 'accettata' },
            { statoUtente: 'accettata' }
        ];
    } else if (req.query.stato === 'soddisfatte') {
        filtro.statoOperatore = 'soddisfatta';
        filtro.statoUtente = 'soddisfatta'
    } else if (req.query.stato === 'pending') {
        filtro.$or = [
            { statoOperatore: 'pending' },
            { statoUtente: 'pending' }
        ];
    }

    let richieste = await Ingombranti.find(filtro);

    richieste = richieste.map((richiesta) => {
        return {
            self: '/api/v1/ingombranti/' + richiesta.id,
            title: richiesta.nome,
            dataRichiesta: richiesta.dataRichiesta
        };
    });

    res.status(200).json(richieste);
});


// intercetta richieste con un id per controllare se esiste
router.use('/:id', async (req, res, next) => {
    let richiesta = await Ingombranti.findById(req.params.id).exec();
    if (!richiesta) {
        res.status(404).send()
        console.log('rifiuto ingombrante non trovato')
        return;
    }
    req['richiesta'] = richiesta;
    next();
});


// ritorna info sull'ingombrante
router.get('/:id', async (req, res) => {
    let richiesta = req['richiesta'];
    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject()
    });
});


router.delete('/:id', async (req, res) => {
    let richiesta = req['richiesta'];
    await Ingombranti.deleteOne({ _id: richiesta.id });
    console.log('richiesta ingombranti rimossa');
    res.status(204).send();
});


//inserire nuova richiesta (aggiungere parametri)
router.post('/', async (req, res) => {

    let richiesta = new Ingombranti({
        nome: req.body.nome,
        utente: req.body.utenteID,
        dataRichiesta: req.body.dataRichiesta,
        dataRitiro: req.body.dataRitiro,
        orario: req.body.orario,
        descrizione: req.body.descrizione,
        foto: req.body.foto,   // controllare con GridFS
        statoOperatore: req.body.statoOperatore,
        statoUtente: req.body.statoUtente
    });

    richiesta = await richiesta.save();

    let richiestaID = richiesta.id;

    console.log('richiesta inserita');
    // link alla nuova richiesta creata
    res.location("/api/v1/ingombranti/" + richiestaID).status(201).send();
});


router.patch('/:id/accettataUtente', async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.statoUtente = 'accettata';
    await richiesta.save();

    await Notifiche.create({
        //creazione della notifica
    });

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});


router.patch('/:id/accettataOperatore', operatoriAuth, async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.statoOperatore = 'accettata';
    await richiesta.save();

    await Notifiche.create({
        //creazione della notifica
    });

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});


router.patch('/:id/soddisfatta', operatoriAuth, async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.statoOperatore = 'soddisfatta';
    richiesta.statoUtente = 'soddisfatta';
    await richiesta.save();

    await Notifiche.create({
        //creazione della notifica
    });

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});


router.patch('/:id/modificaOperatore', operatoriAuth, async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.statoOperatore = 'accettata';
    richiesta.statoUtente = 'pending';
    richiesta.dataRitiro = req.body.dataRitiro;
    richiesta.orario = req.body.orario;
    richiesta.descrizione = req.body.descrizione;
    await richiesta.save();

    await Notifiche.create({
        //creazione della notifica
    });

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});

router.patch('/:id/modificaUtente', async (req, res) => {
    let richiesta = req['richiesta'];

    richiesta.statoOperatore = 'pending';
    richiesta.statoUtente = 'accettata';
    richiesta.dataRitiro = req.body.dataRitiro;
    richiesta.orario = req.body.orario;
    richiesta.descrizione = req.body.descrizione;
    await richiesta.save();

    await Notifiche.create({
        //creazione della notifica
    });

    res.status(200).json({
        self: '/api/v1/ingombranti/' + richiesta.id,
        ...richiesta.toObject({ versionKey: false })
    });
});


export default router