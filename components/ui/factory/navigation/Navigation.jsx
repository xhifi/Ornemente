"use client";

import Link from "next/link";
import Logo from "../brand/Logo";
import { usePathname } from "next/navigation";
import CartButton from "../cart/CartButton";
import DashboardOrLoginButton from "./dashboard-or-login-button";

const NavLink = ({ href, className, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} className={`${className} ${isActive ? "underline pointer-events-none" : "hover:underline "}`}>
      {children}
    </Link>
  );
};

const Navigation = ({ session }) => {
  return (
    <div className="px-6 border-b py-2 flex items-center">
      <Logo />
      <div className="ms-auto flex items-center gap-4">
        <ul className="ms-auto flex items-center gap-4 *:underline-offset-3">
          <li>
            <NavLink href="/shop">Shop</NavLink>
          </li>
          <li>
            <NavLink href="/contact">Contact Us</NavLink>
          </li>
        </ul>
        <DashboardOrLoginButton session={session} />
        <CartButton />
      </div>
    </div>
  );
};

export default Navigation;
