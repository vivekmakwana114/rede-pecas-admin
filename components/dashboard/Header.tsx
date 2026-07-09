import { BrandMark } from '@/components/BrandMark';
import { UserMenu } from './UserMenu';

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
      <div className="flex items-center gap-2.5">
        <BrandMark />
        <span className="text-base font-bold tracking-tight text-slate-900">Rede Peças</span>
      </div>
      <UserMenu />
    </header>
  );
}
