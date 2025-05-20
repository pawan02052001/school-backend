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
    console.log('Signup failed: Missing required fields');
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const pool = await connectToDb();
    const checkUser = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .query(`SELECT * FROM oxfordpsn.[User] WHERE UserName = @UserName`);

    if (checkUser.recordset.length > 0) {
      console.log('Signup failed: User already exists:', UserName);
      return res.status(409).json({ error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .input('Password', sql.NVarChar, hashedPassword)
      .input('Email', sql.NVarChar, Email)
      .input('Name', sql.VarChar, Name)
      .input('Role', sql.VarChar, Role)
      .input('IsActive', sql.Bit, 1)
      .input('IsDeleted', sql.Bit, 0)
      .query(`
        INSERT INTO oxfordpsn.[User] (UserName, Password, Email, Name, Role, IsActive, IsDeleted, CreatedAt)
        VALUES (@UserName, @Password, @Email, @Name, @Role, @IsActive, @IsDeleted, GETDATE())
      `);

    console.log('Signup successful for:', UserName);
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
    console.log('Login failed: Missing UserName or Password');
    return res.status(400).json({ error: 'UserName and Password are required.' });
  }

  try {
    const pool = await connectToDb();
    const userResult = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .query(`SELECT * FROM oxfordpsn.[User] WHERE UserName = @UserName AND IsActive = 1 AND IsDeleted = 0`);

    if (userResult.recordset.length === 0) {
      console.log('Login failed: User not found or inactive:', UserName);
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    const user = userResult.recordset[0];
    console.log('Login attempt for:', UserName);

    if (!user.Password) {
      console.log('Login failed: No valid password found for:', UserName);
      return res.status(500).json({ error: 'No valid password found for user.' });
    }

    const passwordMatch = await bcrypt.compare(Password, user.Password);
    if (!passwordMatch) {
      console.log('Login failed: Password mismatch for:', UserName);
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { userId: user.UserName, role: user.Role.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Login successful, user:', {
      UserName: user.UserName,
      Role: user.Role
    });

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        UserName: user.UserName,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role.toLowerCase(),
      },
    });
  } catch (err) {
    console.error('Login Error:', err.message, err.stack);
    res.status(500).json({ error: 'There was an issue with the login process.', details: err.message });
  }
});

// GET ALL USERS (Admin Only)
router.get('/users', authenticateToken, adminOnly, async (req, res) => {
  console.log('GET /api/auth/users called, user:', req.user);
  try {
    const pool = await connectToDb();
    console.log('Database connected for users route');
    const result = await pool.request()
      .query(`
        SELECT UserName, Name, Role 
        FROM oxfordpsn.[User] 
        WHERE IsActive = 1 AND IsDeleted = 0
      `);
    console.log('Users fetched:', result.recordset.length);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching users:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { UserName, NewPassword } = req.body;
  console.log('Reset Password Request:', { UserName, NewPasswordLength: NewPassword ? NewPassword.length : 0 });

  if (!UserName || !NewPassword) {
    console.log('Reset failed: Missing UserName or NewPassword');
    return res.status(400).json({ error: 'UserName and New Password are required.' });
  }

  if (NewPassword.length < 6) {
    console.log('Reset failed: Password too short for:', UserName);
    return res.status(400).json({ error: 'New Password must be at least 6 characters long.' });
  }

  try {
    const pool = await connectToDb();
    const userResult = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .query(`SELECT * FROM oxfordpsn.[User] WHERE UserName = @UserName AND IsActive = 1 AND IsDeleted = 0`);

    console.log('User Query Result:', userResult.recordset);

    if (userResult.recordset.length === 0) {
      console.log('Reset failed: User not found:', UserName);
      return res.status(404).json({ error: 'User not found.' });
    }

    const hashedNewPassword = await bcrypt.hash(NewPassword, 10);

    const updateResult = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .input('Password', sql.NVarChar, hashedNewPassword)
      .query(`
        UPDATE oxfordpsn.[User]
        SET Password = @Password
        WHERE UserName = @UserName
      `);

    console.log('Password reset for:', UserName, 'Rows affected:', updateResult.rowsAffected);

    if (updateResult.rowsAffected[0] === 0) {
      console.log('Reset failed: No rows updated for:', UserName);
      return res.status(500).json({ error: 'Failed to update password.' });
    }

    res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error('Reset Password Error:', err.message, err.stack);
    res.status(500).json({ error: 'There was an issue resetting the password.', details: err.message });
  }
});

export default router;