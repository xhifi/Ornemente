import { NextResponse } from "next/server";
import { getServerSession } from "./lib/auth-actions";

// This function can be marked `async` if using `await` inside
export async function middleware(request) {
  console.log(`MIDDLEWARE INVOKED`);
  const session = await getServerSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
  // return NextResponse.redirect(new URL("/home", request.url));
}

export const config = {
  matcher: ["/dashboard"],
  runtime: "nodejs",
};
