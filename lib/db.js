import { Pool } from "pg";

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      user: process.env.POSTGRES_USER || "postgres",
      password: process.env.POSTGRES_PASSWORD || "postgres",
      host: process.env.POSTGRES_HOST || "localhost",
      port: parseInt(process.env.POSTGRES_PORT || "5432"),
      database: process.env.POSTGRES_DB || "samraz_boutique",
    };

// Create a new PostgreSQL connection pool
const pool = new Pool(config);

// Function to query the database
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = `${Date.now() - start}ms`;
    // console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Error executing query", { text, error });
    throw error;
  }
}

// Function to get a client from the pool
async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  // Monkey patch the query method to keep track of queries
  client.query = async (...args) => {
    const start = Date.now();
    try {
      // Use the original query method, not our exported query function
      const res = await originalQuery(...args);
      const duration = Date.now() - start;
      console.log("Executed query", {
        text: typeof args[0] === "string" ? args[0] : "prepared statement",
        duration,
        rows: res?.rowCount || "unknown",
      });
      return res;
    } catch (error) {
      console.error("Error executing query", {
        text: typeof args[0] === "string" ? args[0] : "prepared statement",
        error,
      });
      throw error;
    }
  };

  // Monkey patch the release method to log release
  client.release = () => {
    try {
      console.log("Client released back to pool");
      release();
    } catch (error) {
      console.error("Error releasing client:", error);
      // Still try to release even if there was an error
      try {
        pool.connect().then((c) => c.release());
      } catch (e) {}
    }
  };

  return client;
}

export { query, getClient, pool };

// // Also export async function wrappers for "use server" compatibility
// export async function executeQuery(text, params) {
//   return await query(text, params);
// }

// export async function getPoolClient() {
//   return await getClient();
// }
