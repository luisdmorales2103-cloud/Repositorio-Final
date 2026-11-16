import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getProyectosParaUsuario,
  getProyectoPorId,
  crearProyecto,
  getMiembrosProyecto,
  asignarMiembroAProyecto,
  procesarIngestionArchivo,
  getDatasetsDeProyecto,
  getColumnasDeDataset,
  getFilasPaginadas,
  getGraficosDeProyecto,
  crearGraficoPersonalizado,
  getDashboardsDeProyecto,
  getHistorialCargasDeProyecto,
  getAuditoriaLogs,
  getIndicadoresResumen,
  registrarAuditoria,
} from './dwService.js';
import {
  testOracleConnectionProbe,
  getOracleConfig,
  isOracleConfigured,
} from './oracleClient.js';

const router = express.Router();

// Configuración de almacenamiento local seguro para uploads (Capa RAW)
const DW_UPLOADS_DIR = process.env.DW_STORAGE_DIR || path.resolve(process.cwd(), 'uploads', 'dw');
if (!fs.existsSync(DW_UPLOADS_DIR)) {
  try {
    fs.mkdirSync(DW_UPLOADS_DIR, { recursive: true });
  } catch {}
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, DW_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `raw_${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB límite de seguridad corporativo
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato no permitido. Solo se aceptan archivos .xlsx, .xls y .csv'));
    }
  },
});

// Helper para extraer usuario de la sesión o headers
function getUsuarioActual(req: Request): { email: string; esAdmin: boolean } {
  const emailHeader = (req.headers['x-user-email'] as string) || (req.query.userEmail as string);
  const userEmail = emailHeader ? emailHeader.trim().toLowerCase() : 'salgadoarevaloleidy@gmail.com';
  // Administradores autorizados
  const masterAdmins = ['salgadoarevaloleidy@gmail.com', 'luisdmorales2103@gmail.com', 'admin@pintuco.com'];
  const esAdmin = masterAdmins.includes(userEmail);
  return { email: userEmail, esAdmin };
}

// -------------------------------------------------------------
// 1. HEALTH CHECK & PROBE DE CONEXIÓN A ORACLE
// -------------------------------------------------------------
router.get('/health', async (_req: Request, res: Response) => {
  const probe = await testOracleConnectionProbe();
  const cfg = getOracleConfig();
  res.json({
    success: true,
    oracleConfigured: isOracleConfigured(),
    oracleConnected: probe.isConnected,
    probeResult: probe,
    connectString: cfg.connectString || 'oracle_db:1521/FREEPDB1',
    poolMin: cfg.poolMin,
    poolMax: cfg.poolMax,
    timestamp: new Date().toISOString(),
  });
});

router.post('/test-oracle-connection', async (_req: Request, res: Response) => {
  try {
    const probe = await testOracleConnectionProbe();
    res.json({
      success: probe.isConnected,
      probe,
      message: probe.isConnected
        ? `Conexión verificada exitosamente contra Oracle Database (${probe.latencyMs}ms)`
        : `No se pudo conectar a Oracle: ${probe.error || 'Verifique las variables ORACLE_USER, ORACLE_PASSWORD y ORACLE_CONNECT_STRING'}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2. GESTIÓN DE PROYECTOS (ILIMITADOS & RBAC)
// -------------------------------------------------------------
router.get('/proyectos', (req: Request, res: Response) => {
  try {
    const { email, esAdmin } = getUsuarioActual(req);
    const proyectos = getProyectosParaUsuario(email, esAdmin);
    res.json({ success: true, total: proyectos.length, proyectos });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/proyectos', (req: Request, res: Response) => {
  try {
    const { email } = getUsuarioActual(req);
    const { nombre, codigoProyecto, descripcion, categoria } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ success: false, error: 'El nombre del proyecto es obligatorio' });
    }

    const nuevo = crearProyecto({
      nombre,
      codigoProyecto,
      descripcion,
      categoria,
      creadoPor: email,
    });

    res.status(201).json({ success: true, proyecto: nuevo });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/proyectos/:id', (req: Request, res: Response) => {
  try {
    const proyecto = getProyectoPorId(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }
    const miembros = getMiembrosProyecto(req.params.id);
    const datasets = getDatasetsDeProyecto(req.params.id);
    const graficos = getGraficosDeProyecto(req.params.id);
    const dashboards = getDashboardsDeProyecto(req.params.id);
    const indicadores = getIndicadoresResumen(req.params.id);

    res.json({
      success: true,
      proyecto,
      miembros,
      datasets,
      graficos,
      dashboards,
      indicadores,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. ADMINISTRACIÓN DE MIEMBROS Y PERMISOS
// -------------------------------------------------------------
router.get('/proyectos/:id/miembros', (req: Request, res: Response) => {
  try {
    const miembros = getMiembrosProyecto(req.params.id);
    res.json({ success: true, miembros });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/proyectos/:id/miembros', (req: Request, res: Response) => {
  try {
    const { email: adminEmail } = getUsuarioActual(req);
    const { usuarioEmail, usuarioNombre, rol, puedeCargar, puedeEditar, puedeExportar } = req.body;

    if (!usuarioEmail || !usuarioEmail.trim()) {
      return res.status(400).json({ success: false, error: 'El email del usuario es obligatorio' });
    }

    const acceso = asignarMiembroAProyecto({
      proyectoId: req.params.id,
      usuarioEmail,
      usuarioNombre,
      rol: rol || 'ESTUDIANTE',
      puedeCargar,
      puedeEditar,
      puedeExportar,
      asignadoPor: adminEmail,
    });

    res.json({ success: true, acceso });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. SUBIDA E INGESTIÓN DE ARCHIVOS EXCEL Y CSV (AUTOMATIZACIÓN)
// -------------------------------------------------------------
router.post('/proyectos/:id/datasets', upload.single('archivo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se recibió ningún archivo para procesar' });
    }

    const { email } = getUsuarioActual(req);
    const { datasetName, sheetName } = req.body;

    const resultado = await procesarIngestionArchivo({
      proyectoId: req.params.id,
      usuarioEmail: email,
      filePath: req.file.path,
      originalFilename: req.file.originalname,
      datasetName,
      sheetName,
    });

    if (!resultado.success) {
      return res.status(400).json(resultado);
    }

    res.status(201).json(resultado);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/proyectos/:id/datasets', (req: Request, res: Response) => {
  try {
    const datasets = getDatasetsDeProyecto(req.params.id);
    res.json({ success: true, total: datasets.length, datasets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. CONSULTA DE COLUMNAS, METADATOS Y FILAS PAGINADAS
// -------------------------------------------------------------
router.get('/datasets/:id/columnas', (req: Request, res: Response) => {
  try {
    const columnas = getColumnasDeDataset(req.params.id);
    res.json({ success: true, total: columnas.length, columnas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/datasets/:id/filas', (req: Request, res: Response) => {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const tamano = Number(req.query.tamano) || 20;
    const busqueda = (req.query.q as string) || '';

    const data = getFilasPaginadas({
      datasetId: req.params.id,
      pagina,
      tamanoPagina: tamano,
      busqueda,
    });

    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. INDICADORES, GRÁFICOS Y DASHBOARDS
// -------------------------------------------------------------
router.get('/proyectos/:id/indicadores', (req: Request, res: Response) => {
  try {
    const data = getIndicadoresResumen(req.params.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/proyectos/:id/graficos', (req: Request, res: Response) => {
  try {
    const graficos = getGraficosDeProyecto(req.params.id);
    res.json({ success: true, total: graficos.length, graficos });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/proyectos/:id/graficos', (req: Request, res: Response) => {
  try {
    const { email } = getUsuarioActual(req);
    const { datasetId, titulo, tipoGrafico, ejeXColumna, ejeYColumna, operacionAgregada, paletaColor } = req.body;

    if (!datasetId || !titulo || !tipoGrafico || !ejeXColumna || !ejeYColumna) {
      return res.status(400).json({ success: false, error: 'Todos los parámetros del gráfico son obligatorios' });
    }

    const nuevo = crearGraficoPersonalizado({
      proyectoId: req.params.id,
      datasetId,
      titulo,
      tipoGrafico,
      ejeXColumna,
      ejeYColumna,
      operacionAgregada: operacionAgregada || 'SUM',
      paletaColor,
      creadoPor: email,
    });

    res.status(201).json({ success: true, grafico: nuevo });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/proyectos/:id/dashboards', (req: Request, res: Response) => {
  try {
    const dashboards = getDashboardsDeProyecto(req.params.id);
    res.json({ success: true, total: dashboards.length, dashboards });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/proyectos/:id/cargas', (req: Request, res: Response) => {
  try {
    const cargas = getHistorialCargasDeProyecto(req.params.id);
    res.json({ success: true, total: cargas.length, cargas });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. EXPORTACIÓN Y AUDITORÍA
// -------------------------------------------------------------
router.get('/datasets/:id/export', (req: Request, res: Response) => {
  try {
    const { email } = getUsuarioActual(req);
    const format = (req.query.format as string)?.toLowerCase() || 'csv';
    const data = getFilasPaginadas({ datasetId: req.params.id, pagina: 1, tamanoPagina: 10000 });

    registrarAuditoria({
      usuarioEmail: email,
      accion: 'EXPORTAR_DATASET',
      entidadAfectada: 'DW_DATASETS',
      idRegistroAfectado: req.params.id,
      detallesOperacion: `Exportación de ${data.total} filas en formato ${format.toUpperCase()}`,
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="dw_export_${req.params.id}.json"`);
      return res.send(JSON.stringify(data.filas, null, 2));
    }

    // Exportar CSV
    if (data.filas.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      return res.send('');
    }
    const headers = Object.keys(data.filas[0]);
    const csvRows = [headers.join(',')];
    data.filas.forEach((row) => {
      const vals = headers.map((h) => {
        const v = row[h];
        if (v === null || v === undefined) return '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      });
      csvRows.push(vals.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dw_export_${req.params.id}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/auditoria', (req: Request, res: Response) => {
  try {
    const limite = Number(req.query.limit) || 50;
    const logs = getAuditoriaLogs(limite);
    res.json({ success: true, total: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
