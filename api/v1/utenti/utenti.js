import express from 'express';
const router = express.Router();
import utentiAuth from './middleware/tokenChecker/utentiAuth.js';
//import Utenti from './models/utenti.js'; // get our mongoose model

router.post('/register', async (req, res) => {

    const { email, password, nome, cognome } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email o password mancanti'
        });
    }

    const utenteEsistente = await Utenti.findOne({ email }).exec();

    if (utenteEsistente) {
        return res.status(409).json({
            success: false,
            message: 'Utente già registrato'
        });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const utente = new Utenti({
        email,
        password: passwordHash,
        nome: nome || '',
        cognome: cognome || '',
        ruolo: 'utente',
        notificheAttive: false
    });

    await utente.save();

    return res.status(201).json({
        success: true,
        message: 'Registrazione completata',
        user: {
            id: utente._id,
            email: utente.email,
            ruolo: utente.ruolo
        }
    });

});

router.get('/me', utentiAuth, async (req, res) => {
    const utente = await Utenti.findById(req.loggedUser.id).exec();

    if (!utente) {
        return res.status(404).json({
            success: false,
            message: 'Utente non trovato'
        });
    }

    return res.status(200).json({
        success: true,
        user: {
            id: utente._id,
            email: utente.email,
            nome: utente.nome,
            cognome: utente.cognome,
            ruolo: utente.ruolo,
            notificheAttive: utente.notificheAttive
        }
    });
});

router.patch('/me', utentiAuth, async (req, res) => {
    const aggiornamenti = {};

    if (req.body.nome !== undefined) aggiornamenti.nome = req.body.nome;
    if (req.body.cognome !== undefined) aggiornamenti.cognome = req.body.cognome;
    if (req.body.notificheAttive !== undefined) aggiornamenti.notificheAttive = req.body.notificheAttive;
    if (req.body.notificheQuartiere !== undefined) aggiornamenti.notificheQuartiere = req.body.notificheQuartiere;

    const utente = await Utenti.findByIdAndUpdate(
        req.loggedUser.id,
        aggiornamenti,
        { new: true, runValidators: true }
    ).exec();

    if (!utente) {
        return res.status(404).json({
            success: false,
            message: 'Utente non trovato'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Profilo aggiornato',
        user: {
            id: utente._id,
            email: utente.email,
            nome: utente.nome,
            cognome: utente.cognome,
            ruolo: utente.ruolo,
            notificheAttive: utente.notificheAttive
        }
    });
});

export default router