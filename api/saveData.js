export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { collection, data } = req.body;
    
    // Guardar en Vercel KV (base de datos gratuita)
    try {
      // Aquí iría el código para guardar en Vercel KV
      // Por ahora, simulamos que funciona
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error saving data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}