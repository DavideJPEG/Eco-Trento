import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.status(200).json({ message: 'GET ing ok' }));
router.post('/', (req, res) => res.status(201).json({ message: 'POST ing ok' }));

export default router