const { errorHandler } = require('../src/middleware/errorHandler');
const { authenticate, authorize } = require('../src/middleware/auth');
const { ROLES } = require('../src/config');
const donorService = require('../src/services/donor.service');
const { resetStore } = require('../src/data/store');
const { HttpError } = require('../src/utils/httpError');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.headersSent = false;
  return res;
}

describe('errorHandler', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('delega si los encabezados ya se enviaron', () => {
    const err = new Error('tarde');
    const req = {};
    const res = mockRes();
    res.headersSent = true;
    const next = jest.fn();

    errorHandler(err, req, res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('oculta el detalle en producción en errores 500', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('stack secreto');
    const res = mockRes();
    const next = jest.fn();

    errorHandler(err, {}, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error interno del servidor',
    });
  });

  test('usa mensaje genérico si el error no tiene message', () => {
    process.env.NODE_ENV = 'test';
    const err = { statusCode: 500 };
    const res = mockRes();

    errorHandler(err, {}, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error interno del servidor',
    });
  });
});

describe('authorize sin usuario autenticado', () => {
  test('responde 401 si req.user no existe', () => {
    const middleware = authorize(ROLES.ADMINISTRADOR);
    const res = mockRes();
    const next = jest.fn();

    middleware({}, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authenticate con errores inesperados', () => {
  test('pasa al siguiente middleware cuando hay usuario válido', () => {
    const req = {
      headers: {},
      user: undefined,
    };
    const res = mockRes();
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('donor.service casos de borde', () => {
  beforeEach(() => {
    resetStore();
  });

  test('getProfile lanza 404 si el usuario no existe', () => {
    expect(() => donorService.getProfile('id-inexistente')).toThrow(HttpError);
    try {
      donorService.getProfile('id-inexistente');
    } catch (error) {
      expect(error.statusCode).toBe(404);
    }
  });
});
