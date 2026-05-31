const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
require('dotenv').config();

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('POST /api/v1/auth', () => {
    test('login con credenziali corrette -> 200 + token', async () => {
        const res = await request(app)
            .post('/api/v1/auth')
            .send({ email: 'utente@test.it', password: 'Test1234!' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });

    test('login con password errata -> 401', async () => {
        const res = await request(app)
            .post('/api/v1/auth')
            .send({ email: 'utente@test.it', password: 'testErrato' });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });

    test('login senza email e password -> 400', async () => {
        const res = await request(app)
            .post('/api/v1/auth')
            .send({});

        expect(res.statusCode).toBe(400);
    });

    test('login utente inesistente -> 401', async () => {
        const res = await request(app)
            .post('/api/v1/auth')
            .send({ email: 'nonexiste@test.it', password: 'Test1234!' });

        expect(res.statusCode).toBe(401);
    });
});