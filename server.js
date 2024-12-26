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

        // Crear el formulario para enviar el archivo
        const form = new FormData();
        form.append('file', fs.createReadStream(htmlPath));

        // Subir el archivo a JIRA
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
            console.log(`Archivo HTML subido exitosamente a la incidencia ${issueKey}`);
            res.status(200).send('Archivo HTML generado y subido a JIRA correctamente');
        } else {
            const errorData = await response.text();
            console.error('Error al subir el archivo HTML a JIRA:', errorData);
            res.status(500).send('Error al subir el archivo HTML a JIRA');
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
