import initPG from "@/scripts/instrumentation/init-postgres";
import initMinio from "./scripts/instrumentation/init-minio";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await initPG();
    await initMinio();
    return;
  }
  return;
}
