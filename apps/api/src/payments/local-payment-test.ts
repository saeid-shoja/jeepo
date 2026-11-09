export type LocalPaymentTestRequest = {
  headers: { host?: string };
  socket: { remoteAddress?: string };
};

export function isLocalPaymentTestEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.LOCAL_PAYMENT_TEST_MODE === 'true';
}

export function isLocalPaymentTestRequest(request: LocalPaymentTestRequest): boolean {
  if (!isLocalPaymentTestEnabled()) return false;

  const remoteAddress = request.socket.remoteAddress ?? '';
  const isLoopbackAddress =
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1' ||
    /^127(?:\.\d{1,3}){3}$/.test(remoteAddress);
  if (!isLoopbackAddress || !request.headers.host) return false;

  try {
    const hostname = new URL(`http://${request.headers.host}`).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}
