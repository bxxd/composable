import Link from "next/link";
import { ReactNode } from "react";

type NavigationProps = {
  routes: { path: string; label: ReactNode }[];
};

export default function Navigation({ routes }: NavigationProps) {
  return (
    <nav className="flex space-x-1 justify-center ">
      {routes.map((route, index) => (
        <Link key={index} href={route.path} passHref>
          <span className="pr-4 rounded-md opacity-50 transition duration-300 ease-in-out transform hover:scale-105 hover:opacity-100">
            {route.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
