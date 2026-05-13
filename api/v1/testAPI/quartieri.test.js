const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Quartieri = require('../models/quartieri');
const Calendari = require('../models/calendari');

let tokenOperatore;
let quartiereId;
let calendarioId;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Login operatore
    const login = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'operatore@test.it', password: 'Test1234!' });
    tokenOperatore = login.body.token;

    // Crea calendario di test
    const calendario = await Calendari.create({
        nome: 'Calendario Test 2026',
        anno: 2026,
        link: 'https://calendario-test.it/ical',
        slot: [],
        festivita: [],
        attivo: true
    });
    calendarioId = calendario._id;

    // Crea quartiere di test
    const quartiere = await Quartieri.create({
        nome: 'Quartiere Test',
        confini: [[46.07, 11.12], [46.08, 11.13], [46.07, 11.14]],
        stileMappa: {
            coloreBordo: '#000000',
            coloreRiempimento: '#3388ff'
        },
        calendario: calendarioId
    });
    quartiereId = quartiere._id;
});

afterAll(async () => {
    await Quartieri.deleteOne({ nome: 'Quartiere Test' });
    await Calendari.deleteOne({ _id: calendarioId });
    await mongoose.connection.close();
});

describe('GET /api/v1/area', () => {
    test('lista quartieri -> 200', async () => {
        const res = await request(app).get('/api/v1/area');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('quartiere per ID -> 200', async () => {
        const res = await request(app).get(`/api/v1/area/${quartiereId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.nome).toBe('Quartiere Test');
    });

    test('quartiere inesistente -> 404', async () => {
        const res = await request(app).get('/api/v1/area/000000000000000000000000');
        expect(res.statusCode).toBe(404);
    });

    test('calendario del quartiere -> 200', async () => {
        const res = await request(app).get(`/api/v1/area/${quartiereId}/calendario`);
        expect(res.statusCode).toBe(200);
        expect(res.body.link).toBe('https://calendario-test.it/ical');
    });
});

describe('POST /api/v1/area', () => {
    test('crea quartiere senza token -> 401', async () => {
        const res = await request(app)
            .post('/api/v1/area')
            .send({ nome: 'Nuovo', confini: [], stileMappa: {} });
        expect(res.statusCode).toBe(401);
    });

    test('crea quartiere come operatore -> 201', async () => {
        const res = await request(app)
            .post('/api/v1/area')
            .set('Authorization', `Bearer ${tokenOperatore}`)
            .send({
                nome: 'Quartiere Nuovo',
                confini: [[46.07, 11.12], [46.08, 11.13]],
                stileMappa: { coloreBordo: '#000000', coloreRiempimento: '#3388ff' }
            });
        expect(res.statusCode).toBe(201);

        // pulizia
        await Quartieri.deleteOne({ nome: 'Quartiere Nuovo' });
    });
});

describe('DELETE /api/v1/area/:id', () => {
    test('elimina senza token -> 401', async () => {
        const res = await request(app).delete(`/api/v1/area/${quartiereId}`);
        expect(res.statusCode).toBe(401);
    });

    test('elimina come operatore -> 204', async () => {
        const tmp = await Quartieri.create({
            nome: 'Da Eliminare',
            confini: [[46.07, 11.12], [46.08, 11.13]],
            stileMappa: { coloreBordo: '#000000', coloreRiempimento: '#3388ff' }
        });
        const res = await request(app)
            .delete(`/api/v1/area/${tmp._id}`)
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(204);
    });
});