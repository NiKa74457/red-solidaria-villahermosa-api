const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { resetStore, getUserByEmail } = require('../src/data/store');
const { config } = require('../src/config');

async function registerAs(app, payload) {
  const res = await request(app).post('/api/register').send(payload);
  return res.body.data;
}

describe('Autenticación JWT y RBAC', () => {
  let app;

  beforeEach(() => {
    resetStore();
    app = createApp();
  });

  test('GET /api/me requiere token', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token de autenticación requerido');
  });

  test('GET /api/me rechaza encabezado Bearer vacío', async () => {
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  test('GET /api/me rechaza token inválido', async () => {
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer token-falso');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token inválido o expirado');
  });

  test('GET /api/me rechaza token de usuario inexistente', async () => {
    const token = jwt.sign(
      { sub: '00000000-0000-4000-8000-000000000000', rol: 'donante' },
      config.jwt.secret
    );
    const res = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token inválido o usuario inexistente');
  });

  test('GET /api/me devuelve el perfil autenticado', async () => {
    const { token, user } = await registerAs(app, {
      nombre: 'Luis',
      email: 'luis@solidaria.mx',
      password: 'secreto123',
    });

    const res = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(user.id);
    expect(res.body.data.email).toBe('luis@solidaria.mx');
  });

  test('solo el administrador lista donantes', async () => {
    const donor = await registerAs(app, {
      nombre: 'Donante',
      email: 'donante@solidaria.mx',
      password: 'secreto123',
    });
    const admin = await registerAs(app, {
      nombre: 'Admin',
      email: 'admin@solidaria.mx',
      password: 'secreto123',
      rol: 'administrador',
    });

    const forbidden = await request(app)
      .get('/api/donors')
      .set('Authorization', `Bearer ${donor.token}`);
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.requiredRoles).toContain('administrador');

    const allowed = await request(app)
      .get('/api/donors')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.length).toBeGreaterThanOrEqual(2);
  });

  test('un donante solo puede consultar su propio perfil por id', async () => {
    const first = await registerAs(app, {
      nombre: 'Uno',
      email: 'uno@solidaria.mx',
      password: 'secreto123',
    });
    const second = await registerAs(app, {
      nombre: 'Dos',
      email: 'dos@solidaria.mx',
      password: 'secreto123',
    });

    const own = await request(app)
      .get(`/api/donors/${first.user.id}`)
      .set('Authorization', `Bearer ${first.token}`);
    expect(own.status).toBe(200);
    expect(own.body.data.email).toBe('uno@solidaria.mx');

    const other = await request(app)
      .get(`/api/donors/${second.user.id}`)
      .set('Authorization', `Bearer ${first.token}`);
    expect(other.status).toBe(403);
  });

  test('el administrador puede consultar cualquier donante', async () => {
    const donor = await registerAs(app, {
      nombre: 'Donante',
      email: 'd@solidaria.mx',
      password: 'secreto123',
    });
    const admin = await registerAs(app, {
      nombre: 'Admin',
      email: 'a@solidaria.mx',
      password: 'secreto123',
      rol: 'administrador',
    });

    const res = await request(app)
      .get(`/api/donors/${donor.user.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(donor.user.id);
  });

  test('consulta de donante inexistente responde 404', async () => {
    const admin = await registerAs(app, {
      nombre: 'Admin',
      email: 'admin404@solidaria.mx',
      password: 'secreto123',
      rol: 'administrador',
    });

    const res = await request(app)
      .get('/api/donors/00000000-0000-4000-8000-000000000099')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(404);
  });

  test('cada rol accede solo a sus recursos', async () => {
    const empresa = await registerAs(app, {
      nombre: 'Empresa SA',
      email: 'empresa@solidaria.mx',
      password: 'secreto123',
      rol: 'empresa',
    });
    const org = await registerAs(app, {
      nombre: 'ONG',
      email: 'ong@solidaria.mx',
      password: 'secreto123',
      rol: 'organizacion',
    });
    const donante = await registerAs(app, {
      nombre: 'Donante',
      email: 'hist@solidaria.mx',
      password: 'secreto123',
    });
    const admin = await registerAs(app, {
      nombre: 'Admin',
      email: 'adm@solidaria.mx',
      password: 'secreto123',
      rol: 'administrador',
    });

    expect(
      (await request(app).get('/api/empresa/recursos').set('Authorization', `Bearer ${empresa.token}`))
        .status
    ).toBe(200);
    expect(
      (await request(app).get('/api/organizacion/campanas').set('Authorization', `Bearer ${org.token}`))
        .status
    ).toBe(200);
    expect(
      (await request(app).get('/api/donante/historial').set('Authorization', `Bearer ${donante.token}`))
        .status
    ).toBe(200);
    expect(
      (await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${admin.token}`))
        .status
    ).toBe(200);

    expect(
      (await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${donante.token}`))
        .status
    ).toBe(403);
    expect(
      (await request(app).get('/api/empresa/recursos').set('Authorization', `Bearer ${org.token}`))
        .status
    ).toBe(403);
  });

  test('getUserByEmail encuentra al usuario recién registrado', async () => {
    await registerAs(app, {
      nombre: 'Busqueda',
      email: 'Busqueda@Solidaria.MX',
      password: 'secreto123',
    });
    const found = getUserByEmail('busqueda@solidaria.mx');
    expect(found).not.toBeNull();
    expect(found.nombre).toBe('Busqueda');
  });
});
