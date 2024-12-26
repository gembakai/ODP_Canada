import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import FormData from 'form-data';
import fetch from 'node-fetch';


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


async function createPDF(html) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // Tamaño A4 en puntos

    // Convertir HTML a texto plano para este ejemplo
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText(html, {
        x: 50,
        y: page.getHeight() - 50,
        size: 12,
        font,
        color: rgb(0, 0, 0),
        lineHeight: 14,
        maxWidth: 500,
    });

    const pdfBytes = await pdfDoc.save();
    const filePath = `./output.pdf`;
    fs.writeFileSync(filePath, pdfBytes);
    return filePath;
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
            Cliente: 'Cliente desconocido', // Agregar lógica para obtener esto si es necesario
            FechaEntrega: 'Fecha no especificada', // Agregar lógica si aplica
        };

        // Generar HTML y PDF
        const htmlTemplate = `<html><body><h1>Orden: {{Orden}}</h1><h2>Título del Trabajo: {{TituloTrabajo}}</h2></body></html>`;
        const renderedHTML = renderHTMLTemplate(htmlTemplate, data);
        const pdfPath = await createPDF(renderedHTML);

        console.log(`PDF generado: ${pdfPath}`);

        // Crear el formulario para enviar el archivo
        const form = new FormData();
        form.append('file', fs.createReadStream(pdfPath));

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
