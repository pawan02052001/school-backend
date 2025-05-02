import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js'; // ✅ Ensure path is correct
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';

dotenv.config();


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);

// ✅ Safe Data Fetch API (prevent SQL injection by validating inputs)
app.get('/api/data/:schema/:tableName', async (req, res) => {
  let { schema, tableName } = req.params;

  // Optional security: allow only alphanumeric + underscore to avoid SQL injection
  const isValid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema) && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid schema or table name' });
  }

  try {
    const query = `SELECT * FROM ${schema}.${tableName}`;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(`❌ Error fetching data from ${schema}.${tableName}:`, err);
    res.status(500).json({ error: `Failed to fetch data from ${schema}.${tableName}` });
  }
});

app.listen(port,'0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
