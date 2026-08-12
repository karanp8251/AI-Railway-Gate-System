const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'worker', 'authority').required(),
  }),
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    displayName: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid('user', 'worker', 'authority').default('user'),
  }),
  gateControl: Joi.object({
    action: Joi.string().valid('open', 'close', 'emergency_stop', 'lockdown').required(),
  }),
  complaint: Joi.object({
    subject: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(10).max(2000).required(),
    crossingId: Joi.string().optional(),
  }),
  sensorUpdate: Joi.object({
    piezo: Joi.number().optional(),
    ir: Joi.boolean().optional(),
    status: Joi.string().valid('online', 'offline', 'maintenance').optional(),
  }),
};

module.exports = { validate, schemas };
