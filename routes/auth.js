import express from 'express';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

const router = express.Router();

// SIGNUP ✅
router.post('/signup', async (req, res) => {
  const { UserName, Password, Email, Name } = req.body;

  if (!UserName || !Password || !Email || !Name) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const pool = await sql.connect();

    // Check if user already exists
    const checkUser = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .query(`SELECT * FROM oxfordpsn.[User] WHERE UserName = @UserName`);

    if (checkUser.recordset.length > 0) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);

    await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .input('Password', sql.NVarChar, hashedPassword)
      .input('Email', sql.NVarChar, Email)
      .input('Name', sql.VarChar, Name)
      .input('IsActive', sql.Bit, 1)
      .input('IsDeleted', sql.Bit, 0)
      .query(`
        INSERT INTO oxfordpsn.[User] (UserName, Password, Email, Name, IsActive, IsDeleted, CreatedAt)
        VALUES (@UserName, @Password, @Email, @Name, @IsActive, @IsDeleted, GETDATE())
      `);

    res.status(201).json({ message: 'Signup successful.' });

  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ error: 'There was an issue with the signup process.' });
  }
});

// LOGIN ✅
router.post('/login', async (req, res) => {
  const { UserName, Password } = req.body;

  if (!UserName || !Password) {
    return res.status(400).json({ error: 'UserName and Password are required.' });
  }

  try {
    const pool = await sql.connect();

    const userResult = await pool.request()
      .input('UserName', sql.VarChar, UserName)
      .query(`SELECT * FROM oxfordpsn.[User] WHERE UserName = @UserName AND IsActive = 1 AND IsDeleted = 0`);

    if (userResult.recordset.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    const user = userResult.recordset[0];

    const passwordMatch = await bcrypt.compare(Password, user.Password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    res.status(200).json({
      message: 'Login successful.',
      user: {
        UserName: user.UserName,
        Name: user.Name,
        Email: user.Email,
        Role: user.Role
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'There was an issue with the login process.' });
  }
});

export default router; // Export router using ES module syntax
