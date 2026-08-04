import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

/**
 * Route entry for /reset-password — renders the ResetPasswordForm inside a
 * Suspense boundary since the form reads the phone number from search params.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
