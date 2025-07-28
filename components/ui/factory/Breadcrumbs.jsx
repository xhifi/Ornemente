"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Breadcrumbs = () => {
  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);

  return (
    <div className="px-6 py-3 bg-gray-300 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold">Breadcrumbs</h1>
      </div>
      <ul className="">
        {pathParts.map((part, i) => {
          return (
            <li key={part} className="inline-block mr-2">
              {i === pathParts.length - 1 ? (
                <span className="text-gray-500">{part.charAt(0).toUpperCase() + part.slice(1)}</span>
              ) : (
                <Link
                  href={`http://localhost:3000/${pathParts.slice(0, i + 1).join("/")}`}
                  className=" hover:underline disabled:pointer-events-none"
                  disabled={i === pathParts.length - 1}
                >
                  {(part.charAt(0).toUpperCase() + part.slice(1)).replace(/[_\-.]/g, " ")}
                </Link>
              )}

              {i < pathParts.length - 1 && <span className="mx-2">/</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Breadcrumbs;
