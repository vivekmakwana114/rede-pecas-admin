import { BrandMark } from '@/components/BrandMark';
import { LanguageToggle } from '@/components/LanguageToggle';
import { UserMenu } from './UserMenu';

/**
 * Top app bar showing the Rede Peças brand mark and name on the left
 * and the language toggle plus the current admin's user menu on the right.
 */
export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3.5">
      <div className="flex items-center gap-2.5">
        <BrandMark />
        <span className="text-base font-bold tracking-tight text-foreground">Rede Peças</span>
      </div>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <UserMenu />
      </div>
    </header>
  );
}
