import express from 'express';
const router = express.Router();
import Strade from '../models/strade.js'; // get our mongoose model
import Quartieri from '../models/quartieri.js'; // get our mongoose model
import Calendari from '../models/calendari.js'; // get our mongoose model
import operatoriAuth from '../middleware/tokenChecker/operatoriAuth.js';
import utentiAuth from '../middleware/tokenChecker/utentiAuth.js';

/*
    - (get) richiesta per tutte le strade
    - (get) richiesta per la ricerca di una strada
    - (get) richiesta per info in base all'id
    - (get) richiesta per calendario in base alla strada e quartiere
*/

// ritorna tutte le strade
router.get('/', async (req, res) => {
    let strade = await Strade.find({});
    strade = strade.map((strada) => {
        return {
            self: '/api/v1/strade/' + strada.id,
            title: strada.nome
        };
    });
    res.status(200).json(strade);
});

// usato per la ricerca testuale di una strada (ricordare che le strade sono tutte lowerCase)
router.get('/ricerca', async (req, res) => {
    let testo = req.query.q.toLowerCase();

    if (!testo || testo.trim() === '') {
        res.status(200).json([]);
        return;
    }

    let filtro = {
        nome: { $regex: testo, $options: 'i' }
    };

    let strade = await Strade.find(filtro).limit(5);

    strade = strade.map((strada) => {
        return {
            self: '/api/v1/strade/' + strada.id,
            title: strada.nome
        };
    });

    res.status(200).json(strade);
});

// intercetta chiamate con id
router.use('/:id', async (req, res, next) => {
    let strada = await Strade.findById(req.params.id).exec();
    if (!strada) {
        res.status(404).send()
        console.log('strada non trovata')
        return;
    }
    req['strada'] = strada;
    next();
});

// ritorna info sulla strada
router.get('/:id', async (req, res) => {
    let strada = req['strada'];
    res.status(200).json({
        self: '/api/v1/strade/' + strada.id,
        ...strada.toObject()
    });
});


// restituisce il calendario una strada selezionata con :id
router.get('/:id/infoCalendario', async (req, res) => {
    let strada = await Strade.findById(req.params.id)
        .populate({
            path: 'quartiere',
            select: 'nome calendario',
            populate: {
                path: 'calendario',
                select: 'pdfCalendario'
            }
        })
        .exec();

    if (!strada) {
        res.status(404).send();
        console.log('strada non trovata');
        return;
    }

    res.status(200).json({
        self: '/api/v1/strade/' + strada.id + '/info',
        strada: {
            id: strada.id,
            nome: strada.nome
        },
        quartiere: strada.quartiere ? {
            id: strada.quartiere.id,
            nome: strada.quartiere.nome
        } : null,
        calendario: strada.quartiere && strada.quartiere.calendario ? {
            pdfCalendario: strada.quartiere.calendario.link
        } : null
    });
});

export default router