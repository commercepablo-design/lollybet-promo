export default async function handler(req, res) {
  const { type, userid, sub1, sub2, sub3, value, currency } = req.query;

  const accessToken = process.env.FB_ACCESS_TOKEN;
  const pixelId = '1532014038042881'; // твой Pixel ID
  const testEventCode = 'TEST57641';  // твой тест-код из Meta

  const eventName =
    type === 'registration' ? 'CompleteRegistration' :
    type === 'deposit' ? 'Purchase' :
    type === 'first_deposit' ? 'InitialDeposit' :
    type === 'repeated_deposit' ? 'RepeatedDeposit' :
    'CustomEvent';

  const ref = req.headers.referer || '';
  const ua = req.headers['user-agent'] || '';
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    '';

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: ref || 'https://lollybet-promo.vercel.app/',
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
    test_event_code: testEventCode, // Важно: test_event_code на верхнем уровне
  };

  try {
    const fbResponse = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const fbData = await fbResponse.json();
    res.status(200).json({ ok: true, fb: fbData });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
