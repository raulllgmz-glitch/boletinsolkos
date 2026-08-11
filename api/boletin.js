// ============================================================
// api/boletin.js — Vercel Serverless Function (Nivel 3: dato siempre vivo)
// En cada visita: jala Airtable en ese instante y regresa el HTML ya lleno.
// Accesible en /vivo (ver vercel.json) — la ruta "/" ahora sirve la versión
// estática nocturna (Nivel 2) generada por scripts/generate.js.
// ============================================================

const fs = require('fs');
const path = require('path');
const { fetchBoletinData, renderTemplate } = require('../lib/fetchData');

module.exports = async (req, res) => {
  try {
    const token = process.env.AIRTABLE_TOKEN;
    if (!token) {
      res.status(500).send('Falta configurar la variable de entorno AIRTABLE_TOKEN en Vercel.');
      return;
    }

    const { rawCases, sinergiaCases } = await fetchBoletinData(token);
    const todayISO = new Date().toISOString().slice(0, 10);
    const template = fs.readFileSync(path.join(process.cwd(), 'template.html'), 'utf-8');
    const html = renderTemplate(template, { rawCases, sinergiaCases, hoy: todayISO });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send(`Error generando el boletín: ${err.message}`);
  }
};
