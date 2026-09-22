const { verifyToken } = require('../utils/jwt');
const store = require('../data/store');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación requerido',
    });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación requerido',
    });
  }

  try {
    const payload = verifyToken(token);
    const user = store.getUserById(payload.sub);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inexistente',
      });
    }

    req.user = { id: user.id, rol: user.rol, email: user.email, nombre: user.nombre };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este recurso',
        requiredRoles: allowedRoles,
      });
    }

    return next();
  };
}

module.exports = { authenticate, authorize };
