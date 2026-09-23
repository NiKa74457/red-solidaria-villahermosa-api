const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const rbacRoutes = require('./routes/rbac.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      service: 'Red Solidaria Villahermosa API',
      status: 'ok',
    });
  });

  app.use('/api', authRoutes);
  app.use('/api', rbacRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

// Instancia para Vercel
const app = createApp();

// Exporta la app como exportación principal para Vercel y mantiene createApp para Jest/tests
module.exports = app;
module.exports.createApp = createApp;