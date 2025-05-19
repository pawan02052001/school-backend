// controllers/studentController.js
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import connectToDb from '../config/db.js';

export const createStudent = async (req, res) => {
  try {
    const { firstName, email } = req.body;
    const pool = await connectToDb();

    // Increment counter and generate studentId
    const counterResult = await pool
      .request()
      .query(`
        UPDATE counters
        SET value = value + 1
        OUTPUT INSERTED.value
        WHERE name = 'studentId'
      `);
    const counterValue = counterResult.recordset[0].value;
    const studentId = `TPS2025${String(counterValue).padStart(3, '0')}`; // Example: TPS2025001

    // Generate random password
    const password = Math.random().toString(36).slice(-8); // Random 8-char password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert student into database
    await pool
      .request()
      .input('studentId', sql.VarChar, studentId)
      .input('firstName', sql.VarChar, firstName)
      .input('password', sql.NVarChar, hashedPassword)
      .input('email', sql.VarChar, email)
      .query(`
        INSERT INTO students (studentId, firstName, password, email, isAuthorized)
        VALUES (@studentId, @firstName, @password, @email, 1)
      `);

    res.status(201).json({ studentId, password });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ error: 'Failed to create student' });
  }
};

export const bulkCreateStudents = async (req, res) => {
  try {
    const students = req.body.students;
    const pool = await connectToDb();
    const credentials = [];

    for (const student of students) {
      const counterResult = await pool
        .request()
        .query(`
          UPDATE counters
          SET value = value + 1
          OUTPUT INSERTED.value
          WHERE name = 'studentId'
        `);
      const counterValue = counterResult.recordset[0].value;
      const studentId = `TPS2025${String(counterValue).padStart(3, '0')}`;

      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(password, 10);

      await pool
        .request()
        .input('studentId', sql.VarChar, studentId)
        .input('firstName', sql.VarChar, student.firstName)
        .input('password', sql.NVarChar, hashedPassword)
        .input('email', sql.VarChar, student.email)
        .query(`
          INSERT INTO students (studentId, firstName, password, email, isAuthorized)
          VALUES (@studentId, @firstName, @password, @email, 1)
        `);

      credentials.push({ studentId, password });
    }

    res.status(201).json(credentials);
  } catch (err) {
    console.error('Error bulk creating students:', err);
    res.status(500).json({ error: 'Failed to bulk create students' });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const pool = await connectToDb();
    const result = await pool
      .request()
      .input('studentId', sql.VarChar, studentId)
      .query(`SELECT studentId, firstName, email FROM students WHERE studentId = @studentId`);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};