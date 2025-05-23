import express from 'express';
import sql from 'mssql';
import { authenticateToken, adminOnly, studentOnly } from '../middleware/auth.js';
import connectToDb from '../config/db.js';

const router = express.Router();

// Get all students (admin only)
router.get('/students', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = await connectToDb();
    const result = await pool.request()
      .query(`SELECT UserName, Name, Role FROM oxfordpsn.[User] WHERE Role = 'Student' AND IsActive = 1 AND IsDeleted = 0`);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get student by ID (student only)
router.get('/students/:studentId', authenticateToken, studentOnly, async (req, res) => {
  const { studentId } = req.params;
  try {
    const pool = await connectToDb();
    const result = await pool.request()
      .input('studentId', sql.VarChar, studentId)
      .query(`SELECT UserName, Name, Role FROM oxfordpsn.[User] WHERE UserName = @studentId AND Role = 'Student' AND IsActive = 1 AND IsDeleted = 0`);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(200).json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

export default router;