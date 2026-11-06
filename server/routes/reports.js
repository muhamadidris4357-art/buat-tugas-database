import express from 'express';
import crypto from 'crypto';
import { query, logActivity } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List reports
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, taskId, employeeId, search, company_id } = req.query;
    const user = req.user;

    let sql = `
      SELECT r.*,
             u.name as employee_name,
             u.email as employee_email,
             u.job_title as employee_job_title,
             u.avatar_url as employee_avatar,
             t.title as task_title,
             c.name as company_name
      FROM reports r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN tasks t ON r.task_id = t.id
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (user.role === 'PLATFORM_OWNER') {
      if (company_id) {
        sql += ` AND r.company_id = ?`;
        params.push(company_id);
      }
    } else {
      sql += ` AND r.company_id = ?`;
      params.push(user.company_id);

      if (user.role === 'EMPLOYEE') {
        sql += ` AND r.user_id = ?`;
        params.push(user.id);
      }
    }

    if (status && status !== 'all') {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    if (taskId) {
      sql += ` AND r.task_id = ?`;
      params.push(taskId);
    }

    if (employeeId && user.role !== 'EMPLOYEE') {
      sql += ` AND r.user_id = ?`;
      params.push(employeeId);
    }

    if (search) {
      sql += ` AND (LOWER(r.title) LIKE ? OR LOWER(r.summary) LIKE ? OR LOWER(r.work_done) LIKE ?)`;
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY r.created_at DESC`;

    const { rows } = await query(sql, params);
    res.json({ reports: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit report
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, summary, workDone, blockers, hoursSpent = 0, taskId } = req.body;
    const user = req.user;

    if (!title || !summary) {
      return res.status(400).json({ error: 'Report title and summary are required.' });
    }

    if (!user.company_id) {
      return res.status(400).json({ error: 'You must belong to a company to submit a work report.' });
    }

    const reportId = 'rep_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    await query(
      `INSERT INTO reports (id, company_id, user_id, task_id, title, summary, work_done, blockers, hours_spent, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)`,
      [
        reportId,
        user.company_id,
        user.id,
        taskId || null,
        title.trim(),
        summary.trim(),
        workDone || '',
        blockers || '',
        parseFloat(hoursSpent) || 0,
        now,
        now
      ]
    );

    // Notify company admins
    const { rows: admins } = await query(
      `SELECT id FROM users WHERE company_id = ? AND role = 'COMPANY_ADMIN' AND status = 'active'`,
      [user.company_id]
    );

    for (const admin of admins) {
      const remId = 'rem_' + crypto.randomBytes(6).toString('hex');
      await query(
        `INSERT INTO reminders (id, company_id, user_id, created_by, title, message, priority, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'info', 0, ?)`,
        [
          remId,
          user.company_id,
          admin.id,
          user.id,
          `Work Report: ${user.name}`,
          `${user.name} submitted a work report: "${title.trim()}".`,
          now
        ]
      );
    }

    await logActivity(
      user.company_id,
      user.id,
      'Submitted Report',
      'report',
      reportId,
      `${user.name} submitted report "${title.trim()}".`
    );

    res.status(201).json({
      message: 'Work report submitted successfully.',
      reportId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Review / Feedback on report (Admin only)
router.put('/:id/review', authenticate, requireRole(['COMPANY_ADMIN', 'PLATFORM_OWNER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminFeedback } = req.body;

    if (!['approved', 'revision_requested', 'reviewed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved, revision_requested, or reviewed.' });
    }

    const { rows: reports } = await query('SELECT * FROM reports WHERE id = ?', [id]);
    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const report = reports[0];
    if (req.user.role !== 'PLATFORM_OWNER' && report.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const now = new Date().toISOString();
    await query(
      `UPDATE reports
       SET status = ?,
           admin_feedback = ?,
           updated_at = ?
       WHERE id = ?`,
      [status, adminFeedback || null, now, id]
    );

    // Notify employee of review
    const remId = 'rem_' + crypto.randomBytes(6).toString('hex');
    const priority = status === 'revision_requested' ? 'warning' : 'info';
    await query(
      `INSERT INTO reminders (id, company_id, user_id, created_by, title, message, priority, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        remId,
        report.company_id,
        report.user_id,
        req.user.id,
        `Report ${status === 'approved' ? 'Approved' : 'Reviewed'}`,
        `Your report "${report.title}" was updated to status: ${status}. Admin feedback: ${adminFeedback || 'No additional comments.'}`,
        priority,
        now
      ]
    );

    await logActivity(
      report.company_id,
      req.user.id,
      'Reviewed Report',
      'report',
      id,
      `Report "${report.title}" status set to ${status}.`
    );

    res.json({ message: `Report status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete report
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: reports } = await query('SELECT * FROM reports WHERE id = ?', [id]);
    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const report = reports[0];
    const canDelete = req.user.role === 'PLATFORM_OWNER' ||
                      (req.user.role === 'COMPANY_ADMIN' && report.company_id === req.user.company_id) ||
                      (report.user_id === req.user.id);

    if (!canDelete) {
      return res.status(403).json({ error: 'You do not have permission to delete this report.' });
    }

    await query('DELETE FROM reports WHERE id = ?', [id]);
    await logActivity(report.company_id, req.user.id, 'Deleted Report', 'report', id, `Deleted report "${report.title}".`);

    res.json({ message: 'Report deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
