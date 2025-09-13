import initPG from "@/scripts/instrumentation/init-postgres";
import initMinio from "./scripts/instrumentation/init-minio";
import cliColors from "./scripts/instrumentation/cli-colors";

export async function register() {
  console.log(`\n`);
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const pg = await initPG();
    if (pg) await initMinio();

    console.log(`------------------------------------------------`);
    console.log(`${cliColors.green}\x1B[1m✓ All instrumentation initialized successfully${cliColors.reset}`);
    console.log(`------------------------------------------------`);
    if (process.env.NODE_ENV === "production") {
      console.log(`${cliColors.green}✓ Server is running at ${process.env.SERVER_URL} ${cliColors.reset}`);
    }
    console.log(`\n`);
    return;
  }
  return;
}
