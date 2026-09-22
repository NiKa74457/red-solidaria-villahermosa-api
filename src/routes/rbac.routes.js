const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config');

const router = Router();

router.get(
  '/admin/dashboard',
  authenticate,
  authorize(ROLES.ADMINISTRADOR),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Panel de administrador',
      data: {
        usuario: req.user.nombre,
        resumen: 'Gestión de donantes, empresas y organizaciones.',
      },
    });
  }
);

router.get(
  '/empresa/recursos',
  authenticate,
  authorize(ROLES.EMPRESA, ROLES.ADMINISTRADOR),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Recursos empresariales',
      data: { donacionesEnEspecie: true },
    });
  }
);

router.get(
  '/organizacion/campanas',
  authenticate,
  authorize(ROLES.ORGANIZACION, ROLES.ADMINISTRADOR),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Campañas de la organización',
      data: { activas: [] },
    });
  }
);

router.get(
  '/donante/historial',
  authenticate,
  authorize(ROLES.DONANTE, ROLES.ADMINISTRADOR),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Historial de donaciones',
      data: { donaciones: [] },
    });
  }
);

module.exports = router;
