import mongoose from 'mongoose';

const ingombrantiSchema = new mongoose.Schema({
    utente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utente', // Chi fa la richiesta
        required: true
    },
    viaRitiro: { // la via dove si andra a ritirare l'oggetto
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Strade', 
        required: true },

    descrizioneOggetti: {
        type: String,
        required: true,
        trim: true
    },
    dataRitiroRichiesta: {
        type: Date,
        required: true
    },
    fasciaOraria: {
        type: String, // es. "Mattina (08:00 - 12:00)"
        required: true
    },
    stato: {
        type: String,
        // Qui è modificata rispetto a come lo avevi pensato è c'è un solo stato univoco per operatore e utente
        enum: ['In_Attesa', 'Modifica_Proposta', 'Accettata', 'Completata','Annullata'],
        default: 'In_Attesa'
    },
    noteOperatore: {
        type: String, // Se l'operatore deve proporre un altro orario o dare istruzioni
        trim: true
    }
}, { timestamps: true }); // Salva in automatico la Data di Creazione (dataRichiesta)

const Ingombranti = mongoose.model('Ingombranti', ingombrantiSchema);
export default Ingombranti;