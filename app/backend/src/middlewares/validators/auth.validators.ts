import Joi from 'joi';

const email = Joi.string().email({minDomainSegments: 2}).max(255).lowercase().trim().required();

// 12 characters with mixed classes, per NIST SP 800-63B. The old 4-character
// floor made the login form brute-forceable no matter how strong the hashing was.
const password = Joi.string()
  .min(12)
  .max(128)
  .pattern(/[a-z]/, 'lowercase letter')
  .pattern(/[A-Z]/, 'uppercase letter')
  .pattern(/\d/, 'digit')
  .required()
  .messages({
    'string.pattern.name': 'Password must contain at least one {#name}',
    'string.min': 'Password must be at least 12 characters',
  });

export const registerValidator = Joi.object({
  email,
  password,
  // Optional, and forgiving: an invite typed in lower case, or with stray spaces,
  // is still an invite.
  inviteCode: Joi.string().trim().uppercase().max(16).allow('').optional(),
});

// Login must not enforce the policy — it only checks what the user already has,
// and rejecting a legacy password with a validation error would leak that it exists.
export const loginValidator = Joi.object({
  email,
  password: Joi.string().max(128).required(),
});

export const forgotPasswordValidator = Joi.object({email});

export const resetPasswordValidator = Joi.object({
  token: Joi.string().max(128).required(),
  password,
});

export const siweValidator = Joi.object({
  message: Joi.string().max(2000).required(),
  signature: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{130}$/)
    .required()
    .messages({'string.pattern.base': 'Malformed signature'}),
});
