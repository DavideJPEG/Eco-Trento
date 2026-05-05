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
    // Punto GPS esatto della segnalazione
    posizione: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true } // [Longitudine, Latitudine]
    },
    fotoUrl: {
        type: String, // Salveremo solo il link all'immagine (es. "/uploads/foto123.jpg")
    },
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

// Ottimizza le query per mostrare le segnalazioni sulla mappa
segnalazioneSchema.index({ posizione: '2dsphere' });

const Segnalazioni = mongoose.model('Segnalazioni', segnalazioneSchema);
export default Segnalazioni;