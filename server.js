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

// Ruta para manejar el webhook de JIRA
app.post('/webhook', async (req, res) => {
    try {
        // Extraer información de la incidencia
        const issue = req.body.issue;
        const issueKey = issue.key;
        const summary = issue.fields.summary;
        const issueTypeId = issue.fields.issuetype.id; // Tipo de incidencia (ID)

        console.log(`Procesando incidencia: ${issueKey}`);
        console.log(`Resumen: ${summary}`);
        console.log(`Tipo de incidencia: ${issueTypeId}`);

        // Seleccionar el HTML según el tipo de incidencia
        let htmlTemplate;
        switch (issueTypeId) {
            case '1003':
                htmlTemplate = '<h1>Plantilla para tipo 1003</h1>';
                break;
            case '1004':
                htmlTemplate = '<h1>Plantilla para tipo 1004</h1>';
                break;
            default:
                htmlTemplate = '<h1>Plantilla por defecto</h1>';
                break;
        }

        console.log(`Plantilla seleccionada: ${htmlTemplate}`);

        // Generar el PDF aquí (lógica futura)

        res.status(200).send('Webhook procesado correctamente');
    } catch (error) {
        console.error('Error al procesar el webhook:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
