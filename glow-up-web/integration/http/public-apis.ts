export const PUBLIC_APIS = [
  '/auth/otp/request',
  '/auth/login/otp',
  '/auth/verify-otp',
  '/providers',
  '/employees/provider',
  '/report/stats/site',
];

export const isPublicApi = (url?: string) => {
  if (!url) return false;
  return PUBLIC_APIS.some((path) => {
    return url === path || url.startsWith(`${path}?`); 
  });
};