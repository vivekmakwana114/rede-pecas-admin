import type { ReactNode } from 'react';
import { Car, Cog, Wrench } from 'lucide-react';

/**
 * Two-column shell used by every auth page: a narrow form column (its
 * children) on the left and a decorative branded panel on the right.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-2/5 lg:px-16">
        <div className="mx-auto w-full max-w-sm">{children}</div>
        <p className="mt-12 text-center text-xs text-muted-foreground">© Rede Peças {new Date().getFullYear()}</p>
      </div>

      <div className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:w-3/5">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-primary" />
        <Cog className="absolute -top-16 -right-16 h-96 w-96 text-white/5" strokeWidth={0.75} />
        <Wrench className="absolute bottom-10 left-10 h-64 w-64 -rotate-12 text-white/5" strokeWidth={0.75} />
        <Car className="absolute top-1/3 left-1/4 h-40 w-40 -rotate-6 text-white/10" strokeWidth={0.75} />
        <div className="relative z-10 flex flex-col justify-end p-16 text-white">
          <h2 className="max-w-md text-3xl font-bold leading-tight">Keep every order moving, from request to pickup.</h2>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Approve customer orders, manage supplier inventory and keep Rede Peças running smoothly — all from one panel.
          </p>
        </div>
      </div>
    </div>
  );
}
