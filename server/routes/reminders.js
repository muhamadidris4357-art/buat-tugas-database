import express from 'express';
import crypto from 'crypto';
import { query, logActivity } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// List reminders
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { unreadOnly } = req.query;

    let sql = `
      SELECT rem.*, u.name as creator_name
      FROM reminders rem
      LEFT JOIN users u ON rem.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (user.role === 'PLATFORM_OWNER') {
      // Platform owner sees their direct reminders or system-wide
      sql += ` AND (rem.user_id = ? OR rem.user_id IS NULL)`;
      params.push(user.id);
    } else {
      sql += ` AND rem.company_id = ? AND (rem.user_id = ? OR rem.user_id IS NULL)`;
      params.push(user.company_id, user.id);
    }

    if (unreadOnly === 'true') {
      sql += ` AND rem.is_read = 0`;
    }

    sql += ` ORDER BY rem.created_at DESC LIMIT 100`;

    const { rows } = await query(sql, params);

    // Count unread
    let unreadCountSql = `SELECT COUNT(*) as count FROM reminders WHERE is_read = 0`;
    const unreadParams = [];
    if (user.role !== 'PLATFORM_OWNER') {
      unreadCountSql += ` AND company_id = ? AND (user_id = ? OR user_id IS NULL)`;
      unreadParams.push(user.company_id, user.id);
    } else {
      unreadCountSql += ` AND (user_id = ? OR user_id IS NULL)`;
      unreadParams.push(user.id);
    }

    const countRes = await query(unreadCountSql, unreadParams);
    const unreadCount = countRes.rows[0]?.count || 0;

    res.json({ reminders: rows, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create reminder / announcement
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, message, dueDate, priority = 'info', targetUserId } = req.body;
    const user = req.user;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const remId = 'rem_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    // If employee creates reminder, target is only themselves
    const assignedUser = user.role === 'EMPLOYEE' ? user.id : (targetUserId || null);

    await query(
      `INSERT INTO reminders (id, company_id, user_id, created_by, title, message, due_date, priority, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        remId,
        user.company_id || 'system',
        assignedUser,
        user.id,
        title.trim(),
        message.trim(),
        dueDate || null,
        priority,
        now
      ]
    );

    res.status(201).json({ message: 'Reminder created successfully', reminderId: remId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single reminder as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE reminders SET is_read = 1 WHERE id = ?', [id]);
    res.json({ message: 'Reminder marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const user = req.user;
    if (user.role === 'PLATFORM_OWNER') {
      await query('UPDATE reminders SET is_read = 1 WHERE user_id = ?', [user.id]);
    } else {
      await query(
        'UPDATE reminders SET is_read = 1 WHERE company_id = ? AND (user_id = ? OR user_id IS NULL)',
        [user.company_id, user.id]
      );
    }
    res.json({ message: 'All reminders marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete reminder
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM reminders WHERE id = ?', [id]);
    res.json({ message: 'Reminder deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
