import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getSessionToken } from '@/lib/session';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const token = await getSessionToken();
  if (token) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-sky-50 text-sky-600 rounded-xl mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Rede Peças</h1>
          <p className="text-sm text-slate-500 mt-1">Order Administration Panel</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
