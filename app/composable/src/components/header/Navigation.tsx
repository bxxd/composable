import Link from "next/link";
import { ReactNode } from "react";

type NavigationProps = {
  routes: { path: string; label: ReactNode }[];
};

export default function Navigation({ routes }: NavigationProps) {
  return (
    <nav className="flex space-x-4">
      {routes.map((route, index) => (
        <Link key={index} href={route.path} passHref>
          <span className="px-1 py-1 rounded-md text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-300 cursor-pointer">
            {route.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
