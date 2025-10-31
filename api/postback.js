// api/postback.js
export default async function handler(req, res) {
  try {
    const {
      type = '',
      payout = '',
      currency = 'EUR',
      sub1 = '',   // _fbp
      sub2 = '',   // _fbc
      sub3 = '',   // event_id
      userid = '',
      rs = '',
      ngr = ''
    } = req.query;

    // Берём IP и User-Agent из запроса (Meta требует хотя бы это)
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';
    const ref = req.headers['referer'] || `https://${req.headers.host || ''}/`;

    let event_name = 'CustomEvent';
    let value = null;

    switch (String(type).toLowerCase()) {
      case 'registration': event_name = 'CompleteRegistration'; break;
      case 'firstdeposit':
      case 'repeateddeposit':
      case 'cpa': event_name = 'Purchase'; value = Number(payout) || null; break;
      case 'ngr':
      case 'rs':
      case 'ngrandrs': event_name = 'Purchase'; value = Number(ngr || rs) || null; break;
    }

    const payload = {
      data: [{
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: sub3 || undefined,
        action_source: 'website',
        event_source_url: ref,
        user_data: {
          fbp: sub1 || undefined,
          fbc: sub2 || undefined,
          client_ip_address: ip || undefined,
          client_user_agent: ua || undefined,
          external_id: userid ? String(userid) : undefined
        },
        custom_data: {
          value: value || undefined,
          currency,
          content_ids: userid ? [String(userid)] : undefined,
          content_type: 'product'
        }
      }],
      // test_event_code: 'ТВОЙ_ТЕСТОВЫЙ_КОД' // если тестируешь в Events Manager
    };

    const PIXEL_ID = '1532014038042881';
    const TOKEN = process.env.META_ACCESS_TOKEN;

    const r = await fetch(`https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const fb = await r.json();
    return res.status(200).json({ ok: true, fb });

  } catch (e) {
    console.error('postback error', e);
    return res.status(200).send('ok');
  }
}
