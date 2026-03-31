export function useSmartRedirect() {
  const token  = localStorage.getItem('token');
  const role   = localStorage.getItem('userRole');

  // Not logged in at all
  if (!token) return '/register';

  // Logged in but no subscription yet
  const subStatus = localStorage.getItem('subStatus');
  if (subStatus !== 'active') return '/subscribe';

  // Logged in + active subscription
  if (role === 'admin') return '/admin';
  return '/dashboard';
}