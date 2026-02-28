import type { LucideIcon } from 'lucide-react';
import { FileText, Workflow } from 'lucide-react';
import { Link, useLocation } from 'react-router';

function NavLink({
  to,
  label,
  icon: Icon,
  isActive,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors no-underline ${
        isActive
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={14} />
      {label}
    </Link>
  );
}

export function ViewNav() {
  const location = useLocation();
  const isGraph = location.pathname === '/' || location.pathname === '';
  const isDocs = location.pathname.startsWith('/docs');

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="font-bold text-sm mb-3 text-gray-900">piste</div>
      <div className="flex gap-1">
        <NavLink to="/" label="Graph" icon={Workflow} isActive={isGraph} />
        <NavLink to="/docs" label="Docs" icon={FileText} isActive={isDocs} />
      </div>
    </div>
  );
}
