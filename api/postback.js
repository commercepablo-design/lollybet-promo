export default async function handler(req, res) {
  // (опционально) CORS, если понадобится
  // res.setHeader('Access-Control-Allow-Origin', '*');

  const type   = (req.query.type || '').toLowerCase();
  const userid = req.query.userid || '';

  // Поддержка обоих вариантов имен:
  const fbp = req.query.sub1 || req.query.pid || ''; // _fbp
  const fbc = req.query.sub2 || req.query.sid || ''; // _fbc
  const cid = req.query.sub3 || req.query.cid || ''; // click_id → event_id

  const value    = req.query.value || '';
  const currency = req.query.currency || 'EUR';

  const accessToken = process.env.META_ACCESS_TOKEN; // положен в Vercel
  const pixelId = '1532014038042881';
  const testEventCode = 'TEST17997'; // ← включи на время тестов, потом закомментируй

  const eventName =
    type === 'registration' ? 'CompleteRegistration' :
    (type === 'deposit' || type === 'first_deposit' || type === 'repeated_deposit' || type === 'cpa') ? 'Purchase' :
    'CustomEvent';

  const ref = req.headers.referer || `https://${req.headers.host || ''}/`;
  const ua  = req.headers['user-agent'] || '';
  const ip  = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: cid || undefined,                 // важен для дедупа
        action_source: 'website',
        event_source_url: ref,
        user_data: {
          client_ip_address: ip || undefined,
          client_user_agent: ua || undefined,
          external_id: userid ? String(userid) : undefined,
          fbp: fbp || undefined,
          fbc: fbc || undefined,
        },
        custom_data: {
          value: value ? Number(value) : undefined, // для Purchase
          currency: currency || 'EUR',
          click_id: cid || undefined,
          source_sid: fbc || undefined,
          source_pid: fbp || undefined,
        },
      },
    ],
    test_event_code: testEventCode              // ← убери после тестов
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
