import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import moment from 'moment';
import 'moment/locale/es.js';
import pdf from 'html-pdf';

moment.locale('es'); // Configurar a español

// Configurar dotenv para cargar las variables de entorno
dotenv.config();

const app = express();
app.use(express.json());

// Ruta básica de prueba
app.get('/', (req, res) => {
    res.send('Servidor funcionando correctamente.');
});

function formatWithColorsAndHeaders(text) {
    return text
        .split('\n') // Dividir en líneas
        .map((line) => {
            // Reemplazar cualquier encabezado por <h2>
            line = line.replace(
                /^(h[1-6])\. (.*)$/, // Detectar encabezado al inicio de la línea
                '<h2>$2</h2>'
            );

            // Reemplazar `{color:#hex}` por `<span style="color:#hex;">`
            line = line.replace(
                /{color:([^}]+)}/g,
                '<span style="color:$1;">'
            );

            // Reemplazar `{color}` por `</span>`
            line = line.replace(
                /{color}/g,
                '</span>'
            );

            // Eliminar asteriscos alrededor del texto
            line = line.replace(/\*([^*]+)\*/g, '$1');

            return line.trim(); // Devolver la línea procesada
        })
        .join(''); // Unir sin nuevas líneas
}

// Ruta para manejar el webhook de JIRA
app.post('/webhook', async (req, res) => {
    try {
        const issue = req.body.issue;
                const issueKey = issue.key;
                const summary = issue.fields.summary;
                const cliente = issue.fields.customfield_10083 || 'No especificado';
                const prioridad = issue.fields.priority.name;
                const telefono = issue.fields.customfield_10034 || 'No especificado';
                const entrega = issue.fields.customfield_10036.value || 'No especificado';
                const indicacionesgeneralesRaw = issue.fields.customfield_10056 || 'No especificado';
                const indicacionesgenerales = formatWithColorsAndHeaders(indicacionesgeneralesRaw);
                const FechaEntrega = issue.fields.customfield_10039
                    ? moment(issue.fields.customfield_10039).format("DD [de] MMMM [de] YYYY [a las] hh:mma")
                    : 'Fecha no especificada';
        
                const orden = issue.fields.customfield_10084 || 'No especificado';
                const contacto = issue.fields.customfield_10035 || 'No especificado';
                const direccion = issue.fields.customfield_10037 || 'No especificado';
                const instruccionesdeentrega = issue.fields.customfield_10038 || 'No especificado';
                const base = issue.fields.customfield_10049 || 'No especificado';
                const altura = issue.fields.customfield_10050 || 'No especificado';
                const cantidad = issue.fields.customfield_10051 || 'No especificado';
                const material = issue.fields.customfield_10052.child.value || 'No especificado';
                const ingreso = issue.fields.customfield_10040 || 'No especificado';
                const diseno = issue.fields.customfield_10089.value || 'No especificado';
                const reimresion = issue.fields.customfield_10090.value || 'No especificado';
                const laminacion = issue.fields.customfield_10090.value || 'No especificado';
                const troquelado = issue.fields.customfield_10053.value || 'No especificado';
                const acabados = issue.fields.customfield_10054.value || 'No especificado';



          // Datos dinámicos
          const data = {
            Clave: issueKey || 'N/A',
            TituloTrabajo: summary || 'N/A',
            Cliente: cliente,
            Prioridad: prioridad,
            Telefono: telefono,
            Entrega: entrega,
            IndicacionesGenerales: indicacionesgenerales,
            FechaEntrega: FechaEntrega,
            NumeroOrden: orden,
            Contacto: contacto,
            Direccion: direccion,
            InstruccionesDeEntrega: instruccionesdeentrega,
            Base: base,
            Altura: altura,
            Cantidad: cantidad,
            Material: material,
            Ingreso: ingreso,
            RequiereDiseno: diseno,
            Reimpresion: reimresion,
            Laminacion: laminacion,
            Troquelado: troquelado,
            Acabados: acabados
        };

        // Generar el contenido del HTML
        const htmlContent = `
        <!DOCTYPE html>
<html lang="es">
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
    flex-wrap: nowrap;
}

/* Header */
.header {

    display: flex;
    justify-content: space-between; /* Distribución uniforme entre los elementos */
    align-items: center; /* Centra los elementos verticalmente */
    width: 21cm; /* Toma todo el ancho disponible */
    height: 2cm;
    padding-bottom: 10px;
    border-bottom: 1px solid gray;
}

/* Logos */
.LogoPrincipal {
    width: 5cm;
    height: auto;
    margin-left: 1cm;
    border: 1px solid red; /* Ayuda a visualizar el contenedor durante el desarrollo */
}

.categoria {
    width: 5cm;
    height: auto; /* Altura proporcional */
    border: 1px solid red;

}


.ordendeproduccion {
    display: flex;
    flex-direction: column; /* Organiza el contenido en dos líneas */
    align-items: center; /* Centra el texto */
    justify-content: center;
    font-size: 1.2rem;
    font-weight: bold;
    color: #333; /* Color del texto */
    margin-right: 1cm;
    border: 1px solid red;
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
          src="https://static.wixstatic.com/media/49738c_1dd6b8fc3d394a03a0accae10af48acc~mv2.png"
          alt="Gran Formato"
          class="categoria"
        />

        <div class="ordendeproduccion">
          <span>#Orden</span>
          <span>1735N</span>
        </div>
      </div>

    </div>
  </body>
</html>


        `;

        // Configuración del PDF
        const options = {
            // format: 'Letter', // Esto será sobrescrito por las dimensiones personalizadas
            width: '45cm',    // Ancho personalizado
            height: '40cm',// Alto personalizado
            border: '2mm',   // Opcional: Bordes
        };

        // Generar el PDF
        const pdfPath = `./output_${issueKey}.pdf`;
        pdf.create(htmlContent, options).toFile(pdfPath, async (err, result) => {
            if (err) {
                console.error('Error al generar el PDF:', err);
                return res.status(500).send('Error al generar el PDF');
            }

            console.log(`PDF generado: ${result.filename}`);

            // Subir el PDF a JIRA
            const form = new FormData();
            form.append('file', fs.createReadStream(pdfPath));

            const response = await fetch(
                `https://impresoslacanada.atlassian.net/rest/api/3/issue/${issueKey}/attachments`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `jira.la.canada@gmail.com:${process.env.JIRA_TOKEN}`
                        ).toString('base64')}`,
                        Accept: 'application/json',
                        'X-Atlassian-Token': 'no-check',
                        ...form.getHeaders(),
                    },
                    body: form,
                }
            );

            if (response.ok) {
                console.log(`Archivo PDF subido exitosamente a la incidencia ${issueKey}`);
                fs.unlinkSync(pdfPath); // Elimina el archivo local después de subirlo
                res.status(200).send('Archivo PDF generado y subido a JIRA correctamente');
            } else {
                const errorData = await response.text();
                console.error('Error al subir el archivo PDF a JIRA:', errorData);
                res.status(500).send('Error al subir el archivo PDF a JIRA');
            }
        });
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
