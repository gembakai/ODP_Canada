import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import moment from 'moment';
import 'moment/locale/es.js';
moment.locale('es'); // Configurar a español
import PdfPrinter from 'pdfmake';
import path from 'path';

import { fileURLToPath } from 'url';


// Crear __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Configurar dotenv para cargar las variables de entorno
dotenv.config();

const app = express();
app.use(express.json());

// Fuentes para pdfmake
const fonts = {
  Roboto: {
      normal: path.join(__dirname, 'fonts/Roboto-Regular.ttf'),
      bold: path.join(__dirname, 'fonts/Roboto-Bold.ttf'),
      italics: path.join(__dirname, 'fonts/Roboto-Italic.ttf'),
      bolditalics: path.join(__dirname, 'fonts/Roboto-BoldItalic.ttf'),
  },
};

const printer = new PdfPrinter(fonts);

function formatWithColorsAndHeaders(text) {
    return text
        .split('\n')
        .map((line) => line.replace(/^(h[1-6])\. (.*)$/, '$2'))
        .join('\n');
}

// Ruta para manejar el webhook de JIRA
app.post('/webhook', async (req, res) => {
    try {
        const issue = req.body.issue;
        const issueKey = issue.key;
        const summary = issue.fields.summary || 'No especificado';
        const cliente = issue.fields.customfield_10083 || 'No especificado';
        const prioridad = issue.fields.priority.name || 'No especificado';
        const fechaEntrega = issue.fields.customfield_10039
            ? moment(issue.fields.customfield_10039).format("DD [de] MMMM [de] YYYY [a las] hh:mma")
            : 'Fecha no especificada';
        const indicacionesGenerales = formatWithColorsAndHeaders(issue.fields.customfield_10056 || 'No especificado');

        // Crear contenido del PDF
        const docDefinition = {
            content: [
                { text: `Orden: ${issueKey}`, style: 'header' },
                { text: `Título del Trabajo: ${summary}`, style: 'subheader' },
                { text: `Cliente: ${cliente}`, style: 'body' },
                { text: `Prioridad: ${prioridad}`, style: 'body' },
                { text: `Fecha de Entrega: ${fechaEntrega}`, style: 'body' },
                { text: `Indicaciones Generales:`, style: 'body' },
                { text: indicacionesGenerales, style: 'body' },
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                },
                subheader: {
                    fontSize: 15,
                    bold: true,
                },
                body: {
                    fontSize: 12,
                },
            },
        };

        // Generar el PDF
        const pdfPath = `./output_${issueKey}.pdf`;
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(fs.createWriteStream(pdfPath));
        pdfDoc.end();

        console.log(`PDF generado: ${pdfPath}`);

        // Subir el PDF a JIRA
        const form = new FormData();
        form.append('file', fs.createReadStream(pdfPath));

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
            fs.unlinkSync(pdfPath); // Elimina el archivo local después de subirlo
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

// Configuración del puertos
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
