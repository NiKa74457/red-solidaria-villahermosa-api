const { createApp } = require('./app');
const { config } = require('./config');

const app = createApp();

app.listen(config.port, () => {
  console.log(`Red Solidaria Villahermosa API escuchando en el puerto ${config.port}`);
});
