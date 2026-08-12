// ============================================================
// api/voltaje.js — Vercel Serverless Function
// Sirve la página de "Problemas de Voltaje" en /voltaje, jalando
// la tabla PROBLEMAS DE VOLTAJE de Airtable en cada visita.
// ============================================================

const fs = require('fs');
const path = require('path');
const { fetchVoltajeData, renderVoltajeTemplate } = require('../lib/fetchData');

module.exports = async (req, res) => {
  try {
    const token = process.env.AIRTABLE_TOKEN;
    if (!token) {
      res.status(500).send('Falta configurar la variable de entorno AIRTABLE_TOKEN en Vercel.');
      return;
    }

    const { puntos } = await fetchVoltajeData(token);
    const todayISO = new Date().toISOString().slice(0, 10);
    const template = fs.readFileSync(path.join(process.cwd(), 'template-voltaje.html'), 'utf-8');
    const html = renderVoltajeTemplate(template, { puntos, hoy: todayISO });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).send(`Error generando la página de voltaje: ${err.message}`);
  }
};
