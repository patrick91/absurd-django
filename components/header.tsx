import Link from "next/link";

export const Header = () => {
  return (
    <header className="bg-django-green">
      <nav className="px-4" aria-label="Top">
        <div className="w-full py-2 flex items-center justify-between border-b border-django-green lg:border-none">
          <div className="flex items-center">
            <Link href="/">
              <a className="font-bold text-white">Absurd django</a>
            </Link>
          </div>
          <div className="ml-10 space-x-4">
            <a
              href="https://github.com/patrick91/absurd-django"
              className="inline-block bg-white py-2 px-4 border border-transparent rounded-md text-sm font-medium text-django-green hover:bg-green-50"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};
