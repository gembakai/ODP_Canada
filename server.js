import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';


// Configurar dotenv para cargar las variables de entorno
dotenv.config();

const app = express();
app.use(express.json()); // Permitir que Express procese JSON en el cuerpo de la solicitud

// Ruta básica de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente.');
});

// Función para convertir HTML a PDF usando Puppeteer
async function convertHTMLToPDF(htmlPath) {
    const browser = await puppeteer.launch({
        executablePath: '/opt/render/.cache/puppeteer/chrome-linux/chrome', // Ruta al navegador descargado
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    });

    const page = await browser.newPage();

    // Cargar el archivo HTML desde el sistema de archivos
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Generar el PDF
    const pdfPath = './output.pdf';
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true, // Incluir fondos y colores en el PDF
    });

    await browser.close();
    return pdfPath;
}


// Ruta para manejar el webhook de JIRA
app.post('/webhook', async (req, res) => {
    try {
        const issue = req.body.issue;
        const issueKey = issue.key;
        const summary = issue.fields.summary;

        console.log(`Procesando incidencia: ${issueKey}`);

        // Datos dinámicos
        const data = {
            Orden: issueKey || 'N/A',
            TituloTrabajo: summary || 'N/A',
            Cliente: 'Cliente desconocido',
            FechaEntrega: 'Fecha no especificada',
        };

        // Generar el contenido del HTML
        const htmlContent = `<!DOCTYPE html>
        <html>
            <head>
                <title>Orden de Producción</title>
            </head>
            <body>
                <h1>Orden: ${data.Orden}</h1>
                <h2>Título del Trabajo: ${data.TituloTrabajo}</h2>
                <p>Cliente: ${data.Cliente}</p>
                <p>Fecha de Entrega: ${data.FechaEntrega}</p>
            </body>
        </html>`;

        // Guardar el HTML en un archivo
        const htmlPath = './output.html';
        fs.writeFileSync(htmlPath, htmlContent);

        console.log(`Archivo HTML generado: ${htmlPath}`);

        // Convertir HTML a PDF
        const pdfPath = await convertHTMLToPDF(htmlPath);
        console.log(`PDF generado: ${pdfPath}`);

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
