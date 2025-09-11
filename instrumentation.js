import initPG from "@/scripts/instrumentation/init-postgres";

export async function register() {
  await initPG();
}
