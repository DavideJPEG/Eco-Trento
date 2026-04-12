import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.status(200).json({ message: 'GET oper ok' }));
router.post('/', (req, res) => res.status(201).json({ message: 'POST oper ok' }));

export default router