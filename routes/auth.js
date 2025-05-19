import express from 'express';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminOnly, authenticateToken } from '../middleware/auth.js';
import connectToDb from '../config/db.js';

const router = express.Router();

// SIGNUP (Admin Only)
router.post('/signup', authenticateToken, adminOnly, async (req, res) => {
  const { UserName, Password, Email, Name, Role } = req.body;

  if (!UserName || !Password || !Email || !Name || !Role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const pool = await connectToDb();
    const checkUser = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .query(`SELECT * FROM oxfordpsn.[User] WHERE UserName = @UserName`);

    if (checkUser.recordset.length > 0) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .input('Password', sql.NVarChar, hashedPassword)
      .input('PassSalt', sql.NVarChar, salt)
      .input('Email', sql.NVarChar, Email)
      .input('Name', sql.VarChar, Name)
      .input('Role', sql.VarChar, Role)
      .input('IsActive', sql.Bit, 1)
      .input('IsDeleted', sql.Bit, 0)
      .query(`
        INSERT INTO oxfordpsn.[User] (UserName, Password, PassSalt, Email, Name, Role, IsActive, IsDeleted, CreatedAt)
        VALUES (@UserName, @Password, @PassSalt, @Email, @Name, @Role, @IsActive, @IsDeleted, GETDATE())
      `);

    res.status(201).json({ message: 'Signup successful.' });
  } catch (err) {
    console.error('Signup Error:', err.message, err.stack);
    res.status(500).json({ error: 'There was an issue with the signup process.', details: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { UserName, Password } = req.body;

  if (!UserName || !Password) {
    return res.status(400).json({ error: 'UserName and Password are required.' });
  }

  try {
    const pool = await connectToDb();
    const userResult = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .query(`SELECT * FROM oxfordpsn.[User] WHERE UserName = @UserName AND IsActive = 1 AND IsDeleted = 0`);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    const user = userResult.recordset[0];
    let storedPassword = user.Password;
    if (user.GeneratedPassword) {
      storedPassword = user.GeneratedPassword;
    }

    const passwordMatch = await bcrypt.compare(Password, storedPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { userId: user.UserName, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        UserName: user.UserName,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role,
      },
    });
  } catch (err) {
    console.error('Login Error:', err.message, err.stack);
    res.status(500).json({ error: 'There was an issue with the login process.', details: err.message });
  }
});

// GET ALL USERS (Admin Only)
router.get('/users', authenticateToken, adminOnly, async (req, res) => {
  console.log('GET /api/auth/users called'); // Debug log
  try {
    const pool = await connectToDb();
    console.log('Database connected for users route'); // Debug log
    const result = await pool.request()
      .query(`
        SELECT UserName, Name, Role 
        FROM oxfordpsn.[User] 
        WHERE IsActive = 1 AND IsDeleted = 0
      `);
    console.log('Users fetched:', result.recordset.length); // Debug log
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching users:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { UserName } = req.body;
  console.log('Reset Password Request for UserName:', UserName); // Debug log

  if (!UserName) {
    return res.status(400).json({ error: 'UserName is required.' });
  }

  try {
    const pool = await connectToDb();
    const userResult = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .query(`SELECT * FROM oxfordpsn.[User] WHERE UserName = @UserName AND IsActive = 1 AND IsDeleted = 0`);

    console.log('User Query Result:', userResult.recordset); // Debug log

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .input('GeneratedPassword', sql.NVarChar, hashedTempPassword)
      .query(`
        UPDATE oxfordpsn.[User]
        SET GeneratedPassword = @GeneratedPassword
        WHERE UserName = @UserName
      `);

    console.log('Temporary password generated for:', UserName); // Debug log
    res.status(200).json({ message: 'Temporary password generated.', tempPassword });
  } catch (err) {
    console.error('Reset Password Error:', err.message, err.stack);
    res.status(500).json({ error: 'There was an issue resetting the password.', details: err.message });
  }
});

export default router;