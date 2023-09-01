/// <reference types="node" />

import pgp from "pg-promise";

let dbInstance: any = null;

export const getDbInstance = () => {
  if (!dbInstance) {
    console.log("creating db instance..");
    dbInstance = pgp()(
      process.env.DATABASE_URL || {
        host: process.env.PGHOST || "localhost",
        database: process.env.PGDATABASE || "",
        port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
        user: process.env.PGUSER || "composable",
        password: process.env.PGPASSWORD,
      }
    );
  }
  return dbInstance;
};
