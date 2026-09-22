const crypto = require('crypto');
const { ROLES } = require('../config');
const store = require('../data/store');
const { HttpError } = require('../utils/httpError');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { normalizeEmail } = require('../utils/validators');

function toPublicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    createdAt: user.createdAt,
  };
}

async function registerDonor({ nombre, email, password, rol }) {
  const normalizedEmail = normalizeEmail(email);
  if (store.getUserByEmail(normalizedEmail)) {
    throw new HttpError(409, 'El correo electrónico ya está registrado');
  }

  const user = store.saveUser({
    id: crypto.randomUUID(),
    nombre: nombre.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    rol: rol || ROLES.DONANTE,
    createdAt: new Date().toISOString(),
  });

  const token = signToken({ sub: user.id, rol: user.rol, email: user.email });
  return { user: toPublicUser(user), token };
}

async function login({ email, password }) {
  const user = store.getUserByEmail(normalizeEmail(email));
  if (!user) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const matches = await comparePassword(password, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const token = signToken({ sub: user.id, rol: user.rol, email: user.email });
  return { user: toPublicUser(user), token };
}

function getProfile(userId) {
  const user = store.getUserById(userId);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return toPublicUser(user);
}

function listDonors() {
  return store.listUsers().map(toPublicUser);
}

function getDonorById(id, requester) {
  const user = store.getUserById(id);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  const isOwner = requester.id === id;
  const isAdmin = requester.rol === ROLES.ADMINISTRADOR;
  if (!isOwner && !isAdmin) {
    throw new HttpError(403, 'No tienes permiso para consultar este donante');
  }

  return toPublicUser(user);
}

module.exports = {
  toPublicUser,
  registerDonor,
  login,
  getProfile,
  listDonors,
  getDonorById,
};
