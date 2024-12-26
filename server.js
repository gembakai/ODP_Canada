import express from 'express';
import dotenv from 'dotenv';

// Configurar dotenv para cargar las variables de entorno
dotenv.config();

const app = express();
app.use(express.json());

// Ruta básica de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente.');
});

// Configuración del puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
