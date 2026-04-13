export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_USER_NOT_FOUND: 'AUTH_002',
  AUTH_EMAIL_ALREADY_EXISTS: 'AUTH_003',
  AUTH_INVALID_TOKEN: 'AUTH_004',
  AUTH_TOKEN_EXPIRED: 'AUTH_005',
  AUTH_MISSING_TOKEN: 'AUTH_006',

  // User errors
  USER_NOT_FOUND: 'USER_001',
  USER_PROFILE_NOT_FOUND: 'USER_002',
  USER_UNAUTHORIZED: 'USER_003',

  // Lesson errors
  LESSON_NOT_FOUND: 'LESSON_001',
  LESSON_NOT_AVAILABLE: 'LESSON_002',
  LESSON_ALREADY_COMPLETED: 'LESSON_003',

  // Subscription errors
  SUBSCRIPTION_NOT_FOUND: 'SUB_001',
  SUBSCRIPTION_INACTIVE: 'SUB_002',
  INVALID_PLAN: 'SUB_003',
  STRIPE_ERROR: 'SUB_004',

  // Validation errors
  VALIDATION_ERROR: 'VAL_001',
  INVALID_REQUEST: 'VAL_002',

  // Server errors
  INTERNAL_ERROR: 'ERR_001',
  DATABASE_ERROR: 'ERR_002',
  SERVICE_UNAVAILABLE: 'ERR_003',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.AUTH_EMAIL_ALREADY_EXISTS]: 'Email already registered',
  [ERROR_CODES.AUTH_INVALID_TOKEN]: 'Invalid authentication token',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ERROR_CODES.AUTH_MISSING_TOKEN]: 'Missing authentication token',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.USER_PROFILE_NOT_FOUND]: 'User profile not found',
  [ERROR_CODES.USER_UNAUTHORIZED]: 'Unauthorized access',
  [ERROR_CODES.LESSON_NOT_FOUND]: 'Lesson not found',
  [ERROR_CODES.LESSON_NOT_AVAILABLE]: 'Lesson is not available yet',
  [ERROR_CODES.LESSON_ALREADY_COMPLETED]: 'Lesson already completed',
  [ERROR_CODES.SUBSCRIPTION_NOT_FOUND]: 'Subscription not found',
  [ERROR_CODES.SUBSCRIPTION_INACTIVE]: 'Subscription is inactive',
  [ERROR_CODES.INVALID_PLAN]: 'Invalid subscription plan',
  [ERROR_CODES.STRIPE_ERROR]: 'Payment processing error',
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation error',
  [ERROR_CODES.INVALID_REQUEST]: 'Invalid request',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
  [ERROR_CODES.DATABASE_ERROR]: 'Database error',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
};
