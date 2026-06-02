export const jwtConfig = {
  accessSecret: process.env.JWT_SECRET || 'change-me-in-production-min-32-chars',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-in-production',
  accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

export default jwtConfig;
