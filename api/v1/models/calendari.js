// models/calendari.js
import mongoose from 'mongoose';


// Schema per un singolo slot di raccolta
// Uno slot rappresenta una tipologia di rifiuto con il suo orario e i giorni di raccolta
const slotSchema = new mongoose.Schema({

    // Tipologia di rifiuto raccolta in questo slot
    tipologia: {
        type: String,
        required: true,
        enum: ['organico', 'carta', 'imballaggi_leggeri', 'residuo', 'vetro']
    },

    // Tipo di contenitore da esporre (es. "Sacco azzurro", "Contenitore con coperchio marrone")
    contenitore: { type: String },

    // Orario entro cui esporre il contenitore (es. "06:00", "13:00")
    esporEntro: { type: String },

    // Giorni della settimana in cui avviene la raccolta (0=Dom, 1=Lun, ..., 6=Sab)
    // Usato per raccolte settimanali fisse: organico, carta, residuo, imballaggi
    // Es. [2, 5] = ogni martedì e venerdì
    giorniSettimana: [{ type: Number }],

    // Date fisse espresse come {giorno, mese} — usato per il vetro
    // che non segue una cadenza settimanale ma ha date specifiche per ogni mese
    // Es. [{giorno: 2, mese: 1}, {giorno: 16, mese: 1}, ...]
    dateFisse: [{ giorno: Number, mese: Number }]

}, { _id: false }); // _id: false perché gli slot sono subdocument, non entità indipendenti


// Schema per la gestione dei giorni festivi
// Nei giorni festivi la raccolta non viene effettuata,
// ma alcune tipologie (es. imballaggi_leggeri) prevedono un giorno di recupero
const festivitaSchema = new mongoose.Schema({

    // Data del giorno festivo in cui la raccolta viene saltata
    data: { type: Date, required: true },

    // Data in cui viene effettuato il recupero della raccolta saltata
    dataRecupero: { type: Date, required: true },

    // Tipologie di rifiuto coinvolte dal recupero
    // Es. ["imballaggi_leggeri"]
    tipologieInteresse: [String]

}, { _id: false });


// Schema principale del calendario di raccolta
// Un calendario appartiene a un anno specifico e contiene tutti gli slot
// e le eccezioni per le festività
const calendarioSchema = new mongoose.Schema({

    // Nome descrittivo del calendario (es. "Calendario Centro Storico 2026")
    nome: { type: String, required: true },

    // Anno di riferimento del calendario
    anno: { type: Number, required: true },

    

    // Lista degli slot di raccolta (una voce per ogni tipologia di rifiuto)
    slot: [slotSchema],

    // Lista delle festività con il relativo giorno di recupero
    festivita: [festivitaSchema],

    // Flag per indicare se il calendario è attualmente in vigore
    // Permette di avere più calendari salvati ma uno solo attivo per volta
    attivo: { type: Boolean, default: true }

}, { timestamps: true }); // timestamps aggiunge automaticamente createdAt e updatedAt


const Calendario = mongoose.model('Calendario', calendarioSchema);
export default Calendario;