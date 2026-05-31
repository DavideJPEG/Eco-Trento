const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Utenti = require('../models/utenti');
const bcrypt = require('bcrypt');

let tokenUtente;
let tokenDummy;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Login utente normale
    const login = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'utente@test.it', password: 'Test1234!' });
    tokenUtente = login.body.token;

    // Crea utente temporaneo per il test
    const hash = await bcrypt.hash('Test1234!', 10);
    await Utenti.create({
        nome: 'Test',
        cognome: 'test',
        email: 'Mailtest@test.it',
        password: hash,
        ruolo: 'utente'
    });

    const loginTmp = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'Mailtest@test.it', password: 'Test1234!' });
    tokenDummy = loginTmp.body.token;
});

afterAll(async () => {
    // pulizia nel caso il test di eliminazione fallisse
    await Utenti.deleteOne({ email: 'Mailtest@test.it' });
    await Utenti.deleteOne({ email: 'nuovo@test.it' });
    await mongoose.connection.close();
});

describe('POST /api/v1/utenti/register', () => {
    test('registrazione con dati validi -< 201', async () => {
        const res = await request(app)
            .post('/api/v1/utenti/register')
            .send({
                nome: 'Nuovo',
                cognome: 'Utente',
                email: 'nuovo@test.it',
                password: 'Test1234!'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('nuovo@test.it');
        expect(res.body.user.ruolo).toBe('utente');
    });

    test('registrazione email già esistente -> 409', async () => {
        const res = await request(app)
            .post('/api/v1/utenti/register')
            .send({
                nome: 'Mario',
                cognome: 'Rossi',
                email: 'utente@test.it',
                password: 'Test1234!'
            });
        expect(res.statusCode).toBe(409);
        expect(res.body.success).toBe(false);
    });
});

describe('GET /api/v1/utenti/me', () => {
    test('profilo con token valido -> 200', async () => {
        const res = await request(app)
            .get('/api/v1/utenti/me')
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('utente@test.it');
    });
});

describe('PATCH /api/v1/utenti/me', () => {
    test('modifica nome con token valido -> 200', async () => {
        const res = await request(app)
            .patch('/api/v1/utenti/me')
            .set('Authorization', `Bearer ${tokenUtente}`)
            .send({ nome: 'Mario Modificato' });
        expect(res.statusCode).toBe(200);
        expect(res.body.user.nome).toBe('Mario Modificato');
    });

    test('modifica preferenze notifiche -> 200', async () => {
        const res = await request(app)
            .patch('/api/v1/utenti/me')
            .set('Authorization', `Bearer ${tokenUtente}`)
            .send({ notificaApp: true, notificaEmail: false });
        expect(res.statusCode).toBe(200);
        expect(res.body.user.preferenzeNotifiche.app).toBe(true);
        expect(res.body.user.preferenzeNotifiche.email).toBe(false);
    });
});

describe('DELETE /api/v1/utenti/me', () => {
    test('elimina account con token valido -> 204', async () => {
        const res = await request(app)
            .delete('/api/v1/utenti/me')
            .set('Authorization', `Bearer ${tokenDummy}`);
        expect(res.statusCode).toBe(204);
    });
});