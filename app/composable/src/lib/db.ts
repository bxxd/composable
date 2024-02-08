/// <reference types="node" />

import pgp from "pg-promise";

let dbInstance: pgp.IDatabase<any, any> | null = null;
let usageCounter = 0;

let mutex = Promise.resolve();

export const getDbInstance = async (): Promise<pgp.IDatabase<any, any>> => {
  await mutex;

  mutex = (async () => {
    if (!dbInstance) {
      // console
      //   .log
      // `creating db instance... host: ${process.env.PGHOST} db: ${process.env.PGDATABASE}`
      // ();
      dbInstance = pgp()(process.env.DATABASE_URL);

    }
    usageCounter += 1;
  })();

  await mutex;
  return dbInstance!;
};

export const releaseDbInstance = async (): Promise<void> => {
  await mutex;

  mutex = (async () => {
    usageCounter -= 1;
    if (usageCounter === 0 && dbInstance) {
      // console.log("Closing db instance...");
      await dbInstance.$pool.end();
      dbInstance = null;
    }
  })();

  await mutex;
};
