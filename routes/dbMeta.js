// routes/dbMeta.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAllTables, getColumnsOfTable, getDataFromTable } from '../controllers/dbMetaController.js';

const router = express.Router();

router.get('/tables', authenticateToken, getAllTables);
router.get('/columns/:tableName', authenticateToken, getColumnsOfTable);
router.get('/data/:tableName', authenticateToken, getDataFromTable);

export default router;