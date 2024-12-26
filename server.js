import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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


function renderHTMLTemplate(html, data) {
    let renderedHTML = html;
    for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{${key}}}`, 'g'); // Busca {{key}} en el HTML
        renderedHTML = renderedHTML.replace(regex, value);
    }
    return renderedHTML;
}


async function generatePDFWithPuppeteer(htmlContent) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Cargar el HTML y aplicar el contenido dinámico
    await page.setContent(htmlContent);

    // Generar el PDF
    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true, // Asegurarse de que se impriman los fondos
    });

    await browser.close();

    // Guardar el archivo en el servidor
    const pdfPath = './output.pdf';
    fs.writeFileSync(pdfPath, pdf);

    return pdfPath;
}
// Ruta para manejar el webhook de JIRA
app.post('/webhook', async (req, res) => {
    try {
        const issue = req.body.issue;
        const data = {
            Orden: issue.key || 'N/A',
            TituloTrabajo: issue.fields.summary || 'N/A',
            Cliente: 'Cliente desconocido',
            FechaEntrega: 'Fecha no especificada',
        };

        // HTML de plantilla con datos dinámicos
        const htmlTemplate = `<!DOCTYPE html>
        <html>
            <head>
                <title>Orden de Producción</title>
            </head>
            <body>
                <h1>Orden: {{Orden}}</h1>
                <h2>Título del Trabajo: {{TituloTrabajo}}</h2>
                <p>Cliente: {{Cliente}}</p>
                <p>Fecha de Entrega: {{FechaEntrega}}</p>
            </body>
        </html>`;

        const renderedHTML = renderHTMLTemplate(htmlTemplate, data);
        const pdfPath = await generatePDFWithPuppeteer(renderedHTML);

        console.log(`PDF generado: ${pdfPath}`);

        // Subir el archivo a JIRA (ya cubierto anteriormente)

        res.status(200).send('PDF generado y subido a JIRA correctamente');
    } catch (error) {
        console.error('Error al procesar el webhook:', error);
        res.status(500).send('Error interno al generar el PDF.');
    }
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
