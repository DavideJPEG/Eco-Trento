const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Notifiche = require('../models/notifiche');

let tokenUtente;
let utenteId;
let notificaId;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const loginUtente = await request(app)
        .post('/api/v1/auth')
        .send({ email: 'utente@test.it', password: 'Test1234!' });
    tokenUtente = loginUtente.body.token;
    utenteId = loginUtente.body.user.id;

    // Crea notifica di test
    const notifica = await Notifiche.create({
        utente: utenteId,
        tipo: 'Info_Comune',
        titolo: 'Notifica di test',
        messaggio: 'Messaggio di test',
        letta: false
    });
    notificaId = notifica._id;
});

afterAll(async () => {
    await Notifiche.deleteMany({ titolo: { $in: ['Notifica di test', 'Notifica altro utente'] } });
    await mongoose.connection.close();
});


describe('GET /api/v1/notifiche', () => {
    test('con token -> 200 e array', async () => {
        const res = await request(app)
            .get('/api/v1/notifiche')
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});


describe('GET /api/v1/notifiche/:id', () => {
    test('id inesistente -> 404', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/api/v1/notifiche/${fakeId}`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(404);
    });
    test('id valido e utente corretto -> 200 con dati', async () => {
        const res = await request(app)
            .get(`/api/v1/notifiche/${notificaId}`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.titolo).toBe('Notifica di test');
        expect(res.body.messaggio).toBe('Messaggio di test');
    });
});


describe('PATCH /api/v1/notifiche/:id/letta', () => {
    test('segna come letta -> 200 con letta:true', async () => {
        const res = await request(app)
            .patch(`/api/v1/notifiche/${notificaId}/letta`)
            .set('Authorization', `Bearer ${tokenUtente}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.letta).toBe(true);
    });
});