import { Pool } from "pg";

// Create a new PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB || "samra_db",
});

// Function to query the database
export async function query(text, params) {
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
export async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Monkey patch the query method to keep track of queries
  client.query = async (...args) => {
    const start = Date.now();
    try {
      const res = await query(...args);
      const duration = Date.now() - start;
      console.log("Executed query", { text: args[0], duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error("Error executing query", { text: args[0], error });
      throw error;
    }
  };

  // Monkey patch the release method to log release
  client.release = () => {
    console.log("Client released back to pool");
    release();
  };

  return client;
}

export default { query, getClient };
