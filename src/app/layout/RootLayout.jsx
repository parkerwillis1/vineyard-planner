import { Link, NavLink } from 'react-router-dom';

export default function RootLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/VinePioneerMark.svg" alt="" className="h-8" />
            <span className="font-bold text-[#0b1b13]">Vine Pioneer</span>
          </Link>

          <nav className="ml-auto flex items-center gap-6">
            {[
              { to: '/', label: 'Home' },
              { to: '/planning', label: 'Planning' },
              { to: '/vineyards', label: 'Vineyards' },
              { to: '/resources', label: 'Resources' },
              { to: '/account', label: 'Account' },
            ].map(i => (
              <NavLink key={i.to} to={i.to}
                className={({isActive}) =>
                  `text-sm ${isActive ? 'text-green-700 font-semibold' : 'text-gray-600 hover:text-black'}`
                }>
                {i.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="w-full">{children}</main>

      <footer className="mt-20 border-t">
        <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Vine Pioneer
        </div>
      </footer>
    </div>
  );
}
