import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import dbMetaRoutes from './routes/dbMeta.js';
import connectToDb from './config/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Relaxed CORS for testing
app.use(express.json());

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});
app.use('/api/auth', limiter);

// Routes
console.log('Mounting routes...'); // Debug log
app.use('/api/auth', authRoutes);
app.use('/api', studentRoutes);
app.use('/api/dbmeta', dbMetaRoutes);

// Safe Data Fetch API
app.get('/api/data/:schema/:tableName', async (req, res) => {
  let { schema, tableName } = req.params;
  const allowedSchemas = ['dbo', 'oxfordpsn'];
  const allowedTables = ['schools', 'Exam_Bulk_Report', 'User', 'students'];
  if (!allowedSchemas.includes(schema) || !allowedTables.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid schema or table name' });
  }
  try {
    const pool = await connectToDb();
    const query = `SELECT * FROM [${schema}].[${tableName}]`;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(`Error fetching data from ${schema}.${tableName}:`, err);
    res.status(500).json({ error: `Failed to fetch data from ${schema}.${tableName}` });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});