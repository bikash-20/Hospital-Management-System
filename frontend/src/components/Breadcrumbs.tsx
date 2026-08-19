import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/patient-history': 'Patient History',
  '/appointments': 'Appointments',
  '/consultation': 'Consultation',
  '/prescriptions': 'Prescriptions',
  '/queue': 'Queue Display',
  '/beds': 'Bed Management',
  '/billing': 'Billing',
  '/settings': 'Settings',
  '/audit-logs': 'Audit Logs',
  '/users': 'User Management',
  '/schedule': 'Doctor Schedule',
  '/lab-results': 'Lab Results',
  '/reports': 'Revenue Reports',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Don't show breadcrumbs on dashboard
  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 text-surface-400 hover:text-primary-500 dark:text-surface-500 dark:hover:text-primary-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = routeLabels[routeTo] || name.charAt(0).toUpperCase() + name.slice(1);

          return (
            <li key={routeTo} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-surface-300 dark:text-surface-600" aria-hidden="true" />
              {isLast ? (
                <span className="text-surface-700 dark:text-surface-300 font-medium" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-surface-400 hover:text-primary-500 dark:text-surface-500 dark:hover:text-primary-400 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
