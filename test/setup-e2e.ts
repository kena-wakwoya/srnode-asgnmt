process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??=
  'postgres://admin:password@localhost:55432/imports_db';
process.env.UPLOAD_DIR ??= './data/uploads';
