# Boletín Solkos — Alpura (Nivel 3, dato siempre vivo)

Carpeta limpia, solo con lo necesario. Cada vez que alguien abre la URL,
la función jala Airtable en ese instante y regresa el boletín ya lleno.

## Archivos

- `template.html` — el diseño del boletín, con marcadores para los datos.
- `lib/fetchData.js` — lee Airtable (tabla BOLETIN SOLKOS + PROBLEMAS DE VOLTAJE) y arma los datos.
- `api/boletin.js` — la función serverless que junta todo y regresa el HTML.
- `vercel.json` — hace que la raíz `/` sirva directo esta función.
- `package.json` — configuración mínima (sin dependencias externas).

## Cómo desplegarlo

1. **Crea un repositorio nuevo en GitHub** (github.com/new) — vacío, sin README.
2. **Sube estos 5 archivos/carpetas tal cual** (arrastrando desde tu explorador
   de archivos a la página de "uploading an existing file"). No hay ninguna
   carpeta oculta esta vez — todo debería subir sin problema.
3. **En Vercel:** Add New → Project → **Import Git Repository** → selecciona
   este repo (no uses Drop esta vez, así la URL queda fija).
4. Antes de darle Deploy, agrega las **Environment Variables**:
   - `AIRTABLE_TOKEN` → tu token de Airtable
   - `AIRTABLE_BASE_ID` → `appnQkNxUpEfQKSz0`
5. Dale **Deploy**. Abre la URL que te da — deberías ver el boletín directo,
   con los datos actuales de tu base.

## Después de hoy

Como quedó conectado por Git, cualquier cambio futuro (yo actualizándote un
archivo, o tú editando algo directo en GitHub) se despliega solo, en la
misma URL — no hay que repetir el proceso desde cero.
