const json = (v, status = 200) => Response.json(v, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*'
  }
});

const phone = v => String(v || '').replace(/[\s().-]/g, '').replace(/^\+84/, '0').replace(/^84(?=\d{9}$)/, '0');

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    try {
      if (!p.startsWith('/api/')) return new Response('Not found', { status: 404 });
      if (req.method === 'POST' && req.headers.get('Origin') && req.headers.get('Origin') !== url.origin) {
        // Cho phép cùng origin
      }

      const scriptUrl = env.GOOGLE_SCRIPT_URL || '';
      const adminPin = env.ADMIN_PIN || '1234';
      const admin = req.headers.get('Authorization') === 'Bearer ' + adminPin;

      // 1. Cấu hình Fanpage
      if (p === '/api/config' && req.method === 'GET') {
        if (!scriptUrl) return json({ fanpage: 'https://www.facebook.com/rockylensvietnam' });
        try {
          const r = await fetch(scriptUrl + (scriptUrl.includes('?') ? '&' : '?') + 'action=config');
          const j = await r.json();
          return json({ fanpage: j.fanpage || 'https://www.facebook.com/rockylensvietnam' });
        } catch {
          return json({ fanpage: 'https://www.facebook.com/rockylensvietnam' });
        }
      }

      // 2. Đăng ký Check-in
      if (p === '/api/register' && req.method === 'POST') {
        const b = await req.json();
        const n = String(b.name || '').trim().replace(/\s+/g, ' ');
        const ph = phone(b.phone);

        if (n.length < 2 || n.length > 100 || !/^0[35789]\d{8}$/.test(ph)) {
          return json({ error: 'Vui lòng nhập họ tên và số điện thoại Việt Nam hợp lệ (10 số).' }, 400);
        }

        if (!scriptUrl) {
          return json({
            error: 'Chưa cấu hình GOOGLE_SCRIPT_URL. Hãy tạo Google Apps Script và dán link vào cấu hình.'
          }, 503);
        }

        const resp = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'register', name: n, phone: ph, consent: b.consent })
        });
        const result = await resp.json();
        return json(result, resp.status || 200);
      }

      // Các tác vụ quản trị
      if (!admin) return json({ error: 'Mã truy cập nội bộ chưa đúng.' }, 401);

      if (p === '/api/records' && req.method === 'GET') {
        if (!scriptUrl) return json([]);
        const r = await fetch(scriptUrl + (scriptUrl.includes('?') ? '&' : '?') + 'action=records');
        return json(await r.json());
      }

      if (p === '/api/config' && req.method === 'POST') {
        const b = await req.json();
        if (!scriptUrl) return json({ ok: true });
        const r = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'config', fanpage: b.fanpage })
        });
        return json(await r.json());
      }

      if (p === '/api/claim' && req.method === 'POST') {
        const b = await req.json();
        if (!scriptUrl) return json({ ok: true });
        const r = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'claim', ...b })
        });
        return json(await r.json());
      }

      return json({ error: 'Không tìm thấy.' }, 404);
    } catch (e) {
      return json({ error: 'Chưa thể xử lý: ' + e.message }, 503);
    }
  }
};
