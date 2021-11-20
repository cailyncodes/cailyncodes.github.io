import React from "react";
import Link from "next/link";

interface Link {
  label: string;
  href: string;
}

interface HeaderProps {
  title: string;
  subtitle: string;
  links: Link[];
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, links }) => {
  return (
    <header className="flex bg-opacity-50 bg-gray-800 h-full w-full justify-between py-6 px-5 items-center">
      <Link href="/" passHref>
        <a className="group flex-shrink w-max text-xs text-white uppercase">
          <span className="bg-white text-gray-800 mr-3 w-min py-1.5 px-2 tracking-widest group-hover:transition-colors group-hover:bg-purple-400">
            {title}
          </span>{" "}
          <span className="hidden lg:inline tracking-wider font-bold group-hover:transition-colors group-hover:text-purple-200">
            {subtitle}
          </span>
          {/* <span className="lg:group-hover:hidden group-hover:block hidden pt-2">
            {subtitle}
          </span> */}
        </a>
      </Link>
      <nav className="flex-shrink w-max hidden md:block">
        <ul className="list-none flex justify-evenly items-center">
          {links.map(({ label, href }) => (
            <li key={label} className="px-3 text-white hover:text-purple-300">
              <Link href={href} passHref>
                <a>{label}</a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
