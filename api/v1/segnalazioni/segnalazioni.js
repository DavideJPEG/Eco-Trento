import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.status(200).json({ message: 'GET segn ok' }));
router.post('/', (req, res) => res.status(201).json({ message: 'POST segn ok' }));

export default router