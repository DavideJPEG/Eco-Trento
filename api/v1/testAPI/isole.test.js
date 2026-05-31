const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Isole = require('../models/isole');

let tokenOperatore;
let isolaId;
const stradaTest = new mongoose.Types.ObjectId();

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const login = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'operatore@test.it', password: 'Test1234!' });
    tokenOperatore = login.body.token;

    const isola = await Isole.create({
        nome: 'Isola Test',
        coordinate: [46.07, 11.12],
        strada: stradaTest,
        statoFisico: 'Attiva',
        bidoni: [
            { tipoRifiuto: 'Vetro', livelloRiempimento: 50 }
        ]
    });
    isolaId = isola._id;
});

afterAll(async () => {
    await Isole.deleteOne({ _id: isolaId });
    await mongoose.connection.close();
});

describe('GET /api/v1/isole', () => {
    test('lista isole -> 200', async () => {
        const res = await request(app).get('/api/v1/isole');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('isola per ID -> 200', async () => {
        const res = await request(app).get(`/api/v1/isole/${isolaId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.nome).toBe('Isola Test');
    });

    test('isola inesistente -> 404', async () => {
        const res = await request(app).get('/api/v1/isole/000000000000000000000000');
        expect(res.statusCode).toBe(404);
    });
});

describe('PATCH /api/v1/isole/:id', () => {
    test('modifica come operatore -> 200', async () => {
        const res = await request(app)
            .patch(`/api/v1/isole/${isolaId}`)
            .set('Authorization', `Bearer ${tokenOperatore}`)
            .send({ statoFisico: 'In_Manutenzione' });
        expect(res.statusCode).toBe(200);
        expect(res.body.statoFisico).toBe('In_Manutenzione');
    });
});

describe('DELETE /api/v1/isole/:id', () => {
    test('elimina come operatore -> 204', async () => {
        const tmp = await Isole.create({
            nome: 'Da Eliminare',
            coordinate: [46.07, 11.12],
            strada: stradaTest,
            statoFisico: 'Attiva'
        });
        const res = await request(app)
            .delete(`/api/v1/isole/${tmp._id}`)
            .set('Authorization', `Bearer ${tokenOperatore}`);
        expect(res.statusCode).toBe(204);
    });

    test('elimina come utente normale → 403', async () => {
        const loginUtente = await request(app)
            .post('/api/v1/auth')
            .send({ email: 'utente@test.it', password: 'Test1234!' });

        const res = await request(app)
            .delete(`/api/v1/isole/${isolaId}`)
            .set('Authorization', `Bearer ${loginUtente.body.token}`);

        expect(res.statusCode).toBe(403);
    });
});