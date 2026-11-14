export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Silakan coba kembali.'): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
