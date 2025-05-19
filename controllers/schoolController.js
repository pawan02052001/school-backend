// controllers/schoolController.js
import connectToDb from '../config/db.js';

export const getAllSchools = async (req, res) => {
  try {
    const pool = await connectToDb();
    const result = await pool.request().query('SELECT * FROM schools');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSchoolById = async (req, res) => {
  try {
    const pool = await connectToDb();
    const result = await pool
      .request()
      .input('id', req.params.id)
      .query('SELECT * FROM schools WHERE id = @id');
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSchool = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const pool = await connectToDb();
    const result = await pool
      .request()
      .input('name', name)
      .input('address', address)
      .input('phone', phone)
      .query('INSERT INTO schools (name, address, phone) VALUES (@name, @address, @phone)');
    res.status(201).json({ message: 'School created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    const { id } = req.params;
    const pool = await connectToDb();
    await pool
      .request()
      .input('name', name)
      .input('address', address)
      .input('phone', phone)
      .input('id', id)
      .query('UPDATE schools SET name = @name, address = @address, phone = @phone WHERE id = @id');
    res.json({ message: 'School updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectToDb();
    await pool.request().input('id', id).query('DELETE FROM schools WHERE id = @id');
    res.json({ message: 'School deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};