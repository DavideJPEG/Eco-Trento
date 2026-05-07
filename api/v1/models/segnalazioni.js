import mongoose from 'mongoose';

const segnalazioneSchema = new mongoose.Schema({
    utente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utente',
        required: true
    },
    tipo: {
        type: String,
        enum: ['Abbandono_Rifiuti', 'Isola_Guasta', 'Altro'],
        required: true
    },
    descrizione: {
        type: String,
        trim: true
    },
    // Non sono necessarie le coordinate ma basta la via tanto l'utente la dovra selezionare da una tendina
    via: { type: mongoose.Schema.Types.ObjectId, 
        ref: 'Strade', 
        required: true },

    stato: {
        type: String,
        enum: ['Aperta', 'In_Lavorazione', 'Risolta'],
        default: 'Aperta'
    },
    // Se la segnalazione è stata associata in automatico a un'isola vicina
    isolaRiferimento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Isole'
    }
}, { timestamps: true });


const Segnalazioni = mongoose.model('Segnalazioni', segnalazioneSchema);
export default Segnalazioni;