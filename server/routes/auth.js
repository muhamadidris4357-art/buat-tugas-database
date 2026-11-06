import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, logActivity } from '../db.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

function generateCompanyCode(name = 'COMP') {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'COMP';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

// Demo accounts endpoint for instant test login
router.get('/demo-accounts', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.email, u.name, u.role, u.job_title, c.name as company_name, c.code as company_code
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.email IN ('owner@tasksphere.com', 'admin@acme.com', 'sarah@acme.com', 'admin@nexus.com')
       ORDER BY u.role DESC`
    );
    res.json({ accounts: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demo 1-click login
router.post('/demo-login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for demo login.' });
    }

    const { rows } = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Demo account not found.' });
    }

    const user = rows[0];
    let company = null;
    if (user.company_id) {
      const compRes = await query('SELECT * FROM companies WHERE id = ?', [user.company_id]);
      company = compRes.rows[0] || null;
    }

    const token = generateToken(user);
    delete user.password_hash;

    await logActivity(user.company_id, user.id, 'Demo Login', 'auth', user.id, `User logged in via 1-click demo switcher.`);

    res.json({
      message: 'Demo login successful',
      token,
      user,
      company
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Standard Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { rows } = await query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account has been deactivated.' });
    }

    let company = null;
    if (user.company_id) {
      const compRes = await query('SELECT * FROM companies WHERE id = ?', [user.company_id]);
      if (compRes.rows.length > 0) {
        company = compRes.rows[0];
        if (company.status === 'suspended' && user.role !== 'PLATFORM_OWNER') {
          return res.status(403).json({ error: 'Company account is suspended. Please contact platform administrator.' });
        }
      }
    }

    const token = generateToken(user);
    delete user.password_hash;

    await logActivity(user.company_id, user.id, 'User Login', 'auth', user.id, `User ${user.email} logged in.`);

    res.json({
      message: 'Login successful',
      token,
      user,
      company
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Register New Company (Role: COMPANY_ADMIN)
router.post('/register-company', async (req, res) => {
  try {
    const { companyName, industry, country, timezone, adminName, email, password } = req.body;
    if (!companyName || !adminName || !email || !password) {
      return res.status(400).json({ error: 'Company name, admin name, email, and password are required.' });
    }

    // Check if email already registered
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Generate unique company code
    let companyCode = generateCompanyCode(companyName);
    let codeCheck = await query('SELECT id FROM companies WHERE code = ?', [companyCode]);
    while (codeCheck.rows.length > 0) {
      companyCode = generateCompanyCode(companyName);
      codeCheck = await query('SELECT id FROM companies WHERE code = ?', [companyCode]);
    }

    const now = new Date().toISOString();
    const companyId = 'comp_' + crypto.randomBytes(6).toString('hex');
    const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Company
    await query(
      `INSERT INTO companies (id, name, code, description, industry, country, timezone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        companyId,
        companyName.trim(),
        companyCode,
        `${companyName} Enterprise Workspace`,
        industry || 'Technology',
        country || 'Indonesia',
        timezone || 'Asia/Jakarta',
        now,
        now
      ]
    );

    // Create Admin User
    await query(
      `INSERT INTO users (id, company_id, name, email, password_hash, role, job_title, language, timezone, date_format, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'COMPANY_ADMIN', 'Company Administrator', 'en', ?, 'DD/MM/YYYY', 'active', ?, ?)`,
      [
        userId,
        companyId,
        adminName.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        timezone || 'Asia/Jakarta',
        now,
        now
      ]
    );

    // Create Initial Welcome Reminder
    const remId = 'rem_' + crypto.randomBytes(6).toString('hex');
    await query(
      `INSERT INTO reminders (id, company_id, user_id, created_by, title, message, priority, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'info', 0, ?)`,
      [
        remId,
        companyId,
        userId,
        userId,
        'Welcome to TaskSphere Global!',
        `Your workspace is active. Your company invitation code is ${companyCode}. Share this with your team to let them join.`,
        now
      ]
    );

    await logActivity(companyId, userId, 'Company Registered', 'company', companyId, `Company ${companyName} created by ${adminName}.`);

    const userObj = {
      id: userId,
      company_id: companyId,
      name: adminName.trim(),
      email: email.trim().toLowerCase(),
      role: 'COMPANY_ADMIN',
      job_title: 'Company Administrator',
      language: 'en',
      timezone: timezone || 'Asia/Jakarta',
      date_format: 'DD/MM/YYYY',
      status: 'active'
    };

    const companyObj = {
      id: companyId,
      name: companyName.trim(),
      code: companyCode,
      industry: industry || 'Technology',
      country: country || 'Indonesia',
      timezone: timezone || 'Asia/Jakarta',
      status: 'active'
    };

    const token = generateToken(userObj);

    res.status(201).json({
      message: 'Company and admin account created successfully.',
      token,
      user: userObj,
      company: companyObj
    });
  } catch (err) {
    console.error('Register company error:', err);
    res.status(500).json({ error: 'Failed to create company and account.' });
  }
});

// Join Company using Company Code (Role: EMPLOYEE)
router.post('/join-company', async (req, res) => {
  try {
    const { companyCode, name, email, password, jobTitle } = req.body;
    if (!companyCode || !name || !email || !password) {
      return res.status(400).json({ error: 'Company code, full name, email, and password are required.' });
    }

    // Verify company code
    const compRes = await query('SELECT * FROM companies WHERE UPPER(code) = UPPER(?)', [companyCode.trim()]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ error: 'Company with this invitation code was not found. Please verify with your Administrator.' });
    }

    const company = compRes.rows[0];
    if (company.status === 'suspended') {
      return res.status(403).json({ error: 'This company workspace is currently suspended.' });
    }

    // Check if email already used
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address is already registered.' });
    }

    const now = new Date().toISOString();
    const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      `INSERT INTO users (id, company_id, name, email, password_hash, role, job_title, language, timezone, date_format, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'EMPLOYEE', ?, 'en', ?, 'DD/MM/YYYY', 'active', ?, ?)`,
      [
        userId,
        company.id,
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        jobTitle || 'Team Member',
        company.timezone || 'Asia/Jakarta',
        now,
        now
      ]
    );

    await logActivity(company.id, userId, 'Employee Joined', 'user', userId, `${name} joined ${company.name} using code ${companyCode}.`);

    const userObj = {
      id: userId,
      company_id: company.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'EMPLOYEE',
      job_title: jobTitle || 'Team Member',
      language: 'en',
      timezone: company.timezone || 'Asia/Jakarta',
      date_format: 'DD/MM/YYYY',
      status: 'active'
    };

    const token = generateToken(userObj);

    res.status(201).json({
      message: 'Account created. You have successfully joined the company workspace.',
      token,
      user: userObj,
      company
    });
  } catch (err) {
    console.error('Join company error:', err);
    res.status(500).json({ error: 'Failed to join company.' });
  }
});

// Get Current User Profile & Company Info
router.get('/me', authenticate, async (req, res) => {
  try {
    let company = null;
    if (req.user.company_id) {
      const compRes = await query('SELECT * FROM companies WHERE id = ?', [req.user.company_id]);
      company = compRes.rows[0] || null;
    }
    res.json({
      user: req.user,
      company
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, job_title, avatar_url, language, timezone, date_format } = req.body;
    const now = new Date().toISOString();

    await query(
      `UPDATE users
       SET name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           job_title = COALESCE(?, job_title),
           avatar_url = COALESCE(?, avatar_url),
           language = COALESCE(?, language),
           timezone = COALESCE(?, timezone),
           date_format = COALESCE(?, date_format),
           updated_at = ?
       WHERE id = ?`,
      [name, phone, job_title, avatar_url, language, timezone, date_format, now, req.user.id]
    );

    const updated = await query('SELECT id, company_id, name, email, role, job_title, avatar_url, phone, language, timezone, date_format, status FROM users WHERE id = ?', [req.user.id]);
    
    await logActivity(req.user.company_id, req.user.id, 'Updated Profile', 'user', req.user.id, 'User updated their profile settings.');

    res.json({ message: 'Profile updated successfully', user: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const { rows } = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();
    await query('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, req.user.id]);

    await logActivity(req.user.company_id, req.user.id, 'Password Changed', 'user', req.user.id, 'User changed their password.');

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
