// ============================================================
// lib/fetchData.js — lógica compartida de Airtable → datos del boletín
// La usan api/boletin.js (Nivel 3, en vivo) y scripts/generate.js (Nivel 2, nocturno)
// ============================================================

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appnQkNxUpEfQKSz0';
const TABLE_SERVICIOS = 'BOLETIN SOLKOS';
const TABLE_VOLTAJE = 'PROBLEMAS DE VOLTAJE';
const HOY_CUTOFF = '2026-07-01'; // ajusta o quita si ya no necesitas el corte de julio

const DICTAMEN_MAP = {
  'CLIENTE': 'cliente',
  'GARANTÍA': 'garantia',
  'NO EFECTIVO': 'noefectivo',
  'IMPRODUCTIVO': 'improductivo',
};

async function airtableFetch(token, table) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;
  const records = [];
  let offset;
  do {
    const res = await fetch(offset ? `${url}?offset=${offset}` : url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Airtable ${table} error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

function normalizeFormulaDate(v) {
  // Confirmado contra datos reales: el campo regresa "DD/MM/AA" (ej. "30/07/26" = 30 jul 2026)
  if (!v || typeof v !== 'string') return null;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, yy] = m;
  return `20${yy}-${mm}-${dd}`;
}

async function fetchBoletinData(token) {
  if (!token) throw new Error('Falta AIRTABLE_TOKEN');

  const servicios = await airtableFetch(token, TABLE_SERVICIOS);
  const voltaje = await airtableFetch(token, TABLE_VOLTAJE);

  const contactBySerie = {};
  voltaje.forEach(r => {
    const f = r.fields;
    if (f.SERIE) contactBySerie[f.SERIE] = { contacto: f.CONTACTO || null, tel: f.TELEFONO || null };
  });

  const rawCases = [];
  const sinergiaCases = [];

  servicios.forEach(r => {
    const f = r.fields;
    const dictamenRaw = f['DICTAMEN'] || '';
    const serie = f['SERIE1'] || '';
    const creado = f['date_created'] || null;
    if (!creado || creado < HOY_CUTOFF) return;

    if (dictamenRaw === 'SINERGÍA CLIENTE') {
      const contact = contactBySerie[serie] || {};
      sinergiaCases.push({
        serie,
        falla: f['FALLA ENCONTRADA POR TELEMETRÍA'] || '',
        estado: f['ESTADO'] || '',
        modalidad: (f['MODALIDAD SERVICIO'] || '').toLowerCase().includes('mayor') ? 'mayor' : 'menor',
        establecimiento: f['UBICACIONES'] || '',
        direccion: [f['CALLE1'], f['COL1'], f['CIUDAD1'], f['CP1'], f['ESTADO']].filter(Boolean).join(', '),
        contacto: contact.contacto || null,
        tel: contact.tel || null,
      });
      return;
    }

    const cierre = normalizeFormulaDate(f['date_close']);
    const dictamen = dictamenRaw ? (DICTAMEN_MAP[dictamenRaw] || 'proceso') : 'proceso';
    const modalidadRaw = (f['MODALIDAD SERVICIO'] || '').toLowerCase();

    rawCases.push({
      serie,
      os: f['OS'] || null,
      dictamen,
      label: dictamenRaw || 'En diagnóstico',
      falla: f['FALLA ENCONTRADA POR TELEMETRÍA'] || '',
      detail: f['ACTIVIDAD REALIZADA'] || '',
      creado,
      cierre,
      modalidad: modalidadRaw.includes('mayor') ? 'mayor' : 'menor',
      costo: typeof f['SUBTOTAL_SRV_PRECIO'] === 'number' ? f['SUBTOTAL_SRV_PRECIO'] : null,
    });
  });

  rawCases.sort((a, b) => (a.creado < b.creado ? -1 : 1));

  return { rawCases, sinergiaCases };
}

function renderTemplate(templateHtml, { rawCases, sinergiaCases, hoy }) {
  return templateHtml
    .replace('__HOY__', hoy)
    .replace('__RAW_CASES__', JSON.stringify(rawCases))
    .replace('__SINERGIA_CASES__', JSON.stringify(sinergiaCases));
}

module.exports = { fetchBoletinData, renderTemplate };
