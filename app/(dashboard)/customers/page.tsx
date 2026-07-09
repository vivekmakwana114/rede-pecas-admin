import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-800">Customers module coming soon</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Customer profiles and order history will show up here once this module is built.
      </p>
    </div>
  );
}
