function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  mongoUrl: required('MONGO_URL'),
  jwtSecret: required('JWT_SECRET'),
  adminApiKey: required('ADMIN_API_KEY'),
  uploadDir: process.env.UPLOAD_DIR ?? '/var/app/uploads',
  avatarDir: process.env.AVATAR_DIR ?? '/var/app/avatars',
};
