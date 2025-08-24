import { NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request) {
  console.log(`MIDDLEWARE INVOKED`);
  return NextResponse.redirect(new URL("/home", request.url));
}

export const config = {
  matcher: "/",
  runtime: "nodejs",
};
