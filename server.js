import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
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
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Orden de producción Gran Formato</title>
        <style>
   /* General */
body {
    margin: 0;
    font-family: Arial, sans-serif;
}

.page {
    width: 21cm; /* Ancho en cm */
    height: 27.94cm; /* Alto en cm */
    display: flex;
    flex-direction: column; /* Organización vertical */
    align-items: center;
    justify-content: flex-start;
    border: 3px solid black;
}

/* Header */
.header {
    display: flex;
    justify-content: space-between; /* Distribución uniforme entre los elementos */
    align-items: center; /* Centra los elementos verticalmente */
    width: 100%; /* Toma todo el ancho disponible */
    padding-bottom: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Sombra opcional */
}

/* Logos */
.LogoPrincipal {
    width: 200px; /* Ancho fijo */
    height: auto; /* Altura proporcional */
    margin-left: 50px;
}

.categoria {
    width: 200px; /* Ancho fijo */
    height: auto; /* Altura proporcional */
}

/* Orden de producción */
.ordendeproduccion {
    display: flex;
    flex-direction: column; /* Organiza el contenido en dos líneas */
    align-items: center; /* Centra el texto */
    justify-content: center;
    font-size: 1.2rem;
    font-weight: bold;
    color: #333; /* Color del texto */
    margin-right: 50px;
}

/* InfoGeneral */
.InfoGeneral {
    display: flex;
    flex-direction: column; /* Organización vertical para las líneas */
    gap: 10px; /* Espaciado entre las líneas */
    width: 100%; /* Toma todo el ancho disponible */
    padding: 30px 50px; /* Espaciado interno */
    box-sizing: border-box; /* Incluye el padding en el ancho total */
    padding-bottom: 30px;
}

/* Líneas dentro de InfoGeneral */
.line1, .line2, .line3, .line4, .line5, .line6 {
    display: flex;
    flex-direction: row; /* Organización en fila */
    justify-content: flex-start; /* Alineación a la izquierda */
    align-items: center; /* Centrado vertical */
    gap: 3px; /* Espaciado entre cada elemento */
}

/* Títulos */
.line1 span:first-child,
.line2 span:first-child,
.line3 span:first-child,
.line4 span:first-child,
.line5 span:first-child,
.line6 span:first-child {
    font-weight: bold; /* Mantén los títulos en negrita */
    margin-right: 10px; /* Espacio entre el título y su subtítulo */
    background-color: rgb(229, 229, 229);
    padding: 5px;
    border-radius: 2px;
    padding-left: 10px;
    padding-right: 10px;
}

/* Subtítulos */
.line1 span:last-child,
.line2 span:last-child,
.line3 span:last-child,
.line4 span:last-child,
.line5 span:last-child,
.line6 span:last-child {
    font-weight: lighter; /* Fuente más ligera */
    color: #666; /* Color más suave */
    padding: 5px;
}

/* Títulos de tablas */
/* Títulos de tablas */
.table-title {
    font-family: Arial, sans-serif;
    font-size: 16px; /* Tamaño de texto */
    font-weight: bold;
    color: rgb(46, 46, 46);
    display: block; /* Asegura que sea un bloque */
    margin-bottom: 10px; /* Espacio entre el título y la tabla */
}


/* General */
.info-table {
    width: 100%; /* Asegura que la tabla ocupe todo el ancho del contenedor */
    border-collapse: collapse; /* Elimina los espacios entre bordes */
    font-family: Arial, sans-serif;
    font-size: 16px; /* Tamaño de texto */
}

/* Bordes y líneas grises */
.info-table tr {
    border-bottom: 1px solid #ddd; /* Línea gris clara debajo de cada fila */
}

.info-table td {
    padding: 8px 12px; /* Espaciado interno en las celdas */
}

/* Primera columna en bold */
.info-table td:first-child {
    font-weight: bold;
    color: #333; /* Color ligeramente más oscuro */
}

/* Alternar color de fondo (opcional) */
.info-table tr:nth-child(even) {
    background-color: #f9f9f9; /* Fondo gris claro para filas pares */
}

/* InfoGeneral2 */
.InfoGeneral2 {
    display: flex; /* Distribución en filas */
    justify-content: space-between; /* Espacio uniforme entre las tablas */
    align-items: flex-start; /* Alinea los elementos al inicio verticalmente */
    width: 100%; /* Asegura que ocupe todo el ancho disponible */
    padding: 0 50px; /* Márgenes laterales (derecha e izquierda) */
    box-sizing: border-box; /* Incluye el padding en el ancho total */
    gap: 20px; /* Espacio entre las tablas */
    padding-bottom: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Sombra opcional */
}


.contacto, .proyecto {
    width: 50%; /* Cada contenedor ocupa el 50% del ancho disponible */
    display: flex;
    flex-direction: column; /* Asegura que el título y la tabla estén en orden vertical */
}

.Cajas-De-Texto {
    display: flex;
    flex-direction: column; /* Organización vertical para las líneas */
    gap: 10px; /* Espaciado entre las líneas */
    width: 100%; /* Toma todo el ancho disponible */
    padding: 30px 50px; /* Espaciado interno */
    box-sizing: border-box; /* Incluye el padding en el ancho total */
    padding-bottom: 30px;
}

.caja1, .caja2 {

    width: 100%; /* Cada contenedor ocupa el 50% del ancho disponible */
    display: flex;
    flex-direction: column; /* Asegura que el título y la tabla estén en orden vertical */

}

.caja{
   color: #333; 
   width: 100%;
   min-height: 100px;
   height: auto;
   border: 1px solid rgb(183, 183, 183);
   border-radius: 10px;
}

.description{
    color: #979797;
    padding-left: 20px;
    padding-right: 20px;
    word-break: break-all;

}

.fecha{
    color: gray;
    align-self: flex-end;
}
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <img
          src="https://static.wixstatic.com/media/49738c_fe030e341cdb4813b8d2b578a70c74cc~mv2.png"
          alt="Logotipo de La Cañada"
          class="LogoPrincipal"
        />

        <img
          src="https://static.wixstatic.com/media/49738c_b7a8d6c919a84bfa9a8b93aafe11249f~mv2.png"
          alt="Gran Formato"
          class="categoria"
        />

        <div class="ordendeproduccion">
          <span>#Orden</span>
          <span>1735N</span>
        </div>
      </div>

      <div class="InfoGeneral">
        <div class="line1">
          <span>Título del Trabajo:</span>
          <span>TRAF-1211-OP 1735N ICEE ROTULACION MESA CARRITO</span>
        </div>
        <div class="line2">
          <span>Cliente:</span>
          <span>ICEE</span>
        </div>
        <div class="line3">
          <span>Requiere Diseño</span>
          <span>No</span>
        </div>
        <div class="line4">
          <span>Reimpresión</span>
          <span>No</span>
        </div>
        <div class="line5">
          <span>Fecha de entrega</span>
          <span>10.01.2025 a las 02:00pm</span>
        </div>
        <div class="line6">
          <span>Prioridad</span>
          <span>Normal</span>
        </div>
      </div>

      <div class="InfoGeneral2">
        <div class="contacto">
          <span class="table-title">Información de contacto</span>
          <table class="info-table">
            <tr>
              <td>Teléfono:</td>
              <td>No especificado</td>
            </tr>
            <tr>
              <td>Tipo de entrega:</td>
              <td>Cliente Recoge</td>
            </tr>
            <tr>
              <td>Contacto:</td>
              <td>No especificado</td>
            </tr>
            <tr>
              <td>Dirección:</td>
              <td>No especificado</td>
            </tr>
          </table>
        </div>
        <div class="proyecto">
          <span class="table-title">Información de proyecto</span>
          <table class="info-table">
            <tr>
              <td>Base:</td>
              <td>131.5cm:</td>
            </tr>
            <tr>
              <td>Altura:</td>
              <td>156cm</td>
            </tr>
            <tr>
              <td>Cantidad:</td>
              <td>1 unidades</td>
            </tr>
            <tr>
              <td>Material:</td>
              <td>Vinil Control Tac 137cm</td>
            </tr>
            <tr>
              <td>Laminación:</td>
              <td>Laminación 8519</td>
            </tr>
            <tr>
              <td>Troquelado:</td>
              <td>Digital</td>
            </tr>
            <tr>
              <td>Acabados:</td>
              <td>Refilado</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="Cajas-De-Texto">
        
        <div class="caja1">
          <span>Indicaciones de entrega</span>
          <div class="caja"><p class="description">No especificado</p></div>
        </div>

         
        <div class="caja2">
          <span>Indicaciones Generales</span>
          <div class="caja"><p class="description">4 IMPRESION EN CONTROL TAC +8519 + PLOTEADOAREA TOTAL
            120X206 CM76X62.5 CM
            ¢110.000 + IVA C/U</p></div>
        </div>

        <span class="fecha">Fecha de ingreso: miércoles 14 de agosto de 2024 a las 03:17:28 p. m.</span>

      </div>
    </div>
  </body>
</html>

        `;

        // Guardar el HTML en un archivo
        const htmlPath = './output.html';
        fs.writeFileSync(htmlPath, htmlContent);

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
