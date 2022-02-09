export const __prod__ = process.env.NODE_ENV === 'production'
export const COOKIE_NAME = 'qid'
export const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://studio.apollographql.com']
export const BLOCKED_BY_CORS_MESSAGE = 'The CORS policy for this site does not allow access from the specified Origin.'
export const FORGET_PASSWORD_PREFIX = 'forget-password:'