import express from 'express';
import { query } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 'PLATFORM_OWNER') {
      // Platform Owner Dashboard Stats
      const [compRes, userRes, taskRes, repRes, recentComps, recentActs] = await Promise.all([
        query(`SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                 SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
               FROM companies`),
        query(`SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN role = 'COMPANY_ADMIN' THEN 1 ELSE 0 END) as admins,
                 SUM(CASE WHEN role = 'EMPLOYEE' THEN 1 ELSE 0 END) as employees
               FROM users WHERE role != 'PLATFORM_OWNER'`),
        query(`SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                 SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
               FROM tasks`),
        query(`SELECT COUNT(*) as total FROM reports`),
        query(`SELECT c.*,
                      (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as user_count,
                      (SELECT COUNT(*) FROM tasks t WHERE t.company_id = c.id) as task_count
               FROM companies c ORDER BY c.created_at DESC LIMIT 5`),
        query(`SELECT act.*, u.name as user_name, c.name as company_name 
               FROM activity_logs act
               LEFT JOIN users u ON act.user_id = u.id
               LEFT JOIN companies c ON act.company_id = c.id
               ORDER BY act.created_at DESC LIMIT 8`)
      ]);

      return res.json({
        role: 'PLATFORM_OWNER',
        companies: {
          total: compRes.rows[0]?.total || 0,
          active: compRes.rows[0]?.active || 0,
          suspended: compRes.rows[0]?.suspended || 0,
        },
        users: {
          total: userRes.rows[0]?.total || 0,
          admins: userRes.rows[0]?.admins || 0,
          employees: userRes.rows[0]?.employees || 0,
        },
        tasks: {
          total: taskRes.rows[0]?.total || 0,
          completed: taskRes.rows[0]?.completed || 0,
          in_progress: taskRes.rows[0]?.in_progress || 0,
        },
        reports: {
          total: repRes.rows[0]?.total || 0
        },
        recentCompanies: recentComps.rows,
        recentActivities: recentActs.rows
      });
    }

    if (user.role === 'COMPANY_ADMIN') {
      const companyId = user.company_id;
      const [taskRes, userRes, repRes, remRes, priorityRes, teamOverview, recentActs] = await Promise.all([
        query(`SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                 SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                 SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
               FROM tasks WHERE company_id = ?`, [companyId]),
        query(`SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
               FROM users WHERE company_id = ? AND role = 'EMPLOYEE'`, [companyId]),
        query(`SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending_review,
                 SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
               FROM reports WHERE company_id = ?`, [companyId]),
        query(`SELECT COUNT(*) as unread FROM reminders 
               WHERE company_id = ? AND (user_id = ? OR user_id IS NULL) AND is_read = 0`, [companyId, user.id]),
        query(`SELECT priority, COUNT(*) as count FROM tasks WHERE company_id = ? GROUP BY priority`, [companyId]),
        query(`SELECT u.id, u.name, u.email, u.avatar_url, u.job_title,
                      (SELECT COUNT(*) FROM task_assignments ta WHERE ta.user_id = u.id) as assigned_count,
                      (SELECT COUNT(*) FROM task_assignments ta WHERE ta.user_id = u.id AND ta.status = 'completed') as completed_count
               FROM users u
               WHERE u.company_id = ? AND u.role = 'EMPLOYEE' AND u.status = 'active'
               LIMIT 6`, [companyId]),
        query(`SELECT act.*, u.name as user_name
               FROM activity_logs act
               LEFT JOIN users u ON act.user_id = u.id
               WHERE act.company_id = ?
               ORDER BY act.created_at DESC LIMIT 8`, [companyId])
      ]);

      const totalTasks = taskRes.rows[0]?.total || 0;
      const completedTasks = taskRes.rows[0]?.completed || 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return res.json({
        role: 'COMPANY_ADMIN',
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          in_progress: taskRes.rows[0]?.in_progress || 0,
          pending: taskRes.rows[0]?.pending || 0,
          blocked: taskRes.rows[0]?.blocked || 0,
          completionRate
        },
        team: {
          total: userRes.rows[0]?.total || 0,
          active: userRes.rows[0]?.active || 0,
        },
        reports: {
          total: repRes.rows[0]?.total || 0,
          pending_review: repRes.rows[0]?.pending_review || 0,
          approved: repRes.rows[0]?.approved || 0
        },
        unreadReminders: remRes.rows[0]?.unread || 0,
        priorityBreakdown: priorityRes.rows,
        teamOverview: teamOverview.rows,
        recentActivities: recentActs.rows
      });
    }

    if (user.role === 'EMPLOYEE') {
      // Employee Dashboard Stats
      const [assignRes, repRes, remRes, upcomingTasks, recentActs] = await Promise.all([
        query(`SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                 SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                 SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                 SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
               FROM task_assignments WHERE user_id = ?`, [user.id]),
        query(`SELECT 
                 COUNT(*) as total,
                 SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                 SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted
               FROM reports WHERE user_id = ?`, [user.id]),
        query(`SELECT COUNT(*) as unread FROM reminders 
               WHERE (user_id = ? OR (company_id = ? AND user_id IS NULL)) AND is_read = 0`, [user.id, user.company_id]),
        query(`SELECT t.*, ta.status as my_status, ta.progress_percent
               FROM tasks t
               JOIN task_assignments ta ON t.id = ta.task_id
               WHERE ta.user_id = ? AND ta.status != 'completed'
               ORDER BY t.due_date ASC NULLS LAST LIMIT 5`, [user.id]),
        query(`SELECT act.*, u.name as user_name
               FROM activity_logs act
               LEFT JOIN users u ON act.user_id = u.id
               WHERE act.company_id = ?
               ORDER BY act.created_at DESC LIMIT 6`, [user.company_id])
      ]);

      const myTotal = assignRes.rows[0]?.total || 0;
      const myCompleted = assignRes.rows[0]?.completed || 0;
      const completionRate = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0;

      return res.json({
        role: 'EMPLOYEE',
        assignments: {
          total: myTotal,
          completed: myCompleted,
          in_progress: assignRes.rows[0]?.in_progress || 0,
          pending: assignRes.rows[0]?.pending || 0,
          blocked: assignRes.rows[0]?.blocked || 0,
          completionRate
        },
        reports: {
          total: repRes.rows[0]?.total || 0,
          approved: repRes.rows[0]?.approved || 0,
          submitted: repRes.rows[0]?.submitted || 0
        },
        unreadReminders: remRes.rows[0]?.unread || 0,
        upcomingTasks: upcomingTasks.rows,
        recentActivities: recentActs.rows
      });
    }

    res.status(400).json({ error: 'Unknown role' });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
