import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';
dotenv.config();

export default registerAs('development', () => ({
  mongodbConnectionUrl: process.env.DEV_MONGODB_CONNECTION_URL,
}));
