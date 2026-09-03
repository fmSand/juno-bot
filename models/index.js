import Sequelize from "sequelize";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const commonOptions = {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    decimalNumbers: true,
    query_timeout: 5000,
    statement_timeout: 30000,
    // Uncomment the following lines if you need to use SSL to connect to your database
    // ssl: {
    //   require: process.env.SSL || true,
    //   rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED || false,
    // },
  },
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(
      process.env.DATABASE_NAME,
      process.env.ADMIN_USERNAME,
      process.env.ADMIN_PASSWORD,
      {
        ...commonOptions,
        host: process.env.HOST,
        dialect: process.env.DIALECT ?? "postgres",
      },
    );

async function createDatabase(options) {
  const db = {};
  db.sequelize = options;

  const files = fs
    .readdirSync(__dirname)
    .filter((file) => file.indexOf(".") !== 0 && file !== basename && file.endsWith(".js"));

  const models = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(__dirname, file);
      const mod = await import(pathToFileURL(filePath).href);
      const model = mod.default(options, Sequelize);
      return model;
    }),
  );

  for (const model of models) {
    db[model.name] = model;
  }

  for (const name of Object.keys(db)) {
    if (typeof db[name].associate === "function") {
      db[name].associate(db);
    }
  }

  return db;
}

const adminDb = await createDatabase(sequelize);

export { createDatabase as db, adminDb };
