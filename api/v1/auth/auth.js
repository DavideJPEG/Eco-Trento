const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const utentiAuth = require('../middleware/tokenChecker/utentiAuth');
const Utenti = require('../models/utenti');


/*
    - (post) 2 modi per login con email e password oppute google account
    - (get) richiesta per controllare utente precedentemente loggato
*/

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID
    });

    return ticket.getPayload();
}

// autenticazione
router.post('/', async function (req, res) {
    try {
        let utente = null;

        if (req.body.googleToken) {
            const payload = await verifyGoogleToken(req.body.googleToken);

            if (!payload || !payload.sub || !payload.email) {
                return res.status(401).json({
                    success: false,
                    message: 'Google token non valido'
                });
            }
            
            utente = await Utenti.findOne({
                $or: [{ googleId: payload.sub }, { email: payload.email }]
            }).exec();

            // creazione di un nuovo utente (con google account) se non esiste (variabili ancora da definire)
            if (!utente) {
                const passwordHash = null

                utente = new Utenti({
                    email: payload.email,
                    password: passwordHash,
                    googleId: payload.sub,
                    nome: payload.given_name || '',
                    cognome: payload.family_name || '',
                    ruolo: 'utente',
                });

                await utente.save();
            } else if (!utente.googleId) {
                // Se l'utente esisteva già via mail, salviamo il googleId per il futuro
                utente.googleId = payload.sub;
                await utente.save();
            }
        } else {
            const email = req.body.email;
            const password = req.body.password;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email o password mancanti'
                });
            }

            utente = await Utenti.findOne({ email: email }).exec();

            if (!utente) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed. User not found.'
                });
            }

            const passwordCorretta = await bcrypt.compare(password, utente.password);

            if (!passwordCorretta) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed. Wrong password.'
                });
            }
        }

        const payload = {
            email: utente.email,
            id: utente._id,
            ruolo: utente.ruolo
        };

        const options = {
            expiresIn: '24h'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, options);

        return res.status(200).json({
            success: true,
            message: 'Login effettuato correttamente',
            token: token,
            user: {
                id: utente._id,
                email: utente.email,
                ruolo: utente.ruolo
            },
            self: '/api/v1/utenti/' + utente._id
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

router.get('/me', utentiAuth, async (req, res) => {
    let utente = await Utenti.findById(req.loggedUser.id).exec();

    if (!utente) {
        res.status(404).json({
            success: false,
            message: 'Utente non trovato'
        });
        return;
    }

    res.status(200).json({
        success: true,
        user: {
            id: utente.id,
            email: utente.email,
            ruolo: utente.ruolo,
        }
    });
});

module.exports = router;