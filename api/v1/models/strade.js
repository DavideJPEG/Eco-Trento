import mongoose from 'mongoose';

const stradaSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    quartiere: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quartieri', // Riferimento al quartiere di appartenenza
        required: true
    }
});

// Aggiungiamo un indice per velocizzare la ricerca per nome via
stradaSchema.index({ nome: 1 });

const Strade = mongoose.model('Strade', stradaSchema);
export default Strade;