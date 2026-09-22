const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config');

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.me);

router.get(
  '/donors',
  authenticate,
  authorize(ROLES.ADMINISTRADOR),
  controller.list
);

router.get('/donors/:id', authenticate, controller.getById);

module.exports = router;
