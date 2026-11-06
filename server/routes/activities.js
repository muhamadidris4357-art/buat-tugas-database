import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { entityType, search, limit = 50 } = req.query;
    const user = req.user;

    let sql = `
      SELECT act.*, u.name as user_name, u.email as user_email, u.role as user_role, u.avatar_url,
             c.name as company_name
      FROM activity_logs act
      LEFT JOIN users u ON act.user_id = u.id
      LEFT JOIN companies c ON act.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (user.role !== 'PLATFORM_OWNER') {
      sql += ` AND act.company_id = ?`;
      params.push(user.company_id);
    }

    if (entityType && entityType !== 'all') {
      sql += ` AND act.entity_type = ?`;
      params.push(entityType);
    }

    if (search) {
      sql += ` AND (LOWER(act.action) LIKE ? OR LOWER(act.details) LIKE ? OR LOWER(u.name) LIKE ?)`;
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY act.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));

    const { rows } = await query(sql, params);
    res.json({ activities: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
