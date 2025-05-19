// controllers/dbMetaController.js
import connectToDb from '../config/db.js';

// Get all table names with schema
export const getAllTables = async (req, res) => {
  try {
    const pool = await connectToDb();
    const result = await pool
      .request()
      .query(`
        SELECT TABLE_SCHEMA, TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching tables:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
};

// Get all columns of a table with data type
export const getColumnsOfTable = async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const allowedTables = ['schools', 'students', 'User', 'Exam_Bulk_Report'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    const pool = await connectToDb();
    const result = await pool
      .request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}'
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching columns:', err);
    res.status(500).json({ error: 'Failed to fetch columns' });
  }
};

// Get all data from a table
export const getDataFromTable = async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const allowedTables = ['schools', 'students', 'User', 'Exam_Bulk_Report'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }
    const pool = await connectToDb();
    const query = `SELECT * FROM [${tableName}]`;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};