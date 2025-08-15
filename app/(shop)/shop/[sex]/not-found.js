"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="px-6 max-w-lg mx-auto text-center py-6">
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <div className="flex flex-col gap-2 mt-4">
        <button
          onClick={() => router.back()}
          className="block px-3 py-1.5 bg-primary text-primary-foreground text-center hover:bg-primary/85 cursor-pointer "
        >
          Go Back
        </button>
        <Link href="/" className="block px-3 py-1.5 bg-primary text-primary-foreground text-center hover:bg-primary/85 cursor-pointer ">
          Return Home
        </Link>
      </div>
    </div>
  );
}
