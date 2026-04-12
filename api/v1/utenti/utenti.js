import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.status(200).json({ message: 'GET ute ok' }));
router.post('/', (req, res) => res.status(201).json({ message: 'POST ute ok' }));

export default router