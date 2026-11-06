import express from 'express';
import crypto from 'crypto';
import { query, logActivity } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all companies (Platform Owner only)
router.get('/', authenticate, requireRole(['PLATFORM_OWNER']), async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as user_count,
             (SELECT COUNT(*) FROM tasks t WHERE t.company_id = c.id) as task_count,
             (SELECT COUNT(*) FROM reports r WHERE r.company_id = c.id) as report_count
      FROM companies c
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (LOWER(c.name) LIKE ? OR LOWER(c.code) LIKE ? OR LOWER(c.industry) LIKE ?)`;
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    if (status && status !== 'all') {
      sql += ` AND c.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const { rows } = await query(sql, params);
    res.json({ companies: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user's company profile
router.get('/my', authenticate, async (req, res) => {
  try {
    if (!req.user.company_id) {
      return res.status(404).json({ error: 'You are not linked to any company.' });
    }

    const { rows } = await query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.status = 'active') as active_members,
              (SELECT COUNT(*) FROM tasks t WHERE t.company_id = c.id) as total_tasks,
              (SELECT COUNT(*) FROM tasks t WHERE t.company_id = c.id AND t.status = 'completed') as completed_tasks
       FROM companies c
       WHERE c.id = ?`,
      [req.user.company_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    res.json({ company: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update current company profile (Company Admin only)
router.put('/my', authenticate, requireRole(['COMPANY_ADMIN', 'PLATFORM_OWNER']), async (req, res) => {
  try {
    const { name, description, industry, country, timezone, logo_url } = req.body;
    const companyId = req.user.company_id;

    if (!companyId) {
      return res.status(400).json({ error: 'No company associated with this account.' });
    }

    const now = new Date().toISOString();
    await query(
      `UPDATE companies
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           industry = COALESCE(?, industry),
           country = COALESCE(?, country),
           timezone = COALESCE(?, timezone),
           logo_url = COALESCE(?, logo_url),
           updated_at = ?
       WHERE id = ?`,
      [name, description, industry, country, timezone, logo_url, now, companyId]
    );

    const { rows } = await query('SELECT * FROM companies WHERE id = ?', [companyId]);
    await logActivity(companyId, req.user.id, 'Company Updated', 'company', companyId, `Updated company profile details.`);

    res.json({ message: 'Company settings updated successfully', company: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update or customize company code (Company Admin only)
router.put('/my/code', authenticate, requireRole(['COMPANY_ADMIN']), async (req, res) => {
  try {
    const { newCode } = req.body;
    if (!newCode || newCode.trim().length < 3) {
      return res.status(400).json({ error: 'Company code must be at least 3 characters long.' });
    }

    const cleanCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const companyId = req.user.company_id;

    // Check if code is already taken by another company
    const check = await query('SELECT id FROM companies WHERE UPPER(code) = ? AND id != ?', [cleanCode, companyId]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'This company code is already in use by another organization. Please choose a different code.' });
    }

    const now = new Date().toISOString();
    await query('UPDATE companies SET code = ?, updated_at = ? WHERE id = ?', [cleanCode, now, companyId]);

    await logActivity(companyId, req.user.id, 'Code Changed', 'company', companyId, `Company invitation code updated to ${cleanCode}.`);

    res.json({ message: 'Company invitation code updated successfully', code: cleanCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Company Status (Platform Owner only)
router.put('/:id/status', authenticate, requireRole(['PLATFORM_OWNER']), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['active', 'suspended', 'trial'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value. Must be active, suspended, or trial.' });
    }

    const now = new Date().toISOString();
    await query('UPDATE companies SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

    await logActivity(id, req.user.id, 'Status Changed', 'company', id, `Company status updated to ${status} by Platform Owner.`);

    res.json({ message: `Company status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
