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

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

export type { BadgeVariant };
