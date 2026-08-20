import 'dotenv/config';
import { DataSource } from 'typeorm';
import { getDatabaseConfiguration } from '../Configuration/DatabaseConfiguration';

export default new DataSource(getDatabaseConfiguration());
