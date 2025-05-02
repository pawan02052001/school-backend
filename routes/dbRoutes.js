import express from 'express';
import { getAllTables, getColumnsOfTable, getDataFromTable } from '../controllers/dbMetaController.js';

const router = express.Router();

router.get('/tables', getAllTables);  // Fetch all tables
router.get('/columns/:tableName', getColumnsOfTable);  // Fetch columns of specific table
router.get('/data/:tableName', getDataFromTable);  // Fetch data from specific table

export default router;
