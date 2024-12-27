import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import moment from 'moment';
import puppeteer from 'puppeteer';

import 'moment/locale/es.js';
moment.locale('es'); // Configurar a español

// Configurar dotenv para cargar las variables de entorno
dotenv.config();

const app = express();
app.use(express.json()); // Permitir que Express procese JSON en el cuerpo de la solicitud

// Ruta básica de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente.');
});

function formatWithColorsAndHeaders(text) {
  return text
    .split('\n') // Dividir en líneas
    .map((line) => {
      // Reemplazar cualquier encabezado por <h2>
      line = line.replace(/^(h[1-6])\. (.*)$/, '<h2>$2</h2>');
      line = line.replace(/{color:([^}]+)}/g, '<span style="color:$1;">');
      line = line.replace(/{color}/g, '</span>');
      line = line.replace(/\*([^*]+)\*/g, '$1');
      return line.trim(); // Devolver la línea procesada
    })
    .join(''); // Unir sin nuevas líneas
}

async function convertHTMLToPDF(htmlContent, outputPath) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Establecer el contenido HTML
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

  // Generar el PDF
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true, // Incluir fondos y colores
  });

  await browser.close();
}

app.post('/webhook', async (req, res) => {
  try {
    const issue = req.body.issue;
    const issueKey = issue.key;
    const summary = issue.fields.summary;

    // Otros campos dinámicos...
    const cliente = issue.fields.customfield_10083 || 'No especificado';
    const FechaEntrega = issue.fields.customfield_10039
      ? moment(issue.fields.customfield_10039).format("DD [de] MMMM [de] YYYY [a las] hh:mma")
      : 'Fecha no especificada';

    const indicacionesgeneralesRaw = issue.fields.customfield_10056 || 'No especificado';
    const indicacionesgenerales = formatWithColorsAndHeaders(indicacionesgeneralesRaw);

    console.log(`Procesando incidencia: ${issueKey}`);

    // Datos dinámicos para el HTML
    const data = {
      Clave: issueKey || 'N/A',
      TituloTrabajo: summary || 'N/A',
      Cliente: cliente,
      IndicacionesGenerales: indicacionesgenerales,
      FechaEntrega: FechaEntrega,
    };

    // Generar el contenido del HTML
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>Orden de Producción</title>
        </head>
        <body>
          <h1>${data.TituloTrabajo}</h1>
          <p>Cliente: ${data.Cliente}</p>
          <p>Fecha de Entrega: ${data.FechaEntrega}</p>
          <p>Indicaciones Generales:</p>
          <div>${data.IndicacionesGenerales}</div>
        </body>
        </html>
        `;

    // Ruta del archivo PDF
    const pdfPath = `./${issueKey}.pdf`;

    // Convertir el HTML a PDF
    await convertHTMLToPDF(htmlContent, pdfPath);
    console.log(`Archivo PDF generado: ${pdfPath}`);

    // Crear el formulario para enviar el archivo PDF
    const form = new FormData();
    form.append('file', fs.createReadStream(pdfPath));

    // Subir el archivo PDF a JIRA
    const response = await fetch(`https://impresoslacanada.atlassian.net/rest/api/3/issue/${issueKey}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`jira.la.canada@gmail.com:${process.env.JIRA_TOKEN}`).toString('base64')}`,
        Accept: 'application/json',
        'X-Atlassian-Token': 'no-check',
        ...form.getHeaders(),
      },
      body: form,
    });

    if (response.ok) {
      console.log(`Archivo PDF subido exitosamente a la incidencia ${issueKey}`);

      // Eliminar el archivo PDF local después de subirlo
      fs.unlinkSync(pdfPath);

      res.status(200).send('Archivo PDF generado y subido a JIRA correctamente');
    } else {
      const errorData = await response.text();
      console.error('Error al subir el archivo PDF a JIRA:', errorData);
      res.status(500).send('Error al subir el archivo PDF a JIRA');
    }

  } catch (error) {
    console.error('Error al procesar el webhook:', error);
    res.status(500).send('Error interno al procesar la solicitud');
  }
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
