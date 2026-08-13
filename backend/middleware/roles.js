// PoleSafe — Role Guard Middleware
// Restricts endpoints to specific user roles

const { User, School } = require('../database/schema');
const { z } = require('zod');
const { validateTenantScopedQuery } = require('../../lib/engine/hamnah-core.ts');

/**
 * Middleware factory: restrict access to specific roles
 * Usage: router.get('/rides', requireRole('parent', 'driver'), handler)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        yourRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Verify a user belongs to a specific school
 */
async function requireSchoolAccess(req, res, next) {
  try {
    const schoolId = req.params.schoolId || req.body.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID required' });
    }

    if (req.user.role === 'polesafe_admin') {
      return next(); // Admins can access any school
    }

    if (req.user.role === 'school_admin') {
      const schoolSchema = z.object({ schoolId: z.string().min(1) }).strict();
      const schoolScope = validateTenantScopedQuery(schoolSchema, { schoolId }, req.user._id.toString(), ['role:school-access']);
      const school = await School.findById(schoolScope.tenantScopedQuery.schoolId);
      if (!school || !school.adminIds.includes(req.user._id)) {
        return res.status(403).json({ error: 'Not authorized for this school' });
      }
      return next();
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { requireRole, requireSchoolAccess };
