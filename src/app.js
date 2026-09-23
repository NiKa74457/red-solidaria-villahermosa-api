const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const rbacRoutes = require('./routes/rbac.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Servir archivos estáticos apuntando a la ruta absoluta de public
  app.use(express.static(path.join(__dirname, '../public')));

  // Servir index.html en la raíz '/'
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

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

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;