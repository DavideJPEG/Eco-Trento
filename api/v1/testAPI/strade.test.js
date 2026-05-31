const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Strade = require('../models/strade');
const Quartieri = require('../models/quartieri');

let stradaId;
let quartiereId;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    // Crea quartiere di prova
    const quartiere = await Quartieri.create({
        nome: 'Quartiere Strade Test',
        confini: [[46.07, 11.12], [46.08, 11.13], [46.07, 11.14]],
        stileMappa: { coloreBordo: '#000000', coloreRiempimento: '#3388ff' }
    });
    quartiereId = quartiere._id;

    // Crea strada di prova

    const strada = await Strade.create({
        nome: 'via test',
        quartiere: quartiereId
    });
    stradaId = strada._id;
});

afterAll(async () => {
    await Strade.deleteOne({ _id: stradaId });
    await Quartieri.deleteOne({ _id: quartiereId });
    await mongoose.connection.close();
});

describe('GET /api/v1/strade', () => {
    test('lista strade -> 200', async () => {
        const res = await request(app).get('/api/v1/strade');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('strada per ID -> 200', async () => {
        const res = await request(app).get(`/api/v1/strade/${stradaId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.nome).toBe('via test');
    });

    test('strada inesistente -> 404', async () => {
        const res = await request(app).get('/api/v1/strade/000000000000000000000000');
        expect(res.statusCode).toBe(404);
    });
});

describe('GET /api/v1/strade/ricerca', () => {
    test('ricerca con testo -> 200 + array', async () => {
        const res = await request(app).get('/api/v1/strade/ricerca?q=via');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('ricerca senza risultati -> 200 + array vuoto', async () => {
        const res = await request(app).get('/api/v1/strade/ricerca?q=viagenerica');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });
});

describe('GET /api/v1/strade/:id/infoCalendario', () => {
    test('info calendario strada -> 200', async () => {
        const res = await request(app).get(`/api/v1/strade/${stradaId}/infoCalendario`);
        expect(res.statusCode).toBe(200);
        expect(res.body.strada.nome).toBe('via test');
        expect(res.body.quartiere.nome).toBe('Quartiere Strade Test');
        // nessun calendario associato al quartiere
        expect(res.body.calendario).toBeNull(); 
    });

    test('info calendario strada inesistente -> 404', async () => {
        const res = await request(app).get('/api/v1/strade/000000000000000000000000/infoCalendario');
        expect(res.statusCode).toBe(404);
    });
});