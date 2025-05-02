import pool from '../config/db.js';

// Fetch all schools
export const getAllSchools = async () => {
  try {
    const [rows] = await pool.query('SELECT * FROM schools');
    return rows;
  } catch (err) {
    throw new Error('Error fetching schools: ' + err.message);
  }
};

// Fetch a single school by ID
export const getSchoolById = async (id) => {
  try {
    const [rows] = await pool.query('SELECT * FROM schools WHERE id = ?', [id]);
    return rows[0];
  } catch (err) {
    throw new Error('Error fetching school by ID: ' + err.message);
  }
};

// Create a new school
export const createSchool = async (schoolData) => {
  try {
    const { name, address, phone } = schoolData;
    const [result] = await pool.query(
      'INSERT INTO schools (name, address, phone) VALUES (?, ?, ?)',
      [name, address, phone]
    );
    return result.insertId;
  } catch (err) {
    throw new Error('Error creating school: ' + err.message);
  }
};

// Update an existing school by ID
export const updateSchool = async (id, schoolData) => {
  try {
    const { name, address, phone } = schoolData;
    await pool.query(
      'UPDATE schools SET name = ?, address = ?, phone = ? WHERE id = ?',
      [name, address, phone, id]
    );
  } catch (err) {
    throw new Error('Error updating school: ' + err.message);
  }
};

// Delete a school by ID
export const deleteSchool = async (id) => {
  try {
    await pool.query('DELETE FROM schools WHERE id = ?', [id]);
  } catch (err) {
    throw new Error('Error deleting school: ' + err.message);
  }
};
