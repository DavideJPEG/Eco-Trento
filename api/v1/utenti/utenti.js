import express from 'express';
import bcrypt from 'bcrypt';
const router = express.Router();
import utentiAuth from '../middleware/tokenChecker/utentiAuth.js';
import Utenti from '../models/utenti.js'; // get our mongoose model

router.post('/register', async (req, res) => {

    const {nome, cognome, email, password, via} = req.body;

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
        nome: nome || '',
        cognome: cognome || '',
        email: email,
        password: passwordHash,
        indirizzoPrincipale : via,
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
            indirizzoPrincipale: utente.indirizzoPrincipale,
            preferenzeNotifiche: utente.preferenzeNotifiche
        }
    });
});

router.patch('/me', utentiAuth, async (req, res) => {
    const aggiornamenti = {};

    // campi semplici
    if (req.body.nome !== undefined) aggiornamenti.nome = req.body.nome;
    if (req.body.cognome !== undefined) aggiornamenti.cognome = req.body.cognome;
    if (req.body.indirizzoPrincipale !== undefined) {
        aggiornamenti.indirizzoPrincipale = req.body.indirizzoPrincipale;
    }

    // preferenze notifiche (booleane)
    // es: { notificaApp: true, notificaEmail: false }
    if (req.body.notificaApp !== undefined) {
        aggiornamenti['preferenzeNotifiche.app'] = req.body.notificaApp;
    }
    if (req.body.notificaEmail !== undefined) {
        aggiornamenti['preferenzeNotifiche.email'] = req.body.notificaEmail;
    }

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
            indirizzoPrincipale: utente.indirizzoPrincipale,
            preferenzeNotifiche: utente.preferenzeNotifiche
        }
    });
});

export default router