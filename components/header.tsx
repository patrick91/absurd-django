import Link from "next/link";

export const Header = () => {
  return (
    <header className="bg-indigo-600">
      <nav className="px-4" aria-label="Top">
        <div className="w-full py-2 flex items-center justify-between border-b border-indigo-500 lg:border-none">
          <div className="flex items-center">
            <Link href="/">
              <a className="font-bold text-white">Diagrams web</a>
            </Link>
          </div>
          <div className="ml-10 space-x-4">
            <a
              href="https://github.com/patrick91/diagrams-web"
              className="inline-block bg-white py-2 px-4 border border-transparent rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};
