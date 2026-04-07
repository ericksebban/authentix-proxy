// api/timestamp.js
// Proxy OpenTimestamps pour Authentix
// Hébergé sur Vercel — gratuit, sans limite pour nos volumes

export default async function handler(req, res) {
  // Autoriser les requêtes depuis GitHub Pages et ton domaine
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Répondre aux preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hash } = req.body;

    if (!hash || hash.length !== 64) {
      return res.status(400).json({ error: 'Hash SHA-256 invalide (64 caractères hex requis)' });
    }

    // Convertir le hash hex en bytes binaires
    const hashBytes = Buffer.from(hash, 'hex');

    // Serveurs de calendrier OpenTimestamps — essayés dans l'ordre
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

        console.log(`OTS ${url} → HTTP ${response.status}`);

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const bytes = Buffer.from(buffer);

          if (bytes.length > 50) {
            // Retourner le reçu en base64
            return res.status(200).json({
              ok: true,
              receipt: bytes.toString('base64'),
              server: url,
              size: bytes.length,
            });
          }
        }
      } catch (e) {
        console.warn(`OTS ${url} → ${e.message}`);
      }
    }

    return res.status(502).json({
      ok: false,
      error: 'Tous les serveurs OpenTimestamps sont indisponibles',
    });

  } catch (e) {
    console.error('Erreur proxy:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
