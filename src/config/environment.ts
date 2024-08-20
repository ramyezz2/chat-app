export default {
  systemName: process.env.SYSTEM_NAME,
  port: process.env.PORT || 8080,
  secret: process.env.SECRET,
  salt: process.env.SALT,
  databaseUrl:
    process.env.NODE_ENV === 'test'
      ? 'mongodb://127.0.0.1:27017/chat-app-db-test'
      : process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,

  imageFileTypeAllowed: /\/(png|jpg|jpeg|bmp)$/,
  videoFileTypeAllowed: /\/(mp4)$/,
  audioFileTypeAllowed: /\/(m4a|mp3|mpeg|mp4|avi|flv|wav)$/,
  fileTypeAllowed:
    /\/(pdf|doc|docx|png|jpg|jpeg|bmp|m4a|mp3|mpeg|mp4|avi|flv|wav|ttf|woff|woff2|font-woff)$/,
  tokenExpiresIn: '6h',
  refreshTokenExpiresIn: '30d',
};
