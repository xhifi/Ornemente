"use client";

import Link from "next/link";
import Logo from "../brand/Logo";
import { usePathname } from "next/navigation";
import CartButton from "../cart/CartButton";

const NavLink = ({ href, className, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} className={`${className} ${isActive ? "underline pointer-events-none" : "hover:underline "}`}>
      {children}
    </Link>
  );
};

const Navigation = () => {
  return (
    <div className="px-6 border-b py-2 flex items-center">
      <Logo />
      <div className="ms-auto flex items-center gap-4">
        <ul className="ms-auto flex items-center gap-4 *:underline-offset-3">
          <li>
            <NavLink href="/" className="">
              Stitched
            </NavLink>
          </li>
          <li>
            <NavLink href="/un-stitched">Un-Stitched</NavLink>
          </li>
          <li>
            <NavLink href="/clearance">Clearance Sale</NavLink>
          </li>
          <li>
            <NavLink href="/contact">Contact Us</NavLink>
          </li>
        </ul>
        <Link
          href="/dashboard"
          className={`bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/80 transition-colors`}
        >
          Dashboard
        </Link>
        <CartButton />
      </div>
    </div>
  );
};

export default Navigation;
