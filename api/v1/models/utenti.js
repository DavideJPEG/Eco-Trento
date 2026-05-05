import mongoose from 'mongoose';

const utenteSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    cognome: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Impedisce email duplicate
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        // Non è required perché se l'utente accede con Google, non avrà una password classica
    },
    googleId: {
        type: String,
        // Viene riempito se l'utente fa il login con Google sempre per la questione (SSO)
    },
    codiceFiscale: {
        type: String,
        unique: true, // Ogni cittadino può avere un solo account
        sparse: true, // Permette di non avere il CF subito (es. se accede con Google) o per gli operatori
        uppercase: true,
        trim: true
    },
    ruolo: {
        type: String,
        enum: ['cittadino', 'operatore', 'admin'],
        default: 'cittadino'
    },
    indirizzoPrincipale: { //
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strade', // Riferimento alla strada per capire il calendario (RF3)
    },
    preferenzeNotifiche: {
        app: { type: Boolean, default: true },
        email: { type: Boolean, default: true }
    }
}, { timestamps: true }); // Aggiunge in automatico createdAt e updatedAt

const Utente = mongoose.model('Utente', utenteSchema);
export default Utente;