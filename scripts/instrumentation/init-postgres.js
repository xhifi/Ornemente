"use server";

import cliColors from "./cli-colors";

const initPG = async () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const fs = require("fs");
    const path = require("path");
    const { query } = require("../../lib/db");
    try {
      console.log(`${cliColors.green}Postgres instrumentation initialized${cliColors.reset}`);
      const schemaPath = path.join(process.cwd(), "data", "schema.sql");
      const query = await fs.promises.readFile(schemaPath, "utf-8");
      console.log(query);
      return;
    } catch (error) {
      console.log(`${cliColors.red}Error initializing Postgres instrumentation: ${error.message}${cliColors.reset}`);
      console.log(error);
    }
  }
  return;
};

export default initPG;
