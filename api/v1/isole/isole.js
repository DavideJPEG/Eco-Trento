import express from 'express';
//import Isole from './models/isole.js'; // get our mongoose model
const router = express.Router();
import operatoriAuth from './middleware/tokenChecker/operatoriAuth.js';
import utentiAuth from './middleware/tokenChecker/utentiAuth.js';

/*
    - (get) richiesta generale per tutte le isole
    - (get) richiesta per una isola specifica con id
    - (delete) eliminare singola isola
    - (post) inserire nuova isola
    - (patch) modificare isola 
*/

// richiesta get per ottenere tutte le isole
router.get('/', async (req, res) => {
    // ritorno delle isole mappate
    let isole = await Isole.find({});
    isole = isole.map((isole) => {
        return {
            self: '/api/v1/isole/' + isole.id,
            nome: isole.nome
        };
    });
    res.status(200).json(isole);
});

// intercetta richieste con un id per controllare se esiste
router.use('/:id', async (req, res, next) => {
    let isola = await Isole.findById(req.params.id).exec();
    if (!isola) {
        res.status(404).send()
        console.log('isola non trovata')
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
        ...isola.toObject()
    });
});

// rimuovere isola
router.delete('/:id', async (req, res) => {
    let isola = req['isola'];
    await Isole.deleteOne({ _id: req.params.id });
    console.log('isola rimossa');
    res.status(204).send();
});

//inserire nuova isola (aggiungere parametri)
router.post('/', async (req, res) => {

    let isola = new Isole({
        //informazioni isola
        nome: req.body.nome,
        coordinate: req.body.coordinate,
        via: req.body.via,
        statoRifiuti: req.body.statoRifiuti,
        statoFisico: req.body.statoFisico
    });

    isola = await isola.save();

    let isolaID = isola._id;

    console.log('isola inserita');
    // link alla nuova isola creata
    res.location("/api/v1/isole/" + isolaID).status(201).send();
});

// modifica parziale di una isola esistente solo da operatore
router.patch('/:id', utentiAuth, operatoriAuth, async (req, res) => {
    let isola = req['isola'];

    // prendi solo i campi inviati nel body (da aggiungere)
    const campiModificabili = [];

    campiModificabili.forEach(campo => {
        if (req.body[campo] !== undefined) {
            isola[campo] = req.body[campo]; // aggiorna solo i campi ricevuti
        }
    });

    await isola.save(); // salva le modifiche su MongoDB
    res.status(200).json({
        self: '/api/v1/isole/' + isola.id,
        ...isola.toObject({ versionKey: false })
    });
});


export default router