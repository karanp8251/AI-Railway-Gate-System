const ROLES = {
  USER: 'user',
  WORKER: 'worker',
  AUTHORITY: 'authority',
};

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required: ${allowedRoles.join(' or ')}`,
      });
    }
    next();
  };
}

module.exports = { ROLES, requireRole };
