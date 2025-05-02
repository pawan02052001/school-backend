import pool from '../config/db.js';

// 🧩 1. Get all table names with schema
export const getAllTables = async (req, res) => {
  try {
    const result = await pool
      .request()
      .query(`
        SELECT TABLE_SCHEMA, TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Error fetching tables:', err);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
};

// 🧩 2. Get all columns of a table with data type
export const getColumnsOfTable = async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const result = await pool
      .request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}'
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Error fetching columns:', err);
    res.status(500).json({ error: 'Failed to fetch columns' });
  }
};

// ✅ 3. Get all data from a table
export const getDataFromTable = async (req, res) => {
  try {
    const tableName = req.params.tableName;
    const query = `SELECT * FROM ${tableName}`;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Error fetching data:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};
