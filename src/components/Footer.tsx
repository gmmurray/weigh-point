import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-base-300 bg-base-100 mt-16">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">WeighPoint</span>
            <span className="text-base-content/60">© {currentYear}</span>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <Link
              to="/dashboard"
              className="text-base-content/70 hover:text-base-content transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/goals"
              className="text-base-content/70 hover:text-base-content transition-colors"
            >
              Goals
            </Link>
            <Link
              to="/entries"
              className="text-base-content/70 hover:text-base-content transition-colors"
            >
              Entries
            </Link>
            <Link
              to="/settings"
              className="text-base-content/70 hover:text-base-content transition-colors"
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};
