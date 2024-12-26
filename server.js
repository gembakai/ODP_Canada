import { chromium } from 'playwright';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import express from 'express';
import dotenv from 'dotenv';

// Configurar dotenv para cargar las variables de entorno
dotenv.config();

const app = express();
app.use(express.json()); // Permitir que Express procese JSON en el cuerpo de la solicitud

// Ruta básica de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente.');
});

// Función para convertir HTML a PDF usando Puppeteer
sync function generatePDFWithPlaywright(htmlContent) {
    const browser = await chromium.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    });
    const page = await browser.newPage();

    // Establecer el contenido del HTML
    await page.setContent(htmlContent);

    // Generar el PDF
    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();

    // Guardar el PDF como archivo
    const pdfPath = './output.pdf';
    fs.writeFileSync(pdfPath, pdfBuffer);

    return pdfPath;
}


app.post('/webhook', async (req, res) => {
    try {
        const issue = req.body.issue;
        const issueKey = issue.key;
        const summary = issue.fields.summary;

        console.log(`Procesando incidencia: ${issueKey}`);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Orden de Producción</title>
            </head>
            <body>
                <h1>Orden: ${issueKey}</h1>
                <h2>Título del Trabajo: ${summary}</h2>
                <p>Detalles adicionales...</p>
            </body>
            </html>
        `;

        // Generar el PDF
        const pdfPath = await generatePDFWithPlaywright(htmlContent);
        console.log(`PDF generado: ${pdfPath}`);

        // Subir el archivo PDF a JIRA
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
            console.log(`PDF subido exitosamente a la incidencia ${issueKey}`);
            res.status(200).send('PDF generado y subido a JIRA correctamente');
        } else {
            const errorData = await response.text();
            console.error('Error al subir el PDF a JIRA:', errorData);
            res.status(500).send('Error al subir el PDF a JIRA');
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
