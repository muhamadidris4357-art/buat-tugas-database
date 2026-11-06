import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tasksphere_super_secure_enterprise_secret_2026';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await query('SELECT id, company_id, name, email, role, job_title, avatar_url, language, timezone, date_format, status FROM users WHERE id = ?', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'This user account has been deactivated.' });
    }

    // If user belongs to a company, verify company status isn't suspended
    if (user.company_id && user.role !== 'PLATFORM_OWNER') {
      const compRes = await query('SELECT status FROM companies WHERE id = ?', [user.company_id]);
      if (compRes.rows.length > 0 && compRes.rows[0].status === 'suspended') {
        return res.status(403).json({ error: 'Company workspace is suspended. Please contact platform support.' });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role ${req.user.role} does not have permission for this resource.`
      });
    }
    next();
  };
}
