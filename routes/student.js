import express from 'express';
import pool from '../config/db.js'; // ✅ Corrected path

const router = express.Router();

router.get('/students', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT studentid, firstname
      FROM dbo.Exam_Bulk_Report
    `;

    const result = await pool.request().query(query); // ✅ No need for db.connect()
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

export default router;
