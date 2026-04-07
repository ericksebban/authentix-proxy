// api/timestamp.js
// Proxy OpenTimestamps pour Authentix

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hash } = req.body;

    if (!hash || hash.length !== 64) {
      return res.status(400).json({ error: 'Hash invalide' });
    }

    const hashBytes = Buffer.from(hash, 'hex');

    const CALENDRIERS = [
      'https://a.pool.opentimestamps.org/digest',
      'https://b.pool.opentimestamps.org/digest',
      'https://alice.btc.calendar.opentimestamps.org/digest',
    ];

    for (const url of CALENDRIERS) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Accept': 'application/octet-stream',
          },
          body: hashBytes,
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const bytes = Buffer.from(buffer);

          if (bytes.length > 50) {
            return res.status(200).json({
              ok: true,
              receipt: bytes.toString('base64'),
              server: url,
              size: bytes.length,
            });
          }
        }
      } catch (e) {
        console.warn('OTS', url, e.message);
      }
    }

    return res.status(502).json({ ok: false, error: 'Serveurs indisponibles' });

  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
