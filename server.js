import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import moment from 'moment';
import path from 'path';
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

// Función para cargar una plantilla HTML según el tipo de incidencia
function loadTemplate(issueTypeId) {
  // Mapeo de ID de tipo de incidencia a nombres de archivo
  const templateMap = {
      10005: 'Template-GranFormato.html',
      // Agrega otros IDs y archivos aquí según sea necesario
      // 10006: 'OtroTemplate.html',
  };

  const templateName = templateMap[issueTypeId];
  if (!templateName) {
      throw new Error(`No hay plantilla configurada para el tipo de incidencia ID: ${issueTypeId}`);
  }

  const templatePath = path.join(__dirname, 'templates', templateName);
  if (!fs.existsSync(templatePath)) {
      throw new Error(`No se encontró el archivo de plantilla en la ruta: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf-8');
}


// Función para reemplazar valores dinámicos en la plantilla
function populateTemplate(template, data) {
    return template.replace(/{{(\w+)}}/g, (placeholder, key) => {
        return data[key] || 'Información no disponible';
    });
}

// Ruta para manejar el webhook de JIRA
app.post('/webhook', async (req, res) => {
    try {
        const issue = req.body.issue;
        const issueKey = issue.key;

        // Validar que la solicitud tenga datos del issue
        if (!issue || !issue.fields || !issue.fields.issuetype || !issue.fields.issuetype.id) {
            throw new Error('Datos de issue incompletos en el webhook.');
        }

        const issueTypeId = issue.fields.issuetype.id;

        // Cargar la plantilla correspondiente
        const htmlTemplate = loadTemplate(issueTypeId);

        // Datos dinámicos
        const data = {
            Clave: issueKey || 'N/A',
            TituloTrabajo: issue.fields.summary || 'N/A',
            Cliente: issue.fields.customfield_10083 || 'No especificado',
            Prioridad: issue.fields.priority?.name || 'No especificada',
            Telefono: issue.fields.customfield_10034 || 'No especificado',
            Entrega: issue.fields.customfield_10036?.value || 'No especificado',
            IndicacionesGenerales: issue.fields.customfield_10056 || 'No especificado',
            FechaEntrega: issue.fields.customfield_10039
                ? moment(issue.fields.customfield_10039).format("DD [de] MMMM [de] YYYY [a las] hh:mma")
                : 'Fecha no especificada',
            NumeroOrden: issue.fields.customfield_10084 || 'No especificado',
            Contacto: issue.fields.customfield_10035 || 'No especificado',
            Direccion: issue.fields.customfield_10037 || 'No especificado',
            InstruccionesDeEntrega: issue.fields.customfield_10038 || 'No especificado',
            Base: issue.fields.customfield_10049 || 'No especificado',
            Altura: issue.fields.customfield_10050 || 'No especificado',
            Cantidad: issue.fields.customfield_10051 || 'No especificado',
            Material: issue.fields.customfield_10052?.child?.value || 'No especificado',
            Ingreso: issue.fields.customfield_10040 || 'No especificado',
            RequiereDiseno: issue.fields.customfield_10089?.value || 'No especificado',
            Reimpresion: issue.fields.customfield_10090?.value || 'No especificado',
            Laminacion: issue.fields.customfield_10090?.value || 'No especificado',
            Troquelado: issue.fields.customfield_10053?.value || 'No especificado',
            Acabados: issue.fields.customfield_10054?.value || 'No especificado',
        };

        // Personalizar la plantilla con los datos de la incidencia
        const customHtml = populateTemplate(htmlTemplate, data);

        // Guardar el HTML en un archivo
        const htmlPath = path.join(__dirname, `${data.Clave}_${data.TituloTrabajo}.html`);
        fs.writeFileSync(htmlPath, customHtml);

        console.log(`Archivo HTML generado: ${htmlPath}`);

        // Crear el formulario para enviar el archivo HTML
        const form = new FormData();
        form.append('file', fs.createReadStream(htmlPath));

        // Subir el archivo HTML a JIRA
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
