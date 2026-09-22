const { ROLES } = require('../config');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = Object.values(ROLES);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function validateRegisterInput(body) {
  const missing = [];
  if (!isNonEmptyString(body?.nombre)) missing.push('nombre');
  if (!isNonEmptyString(body?.email)) missing.push('email');
  if (!isNonEmptyString(body?.password)) missing.push('password');

  if (missing.length > 0) {
    return { ok: false, message: `Faltan campos obligatorios: ${missing.join(', ')}` };
  }

  if (!EMAIL_REGEX.test(body.email.trim())) {
    return { ok: false, message: 'El correo electrónico no es válido' };
  }

  if (body.password.length < 8) {
    return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (body.rol && !VALID_ROLES.includes(body.rol)) {
    return { ok: false, message: `Rol inválido. Valores permitidos: ${VALID_ROLES.join(', ')}` };
  }

  return { ok: true };
}

function validateLoginInput(body) {
  const missing = [];
  if (!isNonEmptyString(body?.email)) missing.push('email');
  if (!isNonEmptyString(body?.password)) missing.push('password');

  if (missing.length > 0) {
    return { ok: false, message: `Faltan campos obligatorios: ${missing.join(', ')}` };
  }

  return { ok: true };
}

module.exports = {
  EMAIL_REGEX,
  VALID_ROLES,
  normalizeEmail,
  validateRegisterInput,
  validateLoginInput,
};
