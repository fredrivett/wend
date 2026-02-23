import type React from 'react';

type BadgeVariant =
  // Entry point solid badges
  | 'api-route'
  | 'page'
  | 'job'
  | 'server-action'
  | 'middleware'
  // HTTP method solid badges
  | 'get'
  | 'post'
  | 'put'
  | 'patch'
  | 'delete'
  // Implementation solid badges
  | 'inngest'
  | 'trigger'
  // Mid-tier soft badges
  | 'component'
  | 'hook'
  | 'async'
  | 'default';

/** Base Tailwind classes shared by all badge variants. */
const BASE_CLASSES = 'text-[10px] font-semibold px-1.5 py-0.5 rounded';

/** Variant-specific Tailwind classes for each badge type. */
const variantClasses: Record<BadgeVariant, string> = {
  // Solid entry point badges
  'api-route': 'bg-blue-500 text-white uppercase tracking-wide font-bold',
  page: 'bg-violet-500 text-white uppercase tracking-wide font-bold',
  job: 'bg-pink-500 text-white uppercase tracking-wide font-bold',
  'server-action': 'bg-emerald-500 text-white uppercase tracking-wide font-bold',
  middleware: 'bg-cyan-500 text-white uppercase tracking-wide font-bold',
  // Solid HTTP method badges
  get: 'bg-green-500 text-white',
  post: 'bg-blue-500 text-white',
  put: 'bg-amber-500 text-white',
  patch: 'bg-amber-500 text-white',
  delete: 'bg-red-500 text-white',
  // Solid implementation badges
  inngest: 'bg-pink-500 text-white',
  trigger: 'bg-pink-500 text-white',
  // Soft mid-tier badges
  component: 'bg-orange-100 text-orange-700',
  hook: 'bg-lime-100 text-lime-700',
  async: 'bg-gray-100 text-gray-500',
  default: 'bg-gray-100 text-gray-600',
};

/** Default display labels for each badge variant. */
const variantLabels: Record<BadgeVariant, string> = {
  'api-route': 'API',
  page: 'Page',
  job: 'Job',
  'server-action': 'Action',
  middleware: 'Middleware',
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  delete: 'DELETE',
  inngest: 'Inngest',
  trigger: 'Trigger',
  component: 'Component',
  hook: 'Hook',
  async: 'async',
  default: '',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

/** Renders a styled badge span as a React component. */
export function Badge({ variant, children }: BadgeProps) {
  return <span className={`${BASE_CLASSES} ${variantClasses[variant]}`}>{children}</span>;
}

export { variantLabels };
export type { BadgeVariant };
