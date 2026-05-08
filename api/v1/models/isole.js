import mongoose from 'mongoose';

// Sottoschema per lo stato dei singoli bidoni nell'isola
const statoRifiutoSchema = new mongoose.Schema({
    tipoRifiuto: {
        type: String,
        enum: ['Vetro', 'Carta', 'Organico', 'imballaggi_leggeri', 'Secco_residuo'],
        required: true
    },
    livelloRiempimento: {
        type: Number,
        min: 0,
        max: 100,
        default: 0 // Percentuale da 0 a 100
    },
    // Per logistica e tracciamento
    dataUltimoSvuotamento: {
        type: Date
    }
});

const isolaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
   coordinate: { //versione semplice con solo un array al posto della versione con GeoJSON
        type: [Number], // Formato: [Latitudine, Longitudine]
        required: true
    },
    strada: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Strade', // Colleghiamo l'isola a una via
        required: true
    },
    statoFisico: {
        type: String,
        enum: ['Attiva', 'In_Manutenzione', 'Fuori_Servizio'],
        default: 'Attiva'
    },
    // L'array di bidoni
    bidoni: [statoRifiutoSchema], 
    
    
}, { timestamps: true });


const Isole = mongoose.model('Isole', isolaSchema);
export default Isole;
