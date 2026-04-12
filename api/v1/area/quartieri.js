import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.status(200).json({ message: 'GET area ok' }));
router.post('/', (req, res) => res.status(201).json({ message: 'POST area ok' }));

export default router