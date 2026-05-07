import mongoose from 'mongoose';

const quartiereSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true, // Non ci possono essere due quartieri con lo stesso nome
        trim: true
    },
    // VERSIONE SEMPLIFICATA: Array di coordinate (es. [[lat1, lng1], ...]
    confini: {
        type: [[Number]], 
        required: true
    },
    // Colori per il rendering sulla mappa Leaflet nel frontend
    stileMappa: {
        coloreBordo: { type: String, default: '#000000' }, // Es. Nero
        coloreRiempimento: { type: String, default: '#3388ff' } // Es. Azzurro
    },
    //aggiunto il riferimento al calendario
    calendario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Calendario'
    }
});

const Quartieri = mongoose.model('Quartieri', quartiereSchema);
export default Quartieri;