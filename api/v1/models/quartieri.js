import mongoose from 'mongoose';

const quartiereSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true, // Non ci possono essere due quartieri con lo stesso nome
        trim: true
    },
    // Struttura GeoJSON per un Poligono (i confini del quartiere)
    confini: {
        type: {
            type: String,
            enum: ['Polygon'], // Deve essere 'Polygon'
            required: true
        },
        coordinates: {
            type: [[[Number]]], // Un array di array di array di numeri (formato standard GeoJSON)
            required: true
        }
    },
    // Colori per il rendering sulla mappa Leaflet nel frontend
    stileMappa: {
        coloreBordo: { type: String, default: '#000000' }, // Es. Nero
        coloreRiempimento: { type: String, default: '#3388ff' } // Es. Azzurro
    }
});

// Aggiungiamo un indice spaziale per velocizzare le ricerche geografiche
quartiereSchema.index({ confini: '2dsphere' });

const Quartieri = mongoose.model('Quartieri', quartiereSchema);
export default Quartieri;