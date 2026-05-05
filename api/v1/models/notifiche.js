import mongoose from 'mongoose';

const notificaSchema = new mongoose.Schema({
    utente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utente', // L'utente a cui è destinata la notifica
        required: true
    },
    tipo: {
        type: String,
        enum: ['Promemoria_Raccolta', 'Aggiornamento_Segnalazione', 'Info_Comune', 'Avviso_Ingombranti'],
        required: true
    },
    titolo: {
        type: String,
        required: true
    },
    messaggio: {
        type: String,
        required: true
    },
    linkAzione: {
        type: String // URL interno all'app (es. /segnalazioni/123) se l'utente deve cliccare
    },
    letta: {
        type: Boolean,
        default: false // Di default è non letta
    }
}, { timestamps: true }); // Ci serve per ordinare le notifiche dalla più recente

const Notifiche = mongoose.model('Notifiche', notificaSchema);
export default Notifiche;