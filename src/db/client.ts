/**
 * The on-device database. Opens the SQLite file once per process. This
 * module touches native modules, so it is never imported by pure-logic unit
 * tests (see src/lib/*).
 */
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export const db: SQLiteDatabase = openDatabaseSync('threadtone.db');
