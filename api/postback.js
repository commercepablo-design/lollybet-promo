export default async function handler(req, res) {
  const { type, userid, sub1, sub2, sub3, value, currency } = req.query;

  const accessToken = process.env.META_ACCESS_TOKEN; // ← читаем верную переменную
  const pixelId = '1532014038042881';
  const testEventCode = 'TEST36398';  // можешь закомментировать после тестов

  const eventName =
    String(type).toLowerCase() === 'registration' ? 'CompleteRegistration' :
    String(type).toLowerCase() === 'deposit' ? 'Purchase' :
    String(type).toLowerCase() === 'first_deposit' ? 'Purchase' :
    String(type).toLowerCase() === 'repeated_deposit' ? 'Purchase' :
    'CustomEvent';

  const ref = req.headers.referer || `https://${req.headers.host || ''}/`;
  const ua  = req.headers['user-agent'] || '';
  const ip  = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: sub3 || undefined,
        action_source: 'website',
        event_source_url: ref,
        user_data: {
          client_ip_address: ip || undefined,
          client_user_agent: ua || undefined,
          external_id: userid ? String(userid) : undefined,
          fbp: sub1 || undefined,
          fbc: sub2 || undefined,
        },
        custom_data: {
          value: value ? Number(value) : undefined,
          currency: currency || 'EUR',
          sub3: sub3 || undefined,
        },
      },
    ],
    test_event_code: testEventCode, // важно: на верхнем уровне
  };

  try {
    if (!accessToken) {
      return res.status(200).json({ ok: false, error: 'NO_TOKEN_IN_ENV' });
    }

    const fbResponse = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const fbData = await fbResponse.json();
    return res.status(200).json({ ok: true, fb: fbData });
  } catch (error) {
    return res.status(200).json({ ok: false, error: String(error) });
  }
}
