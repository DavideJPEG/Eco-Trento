import express from 'express';
import Isole from '../models/isole.js'; // get our mongoose model
const router = express.Router();
import operatoriAuth from '../middleware/tokenChecker/operatoriAuth.js';
import utentiAuth from '../middleware/tokenChecker/utentiAuth.js';

/*
    - (get) richiesta generale per tutte le isole
    - (get) richiesta per una isola specifica con id
    - (delete) eliminare singola isola
    - (post) inserire nuova isola
    - (patch) modificare isola 
*/

// richiesta get per tutte le isole
router.get('/', async (req, res) => {
    let isole = await Isole.find({});
    isole = isole.map((isola) => {  // era "isole.id" e "isole.nome" — bug
        return {
            self: '/api/v1/isole/' + isola.id,
            nome: isola.nome
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

export default router;