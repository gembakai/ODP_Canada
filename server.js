import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';


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
        const data = {
            Orden: issue.key || 'N/A',
            TituloTrabajo: issue.fields.summary || 'N/A',
            Cliente: issue.fields.customfield_12345 || 'Cliente desconocido', // Reemplaza con el campo correcto
            FechaEntrega: issue.fields.duedate || 'Fecha no especificada',
        };

        // HTML proporcionado como plantilla
        const htmlTemplate = `<!DOCTYPE html>
        <html>
            <body>
                <h1>Orden: {{Orden}}</h1>
                <h2>Título del Trabajo: {{TituloTrabajo}}</h2>
                <p>Cliente: {{Cliente}}</p>
                <p>Fecha de Entrega: {{FechaEntrega}}</p>
            </body>
        </html>`;

        const renderedHTML = renderHTMLTemplate(htmlTemplate, data);

        console.log('Generando PDF...');
        const pdfPath = await createPDF(renderedHTML);

        console.log('PDF generado:', pdfPath);
        res.status(200).send('PDF generado y listo para subir a JIRA.');
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
