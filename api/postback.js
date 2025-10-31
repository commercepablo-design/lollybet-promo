// api/postback.js
export default async function handler(req, res) {
  try {
    const {
      type = '',
      payout = '',
      currency = 'EUR',
      sub1 = '',   // _fbp
      sub2 = '',   // _fbc
      sub3 = '',   // eventID (дедуп с веб-ивентом)
      userid = '',
      rs = '',
      ngr = '',
      date = ''
    } = req.query;

    // map типов партнёрки -> события Meta
    let event_name = 'CustomEvent';
    let value = null;
    switch ((type || '').toLowerCase()) {
      case 'registration':
        event_name = 'CompleteRegistration'; break;
      case 'firstdeposit':
      case 'repeateddeposit':
      case 'cpa':
        event_name = 'Purchase'; value = Number(payout) || null; break;
      case 'ngr':
      case 'rs':
      case 'ngrandrs':
        event_name = 'Purchase'; value = Number(ngr || rs) || null; break;
      default:
        event_name = 'CustomEvent';
    }

    const payload = {
      data: [{
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: sub3 || undefined,          // дедуп с веб-событием SpinLB
        action_source: 'website',
        user_data: { fbp: sub1 || undefined, fbc: sub2 || undefined },
        custom_data: {
          value: (value || undefined),
          currency,
          content_ids: userid ? [String(userid)] : undefined,
          content_type: 'product'
        }
      }],
      // test_event_code: 'PASTE_TEST_CODE_HERE' // включишь на время проверки
    };

    const PIXEL_ID = '1532014038042881';
    const TOKEN = process.env.META_ACCESS_TOKEN; // задай в Vercel → Env

    const r = await fetch(`https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${TOKEN}`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const fb = await r.json();

    // Отдаём 200 всегда, чтобы партнёрка засчитала доставку
    res.status(200).json({ ok: true, fb });
  } catch (e) {
    console.error('postback error', e);
    res.status(200).send('ok');
  }
}
