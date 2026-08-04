import { Wrench } from 'lucide-react';

/**
 * Renders the Rede Peças wrench logo mark used in the header and other
 * branding spots across the admin panel.
 */
export function BrandMark() {
  return (
    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-primary text-primary-foreground shadow-sm">
      <Wrench className="h-5 w-5" />
    </div>
  );
}
