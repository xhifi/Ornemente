"use server";
import { query } from "../../lib/db";
import cliColors from "./cli-colors";

const initPG = async () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const fs = require("fs");
    const path = require("path");
    try {
      console.log(`${cliColors.yellow}🔧 Initializing Postgres instrumentation...${cliColors.reset}`);
      const schemaPath = path.join(process.cwd(), "data", "schema.sql");
      const seedPath = path.join(process.cwd(), "data", "seed.sql");
      const schemaQuery = (await fs.promises.readFile(schemaPath, "utf-8")).toString();
      const seedQuery = (await fs.promises.readFile(seedPath, "utf-8")).toString();

      // Apply schema first
      const q = await query(schemaQuery);
      console.log(`${cliColors.cyan}✓ Postgres schema applied successfully${cliColors.reset}`);
      if (q) {
        // Apply seed data
        await query(seedQuery);
        console.log(`${cliColors.cyan}✓ Postgres seed data applied successfully${cliColors.reset}`);
        console.log(`${cliColors.green}✓ Postgres instrumentation initialized successfully${cliColors.reset}`);
      }
      return true;
    } catch (error) {
      console.log(`${cliColors.red}✗ Error initializing Postgres instrumentation: ${error.message}${cliColors.reset}`);
      console.log(error);

      // If it's a sequence conflict, provide helpful information
      if (error.code === "23505" && error.detail && error.detail.includes("already exists")) {
        console.log(
          `${cliColors.yellow}💡 This might be a sequence conflict. Consider running the database migration or resetting sequences.${cliColors.reset}`
        );
      }
    }
  }
  return;
};

export default initPG;
