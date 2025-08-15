"use server";

import { revalidatePath } from "next/cache";

const revalidatePathSSR = (path) => {
  revalidatePath(path);
};
export default revalidatePathSSR;
