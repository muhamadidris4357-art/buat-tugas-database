import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, logActivity } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List users with filtering, search, pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, role, status, company_id, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let sql = `
      SELECT u.id, u.company_id, u.name, u.email, u.role, u.job_title, u.avatar_url,
             u.phone, u.language, u.timezone, u.status, u.created_at,
             c.name as company_name, c.code as company_code,
             (SELECT COUNT(*) FROM task_assignments ta WHERE ta.user_id = u.id) as assigned_tasks_count,
             (SELECT COUNT(*) FROM task_assignments ta WHERE ta.user_id = u.id AND ta.status = 'completed') as completed_tasks_count
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Tenant isolation
    if (req.user.role === 'PLATFORM_OWNER') {
      if (company_id) {
        sql += ` AND u.company_id = ?`;
        params.push(company_id);
      }
    } else {
      // Company Admin & Employee can only see their company users
      sql += ` AND u.company_id = ?`;
      params.push(req.user.company_id);
    }

    if (search) {
      sql += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.job_title) LIKE ?)`;
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    if (role && role !== 'all') {
      sql += ` AND u.role = ?`;
      params.push(role);
    }

    if (status && status !== 'all') {
      sql += ` AND u.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const { rows } = await query(sql, params);

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
    const countParams = [];

    if (req.user.role !== 'PLATFORM_OWNER') {
      countSql += ` AND u.company_id = ?`;
      countParams.push(req.user.company_id);
    } else if (company_id) {
      countSql += ` AND u.company_id = ?`;
      countParams.push(company_id);
    }

    if (search) {
      countSql += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.job_title) LIKE ?)`;
      const term = `%${search.toLowerCase().trim()}%`;
      countParams.push(term, term, term);
    }
    if (role && role !== 'all') {
      countSql += ` AND u.role = ?`;
      countParams.push(role);
    }
    if (status && status !== 'all') {
      countSql += ` AND u.status = ?`;
      countParams.push(status);
    }

    const countRes = await query(countSql, countParams);
    const total = countRes.rows[0]?.total || 0;

    res.json({
      users: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new user / employee to company (Company Admin only)
router.post('/', authenticate, requireRole(['COMPANY_ADMIN', 'PLATFORM_OWNER']), async (req, res) => {
  try {
    const { name, email, password, jobTitle, role = 'EMPLOYEE', targetCompanyId } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and initial password are required.' });
    }

    const companyId = req.user.role === 'PLATFORM_OWNER' ? (targetCompanyId || req.user.company_id) : req.user.company_id;
    if (!companyId && role !== 'PLATFORM_OWNER') {
      return res.status(400).json({ error: 'Company association is required.' });
    }

    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const now = new Date().toISOString();
    const userId = 'usr_' + crypto.randomBytes(6).toString('hex');
    const passwordHash = await bcrypt.hash(password, 10);

    await query(
      `INSERT INTO users (id, company_id, name, email, password_hash, role, job_title, language, timezone, date_format, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'en', 'Asia/Jakarta', 'DD/MM/YYYY', 'active', ?, ?)`,
      [
        userId,
        companyId,
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        role,
        jobTitle || 'Team Member',
        now,
        now
      ]
    );

    await logActivity(companyId, req.user.id, 'User Created', 'user', userId, `Created user account for ${name} (${role}).`);

    res.status(201).json({
      message: 'User account created successfully.',
      user: {
        id: userId,
        company_id: companyId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        job_title: jobTitle || 'Team Member',
        status: 'active'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle user status active/inactive
router.put('/:id/status', authenticate, requireRole(['COMPANY_ADMIN', 'PLATFORM_OWNER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive.' });
    }

    // Verify user belongs to same company if not platform owner
    const targetRes = await query('SELECT company_id, name, email FROM users WHERE id = ?', [id]);
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = targetRes.rows[0];
    if (req.user.role !== 'PLATFORM_OWNER' && targetUser.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Forbidden: You cannot modify members of other companies.' });
    }

    const now = new Date().toISOString();
    await query('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

    await logActivity(targetUser.company_id, req.user.id, 'User Status Changed', 'user', id, `Changed status of ${targetUser.name} to ${status}.`);

    res.json({ message: `User status changed to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change user role
router.put('/:id/role', authenticate, requireRole(['COMPANY_ADMIN', 'PLATFORM_OWNER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['COMPANY_ADMIN', 'EMPLOYEE'].includes(role) && req.user.role !== 'PLATFORM_OWNER') {
      return res.status(400).json({ error: 'Role must be COMPANY_ADMIN or EMPLOYEE.' });
    }

    const targetRes = await query('SELECT company_id, name FROM users WHERE id = ?', [id]);
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = targetRes.rows[0];
    if (req.user.role !== 'PLATFORM_OWNER' && targetUser.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const now = new Date().toISOString();
    await query('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, now, id]);

    await logActivity(targetUser.company_id, req.user.id, 'User Role Changed', 'user', id, `Updated role of ${targetUser.name} to ${role}.`);

    res.json({ message: `Role updated to ${role}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
