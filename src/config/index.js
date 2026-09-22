require('dotenv').config();

const ROLES = Object.freeze({
  ADMINISTRADOR: 'administrador',
  DONANTE: 'donante',
  EMPRESA: 'empresa',
  ORGANIZACION: 'organizacion',
});

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'red-solidaria-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  },
  roles: ROLES,
};

module.exports = { config, ROLES };
