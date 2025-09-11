// Database connection checker script
const { pool } = require("../lib/db");

async function checkDatabaseConnection() {
  console.log("Testing database connection...");

  try {
    // Try to connect to the database
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as time");
    client.release();

    console.log("\x1b[32m%s\x1b[0m", "✓ Database connection successful!");
    console.log(`Connected to PostgreSQL database at ${new Date(result.rows[0].time).toISOString()}`);

    // Get database version
    const versionResult = await pool.query("SELECT version()");
    console.log(`PostgreSQL version: ${versionResult.rows[0].version}`);

    // Check for auth tables
    try {
      const tableResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'sessions', 'accounts', 'verifications')
      `);

      console.log("\nAuth tables found:");
      if (tableResult.rowCount === 0) {
        console.log("\x1b[33m%s\x1b[0m", "⚠️ No auth tables found. You may need to run migrations.");
        console.log("Run: npm run auth:migrate");
      } else {
        tableResult.rows.forEach((row) => {
          console.log(`- ${row.table_name}`);
        });
      }
    } catch (err) {
      console.error("\x1b[33m%s\x1b[0m", "⚠️ Could not check for auth tables:", err.message);
    }

    process.exit(0);
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", "✗ Database connection failed!");
    console.error(`Error details: ${err.message}`);

    // Check if the error is ECONNREFUSED
    if (err.code === "ECONNREFUSED") {
      console.error("\nPossible causes:");
      console.error("1. The database server is not running");
      console.error("2. The database connection details in your .env file are incorrect");
      console.error("3. There might be a network issue preventing the connection");

      console.error("\nSuggested fixes:");
      console.error("1. Make sure your database server is running");
      console.error("2. Check your DATABASE_URL or individual connection parameters in .env");
      console.error("3. If using a remote database, check if the host allows connections from your IP");

      if (process.env.NODE_ENV === "production") {
        console.error("\nFor production environments:");
        console.error("1. Ensure the database is accessible from your server");
        console.error("2. Check if SSL is required for your database connection");
        console.error("3. Verify any firewall or security group settings");
      } else {
        console.error("\nFor development environments:");
        console.error("1. Try running: docker-compose up -d postgres");
        console.error("2. Or start a local PostgreSQL server");
      }
    }

    process.exit(1);
  }
}

// Run the check
checkDatabaseConnection();
