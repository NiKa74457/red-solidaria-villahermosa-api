const request = require('supertest');
const { createApp } = require('../src/app');
const { resetStore } = require('../src/data/store');

const donorPayload = {
  nombre: 'Ana Pérez',
  email: 'ana@solidaria.mx',
  password: 'secreto123',
};

describe('GET /health', () => {
  beforeEach(() => {
    resetStore();
  });

  test('responde 200 con el estado del servicio', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('Red Solidaria Villahermosa API');
    expect(res.body.status).toBe('ok');
  });

  test('responde 404 en rutas desconocidas', async () => {
    const app = createApp();
    const res = await request(app).get('/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Ruta no encontrada/);
  });
});

describe('POST /api/register', () => {
  let app;

  beforeEach(() => {
    resetStore();
    app = createApp();
  });

  test('registra un donante y devuelve token JWT', async () => {
    const res = await request(app).post('/api/register').send(donorPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(donorPayload.email);
    expect(res.body.data.user.rol).toBe('donante');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('rechaza registro con datos faltantes', async () => {
    const res = await request(app).post('/api/register').send({ email: 'incompleto@solidaria.mx' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Faltan campos obligatorios/);
    expect(res.body.message).toMatch(/nombre/);
    expect(res.body.message).toMatch(/password/);
  });

  test('rechaza correo duplicado', async () => {
    await request(app).post('/api/register').send(donorPayload);
    const res = await request(app).post('/api/register').send({
      ...donorPayload,
      nombre: 'Otra Ana',
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('El correo electrónico ya está registrado');
  });

  test('rechaza correo inválido', async () => {
    const res = await request(app).post('/api/register').send({
      ...donorPayload,
      email: 'no-es-correo',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El correo electrónico no es válido');
  });

  test('rechaza contraseña corta', async () => {
    const res = await request(app).post('/api/register').send({
      ...donorPayload,
      password: 'corta',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  test('rechaza rol inválido', async () => {
    const res = await request(app).post('/api/register').send({
      ...donorPayload,
      rol: 'superuser',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Rol inválido/);
  });
});

describe('POST /api/login', () => {
  let app;

  beforeEach(async () => {
    resetStore();
    app = createApp();
    await request(app).post('/api/register').send(donorPayload);
  });

  test('inicia sesión con credenciales válidas', async () => {
    const res = await request(app).post('/api/login').send({
      email: donorPayload.email,
      password: donorPayload.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(donorPayload.email);
  });

  test('rechaza login con datos faltantes', async () => {
    const res = await request(app).post('/api/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Faltan campos obligatorios/);
  });

  test('rechaza correo inexistente', async () => {
    const res = await request(app).post('/api/login').send({
      email: 'nadie@solidaria.mx',
      password: donorPayload.password,
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });

  test('rechaza contraseña incorrecta', async () => {
    const res = await request(app).post('/api/login').send({
      email: donorPayload.email,
      password: 'incorrecta999',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas');
  });
});
