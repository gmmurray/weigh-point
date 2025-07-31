import { type ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  showAddEntry?: boolean;
  customActions?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Layout = ({
  children,
  showAddEntry = false,
  customActions,
  maxWidth = '4xl',
}: LayoutProps) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <AppHeader showAddEntry={showAddEntry} customActions={customActions} />

      <main
        className={`container mx-auto px-4 py-8 ${maxWidthClasses[maxWidth]} flex-1`}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
};
