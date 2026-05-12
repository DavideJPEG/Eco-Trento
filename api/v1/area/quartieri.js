const express = require('express');
const router = express.Router();
const operatoriAuth = require('../middleware/tokenChecker/operatoriAuth');
const utentiAuth = require('../middleware/tokenChecker/utentiAuth');
const Quartieri = require('../models/quartieri');
const Calendari = require('../models/calendari');

/*
    - (post) inserisce un nuovo quartiere
    - (get) richiesta per tutti i quartieri
    - (get) richiesta per un solo quartiere in base all'id
    - (get) richiesta per il calendario di un determinato quartiere
    - (delete) elimina un quartiere
*/

// ritorna tutti i quartieri
router.get('/', async (req, res) => {
    let quartieri = await Quartieri.find({});

    quartieri = quartieri.map((quartiere) => {
        return {
            self: '/api/v1/quartieri/' + quartiere.id,
            nome: quartiere.nome,
            confini: quartiere.confini,
            stileMappa: quartiere.stileMappa,
            calendario: '/api/v1/quartieri/' + quartiere.id + '/calendario'
        };
    });

    res.status(200).json(quartieri);
});

// inserire un nuovo quartiere
router.post('/', utentiAuth, operatoriAuth, async (req, res) => {

    let quartiere = new Quartieri({
        nome: req.body.nome,
        confini: req.body.confini,
        stileMappa: req.body.stileMappa,
        calendario: req.body.calendario
    });

    quartiere = await quartiere.save();

    let quartiereID = quartiere._id;

    console.log('quartiere inserito');
    res.location('/api/v1/quartieri/' + quartiereID).status(201).send();
});

// intercetta richieste con un id per controllare se esiste
router.use('/:id', async (req, res, next) => {
    let quartiere = await Quartieri.findById(req.params.id).exec();
    if (!quartiere) {
        res.status(404).send();
        console.log('quartiere non trovato');
        return;
    }
    req['quartiere'] = quartiere;
    next();
});



// ritorna info sul quartiere
router.get('/:id', async (req, res) => {
    let quartiere = req['quartiere'];
    res.status(200).json({
        self: '/api/v1/quartieri/' + quartiere.id,
        calendario: '/api/v1/quartieri/' + quartiere.id + '/calendario',
        ...quartiere.toObject()
    });
});

// ritorna il calendario del quartiere
router.get('/:id/calendario', async (req, res) => {
    let quartiere = req['quartiere'];

    let calendario = await Calendari.findById(quartiere.calendario).select('link').exec();

    if (!calendario) {
        res.status(404).json({ success: false, message: 'Calendario non trovato' });
        return;
    }

    res.status(200).json({
        self: '/api/v1/quartieri/' + quartiere._id + '/calendario',
        link: calendario.link
    });
});

// rimuove quartiere
router.delete('/:id', utentiAuth, operatoriAuth, async (req, res) => {
    let quartiere = req['quartiere'];
    await Quartieri.deleteOne({ _id: quartiere._id });
    console.log('quartiere rimosso');
    res.status(204).send();
});

module.exports = router;