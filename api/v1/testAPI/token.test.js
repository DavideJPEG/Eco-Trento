const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

let tokenUtente;
let tokenOperatore;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const loginUtente = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'utente@test.it', password: 'Test1234!' });
    tokenUtente = loginUtente.body.token;

    const loginOperatore = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'operatore@test.it', password: 'Test1234!' });
    tokenOperatore = loginOperatore.body.token;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('utentiAuth middleware', () => {
    test('nessun token → 401', async () => {
        const res = await request(app).get('/api/v1/ingombranti');
        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('token malformato → 403', async () => {
        const res = await request(app)
            .get('/api/v1/ingombranti')
            .set('Authorization', 'Bearer tokenfalso');
        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
    });

    test('token valido → accesso consentito', async () => {
        const res = await request(app)
            .get('/api/v1/ingombranti')
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
    });
});

describe('operatoriAuth middleware', () => {
    test('utente normale → 403', async () => {
        const res = await request(app)
            .post('/api/v1/area')
            .set('Authorization', `Bearer ${tokenUtente}`)
            .send({ nome: 'Test', confini: [[46.07, 11.12]], stileMappa: {} });
        expect(res.statusCode).toBe(403);
    });

    test('operatore → accesso consentito', async () => {
        const res = await request(app)
            .post('/api/v1/area')
            .set('Authorization', `Bearer ${tokenOperatore}`)
            .send({ nome: 'QuartiereMiddlewareTest', confini: [[46.07, 11.12], [46.08, 11.13], [46.07, 11.14]], stileMappa: {} });
        expect(res.statusCode).toBe(201);

        // pulizia
        const Quartieri = require('../models/quartieri');
        await Quartieri.deleteOne({ nome: 'QuartiereMiddlewareTest' });
    });
});