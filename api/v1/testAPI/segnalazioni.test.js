const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Segnalazioni = require('../models/segnalazioni');
const Notifiche = require('../models/notifiche');

let tokenUtente;
let tokenOperatore;
let utenteId;
let segnalazioneId;

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

    // Crea segnalazione di test
    const segnalazione = await Segnalazioni.create({
        utente: utenteId,
        tipo: 'Abbandono_Rifiuti',
        descrizione: 'Segnalazione di test',
        via: new mongoose.Types.ObjectId(),
        stato: 'Aperta'
    });
    segnalazioneId = segnalazione._id;
});

afterAll(async () => {
    await Segnalazioni.deleteMany({ descrizione: 'Segnalazione di test' });
    await Notifiche.deleteMany({ titolo: { $in: ['Segnalazione presa in carico', 'Segnalazione risolta'] } });
    await mongoose.connection.close();
});

describe('POST /api/v1/segnalazioni', () => {
    test('crea segnalazione come utente -> 201', async () => {
        const res = await request(app)
            .post('/api/v1/segnalazioni')
            .set('Authorization', `Bearer ${tokenUtente}`)
            .send({
                tipo: 'Abbandono_Rifiuti',
                descrizione: 'Segnalazione di test',
                via: new mongoose.Types.ObjectId()
            });
        expect(res.statusCode).toBe(201);
        expect(res.headers.location).toMatch(/\/api\/v1\/segnalazioni\//);
    });
});

describe('GET /api/v1/segnalazioni', () => {
    test('utente -> 200 (solo le sue)', async () => {
        const res = await request(app)
            .get('/api/v1/segnalazioni')
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('operatore -> 200 (tutte)', async () => {
        const res = await request(app)
            .get('/api/v1/segnalazioni')
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('filtro ?stato=Aperta -> 200', async () => {
        const res = await request(app)
            .get('/api/v1/segnalazioni?stato=Aperta')
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(200);
        res.body.forEach(s => expect(s.title).toBeDefined());
    });
});

describe('GET /api/v1/segnalazioni/:id', () => {
    test('id inesistente -> 404', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/v1/segnalazioni/${fakeId}`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(404);
    });

    test('id valido -> 200 con dati', async () => {
        const res = await request(app)
            .get(`/api/v1/segnalazioni/${segnalazioneId}`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.descrizione).toBe('Segnalazione di test');
    });
});

describe('DELETE /api/v1/segnalazioni/:id', () => {
    test('utente proprietario -> 204', async () => {
        const tmp = await Segnalazioni.create({
            utente: utenteId,
            tipo: 'Abbandono_Rifiuti',
            descrizione: 'Segnalazione di test',
            via: new mongoose.Types.ObjectId(),
            stato: 'Aperta'
        });
        const res = await request(app)
            .delete(`/api/v1/segnalazioni/${tmp._id}`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(204);
    });

    test('operatore su segnalazione altrui -> 204', async () => {
        const tmp = await Segnalazioni.create({
            utente: utenteId,
            tipo: 'Abbandono_Rifiuti',
            descrizione: 'Segnalazione di test',
            via: new mongoose.Types.ObjectId(),
            stato: 'Aperta'
        });
        const res = await request(app)
            .delete(`/api/v1/segnalazioni/${tmp._id}`)
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(204);
    });
});

describe('PATCH /api/v1/segnalazioni/:id/presaInCarico', () => {
    test('operatore -> 200 con stato In_Lavorazione', async () => {
        const res = await request(app)
            .patch(`/api/v1/segnalazioni/${segnalazioneId}/presaInCarico`)
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.stato).toBe('In_Lavorazione');
    });

    test('operatore -> notifica creata per utente', async () => {
        const notifica = await Notifiche.findOne({
        utente: utenteId,
        titolo: 'Segnalazione presa in carico'
    });
    expect(notifica).not.toBeNull();
});
});

describe('PATCH /api/v1/segnalazioni/:id/risolta', () => {
    test('operatore -> 200 con stato Risolta', async () => {
        const res = await request(app)
            .patch(`/api/v1/segnalazioni/${segnalazioneId}/risolta`)
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.stato).toBe('Risolta');
    });
});