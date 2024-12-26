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
app.post('/webhook', (req, res) => {
    console.log('Datos recibidos desde JIRA:', JSON.stringify(req.body, null, 2));
    res.status(200).send('Webhook recibido correctamente');
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
