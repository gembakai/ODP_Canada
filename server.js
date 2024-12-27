import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import moment from 'moment';
import 'moment/locale/es.js';
import pdf from 'html-pdf';

moment.locale('es'); // Configurar a español

// Configurar dotenv para cargar las variables de entorno
dotenv.config();

const app = express();
app.use(express.json());

// Ruta básica de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente.');
});

function formatWithColorsAndHeaders(text) {
    return text
        .split('\n') // Dividir en líneas
        .map((line) => {
            // Reemplazar cualquier encabezado por <h2>
            line = line.replace(
                /^(h[1-6])\. (.*)$/, // Detectar encabezado al inicio de la línea
                '<h2>$2</h2>'
            );

            // Reemplazar `{color:#hex}` por `<span style="color:#hex;">`
            line = line.replace(
                /{color:([^}]+)}/g,
                '<span style="color:$1;">'
            );

            // Reemplazar `{color}` por `</span>`
            line = line.replace(
                /{color}/g,
                '</span>'
            );

            // Eliminar asteriscos alrededor del texto
            line = line.replace(/\*([^*]+)\*/g, '$1');

            return line.trim(); // Devolver la línea procesada
        })
        .join(''); // Unir sin nuevas líneas
}

// Ruta para manejar el webhook de JIRA
app.post('/webhook', async (req, res) => {
    try {
        const issue = req.body.issue;
        const issueKey = issue.key;
        const summary = issue.fields.summary || 'No especificado';
        const cliente = issue.fields.customfield_10083 || 'No especificado';
        const fechaEntrega = issue.fields.customfield_10039
            ? moment(issue.fields.customfield_10039).format("DD [de] MMMM [de] YYYY [a las] hh:mma")
            : 'Fecha no especificada';

        // Generar el contenido del HTML
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <title>Orden ${issueKey}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                p { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>Orden: ${issueKey}</h1>
            <p><strong>Título del Trabajo:</strong> ${summary}</p>
            <p><strong>Cliente:</strong> ${cliente}</p>
            <p><strong>Fecha de Entrega:</strong> ${fechaEntrega}</p>
        </body>
        </html>
        `;

        // Configuración del PDF
        const options = { format: 'A4', border: '10mm' };

        // Generar el PDF
        const pdfPath = `./output_${issueKey}.pdf`;
        pdf.create(htmlContent, options).toFile(pdfPath, async (err, result) => {
            if (err) {
                console.error('Error al generar el PDF:', err);
                return res.status(500).send('Error al generar el PDF');
            }

            console.log(`PDF generado: ${result.filename}`);

            // Subir el PDF a JIRA
            const form = new FormData();
            form.append('file', fs.createReadStream(pdfPath));

            const response = await fetch(
                `https://impresoslacanada.atlassian.net/rest/api/3/issue/${issueKey}/attachments`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `jira.la.canada@gmail.com:${process.env.JIRA_TOKEN}`
                        ).toString('base64')}`,
                        Accept: 'application/json',
                        'X-Atlassian-Token': 'no-check',
                        ...form.getHeaders(),
                    },
                    body: form,
                }
            );

            if (response.ok) {
                console.log(`Archivo PDF subido exitosamente a la incidencia ${issueKey}`);
                fs.unlinkSync(pdfPath); // Elimina el archivo local después de subirlo
                res.status(200).send('Archivo PDF generado y subido a JIRA correctamente');
            } else {
                const errorData = await response.text();
                console.error('Error al subir el archivo PDF a JIRA:', errorData);
                res.status(500).send('Error al subir el archivo PDF a JIRA');
            }
        });
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
