import { json } from '@sveltejs/kit';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function POST({ request, getClientAddress }) {
  const { token } = await request.json();

  if (!token) {
    return json({ ok: false, message: 'Token Turnstile ausente.' }, { status: 400 });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return json({ ok: false, message: 'TURNSTILE_SECRET_KEY não configurada no servidor.' }, { status: 500 });
  }

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  form.set('remoteip', getClientAddress());

  const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  });

  if (!verifyResponse.ok) {
    return json({ ok: false, message: 'Falha ao validar desafio de segurança.' }, { status: 502 });
  }

  const verifyData = await verifyResponse.json();

  if (!verifyData.success) {
    return json(
      {
        ok: false,
        message: 'Desafio de segurança inválido.',
        errors: verifyData['error-codes'] || []
      },
      { status: 403 }
    );
  }

  return json({ ok: true });
}
