import worker from '../lib/worker.js';

export default async function handler(req, res) {
  const origin = 'https://' + req.headers.host;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const request = new Request(new URL(req.url, origin), {
    method: req.method,
    headers,
    ...(!['GET', 'HEAD'].includes(req.method) ? { body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}) } : {})
  });
  const response = await worker.fetch(request, {
    ADMIN_PIN: process.env.ADMIN_PIN || '1234',
    GOOGLE_SCRIPT_URL: process.env.GOOGLE_SCRIPT_URL || ''
  });
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.send(await response.text());
}
