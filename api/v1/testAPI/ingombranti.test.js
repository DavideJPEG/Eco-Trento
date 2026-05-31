const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Ingombranti = require('../models/ingombranti');

let tokenUtente;
let tokenOperatore;
let utenteId;
let richiestaId;
const viaTest = new mongoose.Types.ObjectId();

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const loginUtente = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'utente@test.it', password: 'Test1234!' });
    tokenUtente = loginUtente.body.token;
    utenteId = loginUtente.body.user.id;

    const loginOperatore = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'operatore@test.it', password: 'Test1234!' });
    tokenOperatore = loginOperatore.body.token;

    // Crea richiesta di test
    const richiesta = await Ingombranti.create({
        utente: utenteId,
        viaRitiro: viaTest,
        descrizioneOggetti: 'Divano e frigorifero',
        dataRitiroRichiesta: new Date('2026-06-01'),
        fasciaOraria: 'Mattina (08:00 - 12:00)',
        stato: 'In_Attesa'
    });
    richiestaId = richiesta._id;
});

afterAll(async () => {
    await Ingombranti.deleteMany({ descrizioneOggetti: { $in: ['Divano e frigorifero', 'Lavatrice vecchia'] } });
    await mongoose.connection.close();
});

describe('GET /api/v1/ingombranti', () => {
    test('lista come utente -> 200 (solo le sue)', async () => {
        const res = await request(app)
            .get('/api/v1/ingombranti')
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('lista come operatore -> 200 (tutte)', async () => {
        const res = await request(app)
            .get('/api/v1/ingombranti')
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('lista filtrata per stato -> 200', async () => {
        const res = await request(app)
            .get('/api/v1/ingombranti?stato=In_Attesa')
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(200);
        res.body.forEach(r => expect(r.stato).toBe('In_Attesa'));
    });
});

describe('POST /api/v1/ingombranti', () => {
    test('crea richiesta come utente -> 201', async () => {
        const res = await request(app)
            .post('/api/v1/ingombranti')
            .set('Authorization', `Bearer ${tokenUtente}`)
            .send({
                viaRitiro: viaTest,
                descrizioneOggetti: 'Lavatrice vecchia',
                dataRitiroRichiesta: new Date('2026-07-01'),
                fasciaOraria: 'Pomeriggio (14:00 - 18:00)'
            });
        expect(res.statusCode).toBe(201);
    });
});

describe('GET /api/v1/ingombranti/:id', () => {
    test('richiesta per ID come utente proprietario -> 200', async () => {
        const res = await request(app)
            .get(`/api/v1/ingombranti/${richiestaId}`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.descrizioneOggetti).toBe('Divano e frigorifero');
    });

    test('richiesta inesistente -> 404', async () => {
        const res = await request(app)
            .get('/api/v1/ingombranti/000000000000000000000000')
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(404);
    });
});

describe('PATCH /api/v1/ingombranti/:id/accetta', () => {
    test('accetta come utente -> 403', async () => {
        const res = await request(app)
            .patch(`/api/v1/ingombranti/${richiestaId}/accetta`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(403);
    });

    test('accetta come operatore -> 200', async () => {
        const res = await request(app)
            .patch(`/api/v1/ingombranti/${richiestaId}/accetta`)
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.stato).toBe('Accettata');
    });
});

describe('PATCH /api/v1/ingombranti/:id/proponiModifica', () => {
    test('proponi modifica come operatore -> 200', async () => {
        const res = await request(app)
            .patch(`/api/v1/ingombranti/${richiestaId}/proponiModifica`)
            .set('Authorization', `Bearer ${tokenOperatore}`)
            .send({
                dataRitiroRichiesta: new Date('2026-06-10'),
                fasciaOraria: '14:00 - 18:00',
                noteOperatore: 'Messaggio prova'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body.stato).toBe('Modifica_Proposta');
    });
});

describe('PATCH /api/v1/ingombranti/:id/accettaModifica', () => {
    test('utente accetta modifica proposta -> 200', async () => {
        const res = await request(app)
            .patch(`/api/v1/ingombranti/${richiestaId}/accettaModifica`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.stato).toBe('Accettata');
    });
});

describe('PATCH /api/v1/ingombranti/:id/completa', () => {
    test('completa come operatore -> 200', async () => {
        const res = await request(app)
            .patch(`/api/v1/ingombranti/${richiestaId}/completa`)
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.stato).toBe('Completata');
    });
});

describe('PATCH /api/v1/ingombranti/:id/annulla', () => {
    test('annulla come utente -> 200', async () => {
        // Crea una nuova richiesta che verrà annullata
        const nuova = await Ingombranti.create({
            utente: utenteId,
            viaRitiro: viaTest,
            descrizioneOggetti: 'Divano e frigorifero',
            dataRitiroRichiesta: new Date('2026-08-01'),
            fasciaOraria: 'Mattina (08:00 - 12:00)',
            stato: 'In_Attesa'
        });
        const res = await request(app)
            .patch(`/api/v1/ingombranti/${nuova._id}/annulla`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.stato).toBe('Annullata');
    });
});

describe('DELETE /api/v1/ingombranti/:id', () => {
    test('elimina come utente proprietario -> 204', async () => {
        const tmp = await Ingombranti.create({
            utente: utenteId,
            viaRitiro: viaTest,
            descrizioneOggetti: 'Divano e frigorifero',
            dataRitiroRichiesta: new Date('2026-09-01'),
            fasciaOraria: 'Mattina (08:00 - 12:00)',
            stato: 'In_Attesa'
        });
        const res = await request(app)
            .delete(`/api/v1/ingombranti/${tmp._id}`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(204);
    });
});