const donorService = require('../services/donor.service');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');

async function register(req, res, next) {
  try {
    const validation = validateRegisterInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const result = await donorService.registerDonor(req.body);
    return res.status(201).json({
      success: true,
      message: 'Donante registrado correctamente',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const validation = validateLoginInput(req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const result = await donorService.login(req.body);
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

function me(req, res, next) {
  try {
    const profile = donorService.getProfile(req.user.id);
    return res.status(200).json({ success: true, data: profile });
  } catch (error) {
    return next(error);
  }
}

function list(req, res) {
  return res.status(200).json({
    success: true,
    data: donorService.listDonors(),
  });
}

function getById(req, res, next) {
  try {
    const donor = donorService.getDonorById(req.params.id, req.user);
    return res.status(200).json({ success: true, data: donor });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, me, list, getById };
