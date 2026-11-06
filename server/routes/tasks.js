import express from 'express';
import crypto from 'crypto';
import { query, logActivity } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, search, category, scope, company_id } = req.query;
    const user = req.user;

    let targetCompanyId = user.company_id;
    if (user.role === 'PLATFORM_OWNER') {
      targetCompanyId = company_id || null;
    }

    let sql = `
      SELECT t.*,
             u.name as creator_name,
             u.email as creator_email,
             c.name as company_name
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN companies c ON t.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (targetCompanyId) {
      sql += ` AND t.company_id = ?`;
      params.push(targetCompanyId);
    }

    if (user.role === 'EMPLOYEE') {
      // Employees only see tasks where they are assigned
      sql += ` AND t.id IN (SELECT task_id FROM task_assignments WHERE user_id = ?)`;
      params.push(user.id);
    }

    if (status && status !== 'all') {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    if (priority && priority !== 'all') {
      sql += ` AND t.priority = ?`;
      params.push(priority);
    }

    if (category && category !== 'all') {
      sql += ` AND t.category = ?`;
      params.push(category);
    }

    if (search) {
      sql += ` AND (LOWER(t.title) LIKE ? OR LOWER(t.description) LIKE ?)`;
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term);
    }

    sql += ` ORDER BY t.created_at DESC`;

    const { rows: tasks } = await query(sql, params);

    // Fetch assignments for all returned tasks
    if (tasks.length > 0) {
      const taskIds = tasks.map(t => `'${t.id}'`).join(',');
      const { rows: assignments } = await query(
        `SELECT ta.*, u.name as user_name, u.email as user_email, u.avatar_url, u.job_title
         FROM task_assignments ta
         JOIN users u ON ta.user_id = u.id
         WHERE ta.task_id IN (${taskIds})`
      );

      // Group assignments by task_id
      const assignmentsByTask = {};
      assignments.forEach(a => {
        if (!assignmentsByTask[a.task_id]) assignmentsByTask[a.task_id] = [];
        assignmentsByTask[a.task_id].push(a);
      });

      tasks.forEach(t => {
        t.assignments = assignmentsByTask[t.id] || [];
        if (user.role === 'EMPLOYEE') {
          t.my_assignment = t.assignments.find(a => a.user_id === user.id) || null;
        }
      });
    }

    res.json({ tasks });
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single task by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: tasks } = await query(
      `SELECT t.*, u.name as creator_name, c.name as company_name
       FROM tasks t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN companies c ON t.company_id = c.id
       WHERE t.id = ?`,
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = tasks[0];

    // Check company isolation
    if (req.user.role !== 'PLATFORM_OWNER' && task.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    // Fetch assignments
    const { rows: assignments } = await query(
      `SELECT ta.*, u.name as user_name, u.email as user_email, u.avatar_url, u.job_title
       FROM task_assignments ta
       JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = ?`,
      [task.id]
    );

    task.assignments = assignments;
    if (req.user.role === 'EMPLOYEE') {
      task.my_assignment = assignments.find(a => a.user_id === req.user.id) || null;
      if (!task.my_assignment) {
        return res.status(403).json({ error: 'You are not assigned to this task.' });
      }
    }

    // Fetch task-related reports
    const { rows: reports } = await query(
      `SELECT r.*, u.name as user_name FROM reports r
       JOIN users u ON r.user_id = u.id
       WHERE r.task_id = ? ORDER BY r.created_at DESC`,
      [task.id]
    );
    task.reports = reports;

    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task (Admin only)
router.post('/', authenticate, requireRole(['COMPANY_ADMIN', 'PLATFORM_OWNER']), async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      dueDate,
      targetScope = 'single', // 'single' | 'multiple' | 'all'
      assignedUserIds = [],
      category = 'General',
      estimatedHours = 0,
      targetCompanyId
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const companyId = req.user.role === 'PLATFORM_OWNER' ? (targetCompanyId || req.user.company_id) : req.user.company_id;
    if (!companyId) {
      return res.status(400).json({ error: 'Company association is required.' });
    }

    const taskId = 'tsk_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    await query(
      `INSERT INTO tasks (id, company_id, created_by, title, description, priority, status, due_date, target_scope, category, estimated_hours, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        companyId,
        req.user.id,
        title.trim(),
        description || '',
        priority,
        dueDate || null,
        targetScope,
        category,
        parseFloat(estimatedHours) || 0,
        now,
        now
      ]
    );

    // Determine target users
    let finalUserIds = [];
    if (targetScope === 'all') {
      const { rows: employees } = await query(
        `SELECT id FROM users WHERE company_id = ? AND role = 'EMPLOYEE' AND status = 'active'`,
        [companyId]
      );
      finalUserIds = employees.map(e => e.id);
    } else if (Array.isArray(assignedUserIds) && assignedUserIds.length > 0) {
      finalUserIds = assignedUserIds;
    }

    // Insert task assignments for each user
    for (const uId of finalUserIds) {
      const assignId = 'asn_' + crypto.randomBytes(6).toString('hex');
      await query(
        `INSERT INTO task_assignments (id, task_id, user_id, company_id, status, progress_percent, notes, completed_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', 0, '', null, ?)`,
        [assignId, taskId, uId, companyId, now]
      );

      // Create reminder / notification for employee
      const remId = 'rem_' + crypto.randomBytes(6).toString('hex');
      await query(
        `INSERT INTO reminders (id, company_id, user_id, created_by, title, message, due_date, priority, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          remId,
          companyId,
          uId,
          req.user.id,
          `New Task: ${title.trim()}`,
          `You have been assigned to task "${title.trim()}". Priority: ${priority.toUpperCase()}. Due: ${dueDate || 'No deadline'}.`,
          dueDate || null,
          priority === 'urgent' ? 'urgent' : priority === 'high' ? 'warning' : 'info',
          now
        ]
      );
    }

    await logActivity(
      companyId,
      req.user.id,
      'Created Task',
      'task',
      taskId,
      `Created task "${title.trim()}" assigned to ${finalUserIds.length} employee(s).`
    );

    res.status(201).json({
      message: 'Task created and assigned successfully.',
      taskId
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update task information (Admin only)
router.put('/:id', authenticate, requireRole(['COMPANY_ADMIN', 'PLATFORM_OWNER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate, category, estimatedHours, assignedUserIds } = req.body;

    const { rows: tasks } = await query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = tasks[0];
    if (req.user.role !== 'PLATFORM_OWNER' && task.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const now = new Date().toISOString();

    await query(
      `UPDATE tasks
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           priority = COALESCE(?, priority),
           status = COALESCE(?, status),
           due_date = COALESCE(?, due_date),
           category = COALESCE(?, category),
           estimated_hours = COALESCE(?, estimated_hours),
           updated_at = ?
       WHERE id = ?`,
      [title, description, priority, status, dueDate, category, estimatedHours, now, id]
    );

    // If assignedUserIds is provided, sync assignments
    if (Array.isArray(assignedUserIds)) {
      // Existing assignments
      const { rows: currentAssignees } = await query('SELECT user_id FROM task_assignments WHERE task_id = ?', [id]);
      const currentIds = currentAssignees.map(a => a.user_id);

      // Add new ones
      for (const uid of assignedUserIds) {
        if (!currentIds.includes(uid)) {
          const assignId = 'asn_' + crypto.randomBytes(6).toString('hex');
          await query(
            `INSERT INTO task_assignments (id, task_id, user_id, company_id, status, progress_percent, notes, completed_at, updated_at)
             VALUES (?, ?, ?, ?, 'pending', 0, '', null, ?)`,
            [assignId, id, uid, task.company_id, now]
          );
        }
      }
    }

    await logActivity(task.company_id, req.user.id, 'Updated Task', 'task', id, `Updated task "${task.title}".`);

    res.json({ message: 'Task updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update employee assignment status & progress (Employees update their own, Admins can update any)
router.put('/:id/assignment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progressPercent, notes, targetUserId } = req.body;
    const user = req.user;

    const userIdToUpdate = (user.role === 'COMPANY_ADMIN' || user.role === 'PLATFORM_OWNER') && targetUserId ? targetUserId : user.id;

    const { rows: assignments } = await query(
      'SELECT * FROM task_assignments WHERE task_id = ? AND user_id = ?',
      [id, userIdToUpdate]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment record not found for this user.' });
    }

    const currentAssignment = assignments[0];
    const now = new Date().toISOString();
    const isCompleted = status === 'completed' || parseInt(progressPercent) === 100;
    const completedAt = isCompleted ? (currentAssignment.completed_at || now) : null;

    await query(
      `UPDATE task_assignments
       SET status = COALESCE(?, status),
           progress_percent = COALESCE(?, progress_percent),
           notes = COALESCE(?, notes),
           completed_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        status,
        progressPercent !== undefined ? Math.min(100, Math.max(0, parseInt(progressPercent))) : undefined,
        notes,
        completedAt,
        now,
        currentAssignment.id
      ]
    );

    // Compute overall task status based on all assignments
    const { rows: allAssignments } = await query(
      'SELECT status, progress_percent FROM task_assignments WHERE task_id = ?',
      [id]
    );

    let overallStatus = 'in_progress';
    const allDone = allAssignments.every(a => a.status === 'completed' || a.progress_percent === 100);
    const anyInProgress = allAssignments.some(a => a.status === 'in_progress' || a.status === 'in_review');
    const allPending = allAssignments.every(a => a.status === 'pending');

    if (allDone && allAssignments.length > 0) {
      overallStatus = 'completed';
    } else if (allPending) {
      overallStatus = 'pending';
    } else if (anyInProgress) {
      overallStatus = 'in_progress';
    }

    await query('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [overallStatus, now, id]);

    await logActivity(
      currentAssignment.company_id,
      user.id,
      'Updated Task Progress',
      'task',
      id,
      `${user.name} updated assignment to status "${status || currentAssignment.status}" (${progressPercent || currentAssignment.progress_percent}%).`
    );

    res.json({
      message: 'Task assignment progress updated successfully.',
      overallStatus
    });
  } catch (err) {
    console.error('Update assignment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete task (Admin only)
router.delete('/:id', authenticate, requireRole(['COMPANY_ADMIN', 'PLATFORM_OWNER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: tasks } = await query('SELECT * FROM tasks WHERE id = ?', [id]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = tasks[0];
    if (req.user.role !== 'PLATFORM_OWNER' && task.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    await query('DELETE FROM task_assignments WHERE task_id = ?', [id]);
    await query('DELETE FROM reports WHERE task_id = ?', [id]);
    await query('DELETE FROM tasks WHERE id = ?', [id]);

    await logActivity(task.company_id, req.user.id, 'Deleted Task', 'task', id, `Deleted task "${task.title}".`);

    res.json({ message: 'Task and related records deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
