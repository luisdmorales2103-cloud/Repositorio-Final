import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import { executeOracleQuery, isOracleConfigured } from './oracleClient.js';

// Directorio seguro para almacenamiento de archivos RAW corporativos
const DW_STORAGE_DIR = process.env.DW_STORAGE_DIR || path.resolve(process.cwd(), 'uploads', 'dw');
const STORE_FILE_PATH = path.join(DW_STORAGE_DIR, 'dw_master_store.json');

// Asegurar que el directorio corporativo exista
if (!fs.existsSync(DW_STORAGE_DIR)) {
  try {
    fs.mkdirSync(DW_STORAGE_DIR, { recursive: true });
  } catch {}
}

// -------------------------------------------------------------
// MODELO DE DATOS Y TIPOS DATA WAREHOUSE ORACLE
// -------------------------------------------------------------

export interface DWProyecto {
  proyectoId: string;
  codigoProyecto: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: 'ACTIVO' | 'ARCHIVADO' | 'SUSPENDIDO';
  creadoPor: string;
  totalDatasets: number;
  totalRegistros: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DWAcceso {
  accesoId: string;
  proyectoId: string;
  usuarioEmail: string;
  usuarioNombre: string;
  rol: 'ADMINISTRADOR' | 'ANALISTA' | 'ESTUDIANTE' | 'LECTOR';
  puedeCargar: boolean;
  puedeEditar: boolean;
  puedeExportar: boolean;
  fechaAsignacion: string;
}

export interface DWDataset {
  datasetId: string;
  proyectoId: string;
  nombreDataset: string;
  descripcion?: string;
  nombreArchivoOrig: string;
  storagePathOrig: string;
  formatoArchivo: 'XLSX' | 'XLS' | 'CSV';
  hojaSeleccionada?: string;
  hojasDisponibles?: string[];
  totalFilas: number;
  totalColumnas: number;
  tamanoBytes: number;
  version: number;
  estado: 'PROCESANDO' | 'PROCESADO' | 'ERROR' | 'ADVERTENCIA';
  fechaCarga: string;
  cargadoPor: string;
}

export interface DWColumna {
  columnaId: string;
  datasetId: string;
  proyectoId: string;
  nombreOriginal: string;
  nombreNormalizado: string;
  indicePosicion: number;
  tipoDato: 'NUMERIC' | 'VARCHAR' | 'DATE' | 'BOOLEAN' | 'PERCENT' | 'CURRENCY';
  esMetrica: boolean;
  esDimension: boolean;
  totalNulos: number;
  totalDistintos: number;
  valorMin?: string | number;
  valorMax?: string | number;
  valorPromedio?: number;
  valorSuma?: number;
  columnaTypedMap: string; // NUMERIC_01, VARCHAR_01, DATE_01
  valoresFrecuentes?: { valor: string; conteo: number }[];
}

export interface DWCarga {
  cargaId: string;
  proyectoId: string;
  datasetId?: string;
  usuarioCarga: string;
  nombreArchivo: string;
  formato: string;
  estado: 'PENDIENTE' | 'PROCESANDO' | 'EXITOSO' | 'ERROR' | 'CON_ADVERTENCIAS';
  totalLeidas: number;
  totalValidas: number;
  totalRechazadas: number;
  erroresDetalle?: string[];
  tiempoDuracionMs?: number;
  fechaInicio: string;
  fechaFin?: string;
}

export interface DWFila {
  filaId: string;
  proyectoId: string;
  datasetId: string;
  cargaId: string;
  numeroFila: number;
  capa: 'RAW' | 'STAGING' | 'ANALYTICS';
  payloadRaw: Record<string, any>;
  payloadStaging: Record<string, any>;
  // Columnar typed values para análisis rápido
  numeric_01?: number;
  numeric_02?: number;
  numeric_03?: number;
  numeric_04?: number;
  numeric_05?: number;
  varchar_01?: string;
  varchar_02?: string;
  varchar_03?: string;
  varchar_04?: string;
  varchar_05?: string;
  date_01?: string;
  date_02?: string;
  estadoValidacion: 'VALIDA' | 'CORREGIDA' | 'RECHAZADA';
  fechaRegistro: string;
}

export interface DWGrafico {
  graficoId: string;
  proyectoId: string;
  datasetId: string;
  titulo: string;
  subtitulo?: string;
  tipoGrafico: 'BAR_VERTICAL' | 'BAR_HORIZONTAL' | 'LINE_TREND' | 'PIE_DISTRIBUTION' | 'DONUT' | 'AREA' | 'KPI_CARD' | 'SCATTER_PLOT';
  ejeXColumna: string;
  ejeYColumna: string;
  operacionAgregada: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'DISTINCT_COUNT';
  filtroCondicion?: string;
  paletaColor?: string;
  ordenDisplay: number;
  anchoColumnas: number; // 6 o 12 (grid)
  datosCalculados?: { label: string; value: number }[];
  fechaCreacion: string;
}

export interface DWDashboard {
  dashboardId: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  esDefault: boolean;
  totalWidgets: number;
  graficosIds: string[];
  creadoPor: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DWAuditoria {
  auditoriaId: string;
  proyectoId?: string;
  usuarioEmail: string;
  accion: string;
  entidadAfectada: string;
  idRegistroAfectado?: string;
  detallesOperacion?: string;
  ipOrigen?: string;
  timestampEvento: string;
}

interface DWDatabaseStore {
  proyectos: DWProyecto[];
  accesos: DWAcceso[];
  datasets: DWDataset[];
  columnas: DWColumna[];
  cargas: DWCarga[];
  filas: DWFila[];
  graficos: DWGrafico[];
  dashboards: DWDashboard[];
  auditoria: DWAuditoria[];
}

// -------------------------------------------------------------
// GESTIÓN DE ALMACENAMIENTO PERSISTENTE Y ORACLE ADAPTER
// -------------------------------------------------------------

function loadLocalStore(): DWDatabaseStore {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = fs.readFileSync(STORE_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[DW Store] Creando almacenamiento inicial:', err);
  }

  // Esquema semilla inicial corporativo
  const initialStore: DWDatabaseStore = {
    proyectos: [
      {
        proyectoId: 'proj-pintuco-corp-001',
        codigoProyecto: 'PRJ-2026-PINTUCO-ANALYTICS',
        nombre: 'Control Operacional y Ventas Pintuco Colombia',
        descripcion: 'Data warehouse analítico de producción, ventas por departamento y rendimiento de recubrimientos.',
        categoria: 'VENTAS_Y_OPERACIONES',
        estado: 'ACTIVO',
        creadoPor: 'salgadoarevaloleidy@gmail.com',
        totalDatasets: 1,
        totalRegistros: 12,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      },
      {
        proyectoId: 'proj-pintuco-calidad-002',
        codigoProyecto: 'PRJ-2026-LAB-CALIDAD',
        nombre: 'Laboratorio de Control de Calidad y Rendimiento (m²)',
        descripcion: 'Estudio analítico de espesor de película seca, tiempos de secado y rendimiento real en obra.',
        categoria: 'CALIDAD_I+D',
        estado: 'ACTIVO',
        creadoPor: 'salgadoarevaloleidy@gmail.com',
        totalDatasets: 0,
        totalRegistros: 0,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      },
    ],
    accesos: [
      {
        accesoId: 'acc-001',
        proyectoId: 'proj-pintuco-corp-001',
        usuarioEmail: 'salgadoarevaloleidy@gmail.com',
        usuarioNombre: 'Leidy Salgado (Super Admin)',
        rol: 'ADMINISTRADOR',
        puedeCargar: true,
        puedeEditar: true,
        puedeExportar: true,
        fechaAsignacion: new Date().toISOString(),
      },
      {
        accesoId: 'acc-002',
        proyectoId: 'proj-pintuco-corp-001',
        usuarioEmail: 'estudiante.analitica@universidad.edu.co',
        usuarioNombre: 'Estudiante Investigador',
        rol: 'ESTUDIANTE',
        puedeCargar: true,
        puedeEditar: false,
        puedeExportar: true,
        fechaAsignacion: new Date().toISOString(),
      },
      {
        accesoId: 'acc-003',
        proyectoId: 'proj-pintuco-calidad-002',
        usuarioEmail: 'salgadoarevaloleidy@gmail.com',
        usuarioNombre: 'Leidy Salgado (Super Admin)',
        rol: 'ADMINISTRADOR',
        puedeCargar: true,
        puedeEditar: true,
        puedeExportar: true,
        fechaAsignacion: new Date().toISOString(),
      },
    ],
    datasets: [],
    columnas: [],
    cargas: [],
    filas: [],
    graficos: [],
    dashboards: [],
    auditoria: [
      {
        auditoriaId: 'aud-init-001',
        proyectoId: 'proj-pintuco-corp-001',
        usuarioEmail: 'salgadoarevaloleidy@gmail.com',
        accion: 'CREAR_PROYECTO',
        entidadAfectada: 'DW_PROYECTOS',
        idRegistroAfectado: 'proj-pintuco-corp-001',
        detallesOperacion: 'Inicialización de plataforma Data Warehouse Pintuco',
        timestampEvento: new Date().toISOString(),
      },
    ],
  };

  // Seed sample dataset in demo project
  seedDemoDataset(initialStore);

  saveLocalStore(initialStore);
  return initialStore;
}

function saveLocalStore(store: DWDatabaseStore): void {
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DW Store] Error persistiendo almacenamiento local:', err);
  }
}

function seedDemoDataset(store: DWDatabaseStore) {
  const datasetId = 'dataset-demo-ventas-01';
  const proyectoId = 'proj-pintuco-corp-001';
  const cargaId = 'carga-demo-01';

  const sampleRows = [
    { Mes: 'Enero', Ciudad: 'Bogotá D.C.', Categoria: 'Hogar', Galones: 1250, VentasCOP: 187500000, CoberturaM2: 62500 },
    { Mes: 'Enero', Ciudad: 'Medellín', Categoria: 'Construcción', Galones: 980, VentasCOP: 156800000, CoberturaM2: 49000 },
    { Mes: 'Febrero', Ciudad: 'Bogotá D.C.', Categoria: 'Industrial', Galones: 1420, VentasCOP: 241400000, CoberturaM2: 71000 },
    { Mes: 'Febrero', Ciudad: 'Cali', Categoria: 'Hogar', Galones: 850, VentasCOP: 127500000, CoberturaM2: 42500 },
    { Mes: 'Marzo', Ciudad: 'Barranquilla', Categoria: 'Construcción', Galones: 1100, VentasCOP: 176000000, CoberturaM2: 55000 },
    { Mes: 'Marzo', Ciudad: 'Medellín', Categoria: 'Hogar', Galones: 1340, VentasCOP: 201000000, CoberturaM2: 67000 },
    { Mes: 'Abril', Ciudad: 'Bogotá D.C.', Categoria: 'Automotriz', Galones: 920, VentasCOP: 165600000, CoberturaM2: 46000 },
    { Mes: 'Abril', Ciudad: 'Bucaramanga', Categoria: 'Hogar', Galones: 760, VentasCOP: 114000000, CoberturaM2: 38000 },
    { Mes: 'Mayo', Ciudad: 'Medellín', Categoria: 'Industrial', Galones: 1650, VentasCOP: 280500000, CoberturaM2: 82500 },
    { Mes: 'Mayo', Ciudad: 'Cali', Categoria: 'Construcción', Galones: 1040, VentasCOP: 166400000, CoberturaM2: 52000 },
    { Mes: 'Junio', Ciudad: 'Bogotá D.C.', Categoria: 'Hogar', Galones: 1580, VentasCOP: 237000000, CoberturaM2: 79000 },
    { Mes: 'Junio', Ciudad: 'Cartagena', Categoria: 'Industrial', Galones: 1120, VentasCOP: 190400000, CoberturaM2: 56000 },
  ];

  store.datasets.push({
    datasetId,
    proyectoId,
    nombreDataset: 'Ventas y Cobertura Nacional Pintuco 2026',
    descripcion: 'Dataset representativo de galones vendidos, facturación en COP y cobertura estimada en m².',
    nombreArchivoOrig: 'ventas_cobertura_pintuco_2026.xlsx',
    storagePathOrig: path.join(DW_STORAGE_DIR, 'ventas_cobertura_pintuco_2026.xlsx'),
    formatoArchivo: 'XLSX',
    hojaSeleccionada: 'Ventas_2026',
    hojasDisponibles: ['Ventas_2026'],
    totalFilas: sampleRows.length,
    totalColumnas: 6,
    tamanoBytes: 45280,
    version: 1,
    estado: 'PROCESADO',
    fechaCarga: new Date().toISOString(),
    cargadoPor: 'salgadoarevaloleidy@gmail.com',
  });

  const columnsDef: DWColumna[] = [
    { columnaId: 'col-01', datasetId, proyectoId, nombreOriginal: 'Mes', nombreNormalizado: 'mes', indicePosicion: 0, tipoDato: 'VARCHAR', esMetrica: false, esDimension: true, totalNulos: 0, totalDistintos: 6, columnaTypedMap: 'VARCHAR_01' },
    { columnaId: 'col-02', datasetId, proyectoId, nombreOriginal: 'Ciudad', nombreNormalizado: 'ciudad', indicePosicion: 1, tipoDato: 'VARCHAR', esMetrica: false, esDimension: true, totalNulos: 0, totalDistintos: 6, columnaTypedMap: 'VARCHAR_02' },
    { columnaId: 'col-03', datasetId, proyectoId, nombreOriginal: 'Categoria', nombreNormalizado: 'categoria', indicePosicion: 2, tipoDato: 'VARCHAR', esMetrica: false, esDimension: true, totalNulos: 0, totalDistintos: 4, columnaTypedMap: 'VARCHAR_03' },
    { columnaId: 'col-04', datasetId, proyectoId, nombreOriginal: 'Galones', nombreNormalizado: 'galones', indicePosicion: 3, tipoDato: 'NUMERIC', esMetrica: true, esDimension: false, totalNulos: 0, totalDistintos: 12, valorMin: 760, valorMax: 1650, valorPromedio: 1169, valorSuma: 14030, columnaTypedMap: 'NUMERIC_01' },
    { columnaId: 'col-05', datasetId, proyectoId, nombreOriginal: 'VentasCOP', nombreNormalizado: 'ventas_cop', indicePosicion: 4, tipoDato: 'CURRENCY', esMetrica: true, esDimension: false, totalNulos: 0, totalDistintos: 12, valorMin: 114000000, valorMax: 280500000, valorPromedio: 187741666, valorSuma: 2252900000, columnaTypedMap: 'NUMERIC_02' },
    { columnaId: 'col-06', datasetId, proyectoId, nombreOriginal: 'CoberturaM2', nombreNormalizado: 'cobertura_m2', indicePosicion: 5, tipoDato: 'NUMERIC', esMetrica: true, esDimension: false, totalNulos: 0, totalDistintos: 12, valorMin: 38000, valorMax: 82500, valorPromedio: 58458, valorSuma: 701500, columnaTypedMap: 'NUMERIC_03' },
  ];
  store.columnas.push(...columnsDef);

  store.cargas.push({
    cargaId,
    proyectoId,
    datasetId,
    usuarioCarga: 'salgadoarevaloleidy@gmail.com',
    nombreArchivo: 'ventas_cobertura_pintuco_2026.xlsx',
    formato: 'XLSX',
    estado: 'EXITOSO',
    totalLeidas: sampleRows.length,
    totalValidas: sampleRows.length,
    totalRechazadas: 0,
    tiempoDuracionMs: 245,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date().toISOString(),
  });

  sampleRows.forEach((r, idx) => {
    store.filas.push({
      filaId: `fila-${datasetId}-${idx + 1}`,
      proyectoId,
      datasetId,
      cargaId,
      numeroFila: idx + 1,
      capa: 'ANALYTICS',
      payloadRaw: r,
      payloadStaging: r,
      varchar_01: r.Mes,
      varchar_02: r.Ciudad,
      varchar_03: r.Categoria,
      numeric_01: r.Galones,
      numeric_02: r.VentasCOP,
      numeric_03: r.CoberturaM2,
      estadoValidacion: 'VALIDA',
      fechaRegistro: new Date().toISOString(),
    });
  });

  // Recomendar y persistir gráficos iniciales
  store.graficos.push(
    {
      graficoId: 'gra-001',
      proyectoId,
      datasetId,
      titulo: 'Facturación en COP por Categoría',
      subtitulo: 'Distribución acumulada de ventas',
      tipoGrafico: 'BAR_VERTICAL',
      ejeXColumna: 'Categoria',
      ejeYColumna: 'VentasCOP',
      operacionAgregada: 'SUM',
      paletaColor: 'PINTUCO_NAVY',
      ordenDisplay: 1,
      anchoColumnas: 6,
      datosCalculados: [
        { label: 'Hogar', value: 767000000 },
        { label: 'Industrial', value: 712300000 },
        { label: 'Construcción', value: 499200000 },
        { label: 'Automotriz', value: 165600000 },
      ],
      fechaCreacion: new Date().toISOString(),
    },
    {
      graficoId: 'gra-002',
      proyectoId,
      datasetId,
      titulo: 'Evolución de Galones Despachados por Mes',
      subtitulo: 'Comportamiento mensual del volumen',
      tipoGrafico: 'LINE_TREND',
      ejeXColumna: 'Mes',
      ejeYColumna: 'Galones',
      operacionAgregada: 'SUM',
      paletaColor: 'PINTUCO_AMBER',
      ordenDisplay: 2,
      anchoColumnas: 6,
      datosCalculados: [
        { label: 'Enero', value: 2230 },
        { label: 'Febrero', value: 2270 },
        { label: 'Marzo', value: 2440 },
        { label: 'Abril', value: 1680 },
        { label: 'Mayo', value: 2690 },
        { label: 'Junio', value: 2700 },
      ],
      fechaCreacion: new Date().toISOString(),
    },
    {
      graficoId: 'gra-003',
      proyectoId,
      datasetId,
      titulo: 'Cobertura de m² por Ciudad',
      subtitulo: 'Superficie pintada estimada',
      tipoGrafico: 'PIE_DISTRIBUTION',
      ejeXColumna: 'Ciudad',
      ejeYColumna: 'CoberturaM2',
      operacionAgregada: 'SUM',
      paletaColor: 'EMERALD',
      ordenDisplay: 3,
      anchoColumnas: 12,
      datosCalculados: [
        { label: 'Bogotá D.C.', value: 258500 },
        { label: 'Medellín', value: 198500 },
        { label: 'Cali', value: 94500 },
        { label: 'Barranquilla', value: 55000 },
        { label: 'Cartagena', value: 56000 },
        { label: 'Bucaramanga', value: 38000 },
      ],
      fechaCreacion: new Date().toISOString(),
    }
  );

  store.dashboards.push({
    dashboardId: 'dash-001',
    proyectoId,
    nombre: 'Dashboard Principal de Ventas y Cobertura',
    descripcion: 'Vista ejecutiva de métricas e indicadores de gestión comercial Pintuco',
    esDefault: true,
    totalWidgets: 3,
    graficosIds: ['gra-001', 'gra-002', 'gra-003'],
    creadoPor: 'salgadoarevaloleidy@gmail.com',
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
  });
}

// -------------------------------------------------------------
// CONTROLADOR DE AUDITORÍA
// -------------------------------------------------------------

export function registrarAuditoria(entry: {
  proyectoId?: string;
  usuarioEmail: string;
  accion: string;
  entidadAfectada: string;
  idRegistroAfectado?: string;
  detallesOperacion?: string;
  ipOrigen?: string;
}): void {
  const store = loadLocalStore();
  const audId = `aud-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const auditItem: DWAuditoria = {
    auditoriaId: audId,
    ...entry,
    timestampEvento: new Date().toISOString(),
  };

  store.auditoria.unshift(auditItem);
  if (store.auditoria.length > 500) {
    store.auditoria.pop();
  }
  saveLocalStore(store);

  // Replicar en Oracle si está conectado
  if (isOracleConfigured()) {
    executeOracleQuery(
      `INSERT INTO DW_AUDITORIA (
        AUDITORIA_ID, PROYECTO_ID, USUARIO_EMAIL, ACCION, ENTIDAD_AFECTADA, ID_REGISTRO_AFECTADO, DETALLES_OPERACION, IP_ORIGEN
      ) VALUES (:audId, :proyId, :userEmail, :accion, :entidad, :idReg, :detalles, :ip)`,
      {
        audId,
        proyId: entry.proyectoId || null,
        userEmail: entry.usuarioEmail,
        accion: entry.accion,
        entidad: entry.entidadAfectada,
        idReg: entry.idRegistroAfectado || null,
        detalles: entry.detallesOperacion || null,
        ip: entry.ipOrigen || null,
      }
    ).catch((e) => console.warn('[Oracle DW Audit] sync err:', e.message));
  }
}

// -------------------------------------------------------------
// SERVICIOS DE GESTIÓN MULTIPROYECTO (RBAC & ISOLATION)
// -------------------------------------------------------------

export function getProyectosParaUsuario(usuarioEmail: string, esAdmin: boolean): DWProyecto[] {
  const store = loadLocalStore();
  if (esAdmin) {
    return store.proyectos;
  }
  const normEmail = usuarioEmail.trim().toLowerCase();
  const proyectosAutorizados = new Set(
    store.accesos
      .filter((a) => a.usuarioEmail.trim().toLowerCase() === normEmail)
      .map((a) => a.proyectoId)
  );

  return store.proyectos.filter(
    (p) => proyectosAutorizados.has(p.proyectoId) || p.creadoPor.trim().toLowerCase() === normEmail
  );
}

export function getProyectoPorId(proyectoId: string): DWProyecto | null {
  const store = loadLocalStore();
  return store.proyectos.find((p) => p.proyectoId === proyectoId) || null;
}

export function crearProyecto(data: {
  nombre: string;
  codigoProyecto?: string;
  descripcion?: string;
  categoria?: string;
  creadoPor: string;
}): DWProyecto {
  const store = loadLocalStore();
  const proyectoId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const cleanCode = (data.codigoProyecto || `PRJ-${Date.now().toString(36).toUpperCase()}`).trim();

  // Validar unicidad del código de proyecto
  const exists = store.proyectos.some(
    (p) => p.codigoProyecto.toLowerCase() === cleanCode.toLowerCase()
  );
  if (exists) {
    throw new Error(`Ya existe un proyecto con el código "${cleanCode}"`);
  }

  const nuevoProyecto: DWProyecto = {
    proyectoId,
    codigoProyecto: cleanCode,
    nombre: data.nombre.trim(),
    descripcion: data.descripcion?.trim() || '',
    categoria: data.categoria?.trim() || 'GENERAL',
    estado: 'ACTIVO',
    creadoPor: data.creadoPor.trim(),
    totalDatasets: 0,
    totalRegistros: 0,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
  };

  store.proyectos.unshift(nuevoProyecto);

  // Asignar al creador como Administrador del proyecto
  store.accesos.push({
    accesoId: `acc-${Date.now()}`,
    proyectoId,
    usuarioEmail: data.creadoPor.trim(),
    usuarioNombre: data.creadoPor.split('@')[0],
    rol: 'ADMINISTRADOR',
    puedeCargar: true,
    puedeEditar: true,
    puedeExportar: true,
    fechaAsignacion: new Date().toISOString(),
  });

  saveLocalStore(store);

  registrarAuditoria({
    proyectoId,
    usuarioEmail: data.creadoPor,
    accion: 'CREAR_PROYECTO',
    entidadAfectada: 'DW_PROYECTOS',
    idRegistroAfectado: proyectoId,
    detallesOperacion: `Proyecto creado: ${data.nombre} (${cleanCode})`,
  });

  // Replicar en Oracle si está configurado
  if (isOracleConfigured()) {
    executeOracleQuery(
      `INSERT INTO DW_PROYECTOS (
        PROYECTO_ID, CODIGO_PROYECTO, NOMBRE, DESCRIPCION, CATEGORIA, ESTADO, CREADO_POR
      ) VALUES (:id, :cod, :nom, :desc, :cat, :est, :crea)`,
      {
        id: proyectoId,
        cod: cleanCode,
        nom: nuevoProyecto.nombre,
        desc: nuevoProyecto.descripcion,
        cat: nuevoProyecto.categoria,
        est: nuevoProyecto.estado,
        crea: nuevoProyecto.creadoPor,
      }
    ).catch((e) => console.warn('[Oracle DW] insert proyecto sync:', e.message));
  }

  return nuevoProyecto;
}

export function getMiembrosProyecto(proyectoId: string): DWAcceso[] {
  const store = loadLocalStore();
  return store.accesos.filter((a) => a.proyectoId === proyectoId);
}

export function asignarMiembroAProyecto(data: {
  proyectoId: string;
  usuarioEmail: string;
  usuarioNombre?: string;
  rol: DWAcceso['rol'];
  puedeCargar?: boolean;
  puedeEditar?: boolean;
  puedeExportar?: boolean;
  asignadoPor: string;
}): DWAcceso {
  const store = loadLocalStore();
  const normEmail = data.usuarioEmail.trim().toLowerCase();

  const idx = store.accesos.findIndex(
    (a) => a.proyectoId === data.proyectoId && a.usuarioEmail.toLowerCase() === normEmail
  );

  const accesoItem: DWAcceso = {
    accesoId: idx > -1 ? store.accesos[idx].accesoId : `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    proyectoId: data.proyectoId,
    usuarioEmail: normEmail,
    usuarioNombre: data.usuarioNombre || normEmail.split('@')[0],
    rol: data.rol,
    puedeCargar: data.puedeCargar ?? (data.rol !== 'LECTOR'),
    puedeEditar: data.puedeEditar ?? (data.rol === 'ADMINISTRADOR' || data.rol === 'ANALISTA'),
    puedeExportar: data.puedeExportar ?? true,
    fechaAsignacion: new Date().toISOString(),
  };

  if (idx > -1) {
    store.accesos[idx] = accesoItem;
  } else {
    store.accesos.push(accesoItem);
  }

  saveLocalStore(store);

  registrarAuditoria({
    proyectoId: data.proyectoId,
    usuarioEmail: data.asignadoPor,
    accion: 'ASIGNAR_MIEMBRO',
    entidadAfectada: 'DW_ACCESOS',
    idRegistroAfectado: accesoItem.accesoId,
    detallesOperacion: `Usuario ${normEmail} asignado con rol ${data.rol}`,
  });

  return accesoItem;
}

// -------------------------------------------------------------
// PIPELINE DE INGESTIÓN Y AUTOMATIZACIÓN DE ARCHIVOS EXCEL/CSV
// (Pasos 1 al 13 del Requerimiento del Usuario)
// -------------------------------------------------------------

export interface IngestionResult {
  success: boolean;
  dataset?: DWDataset;
  columnas?: DWColumna[];
  carga?: DWCarga;
  graficosRecomendados?: DWGrafico[];
  dashboard?: DWDashboard;
  estadisticas?: {
    totalFilas: number;
    totalColumnas: number;
    columnasMetricas: number;
    columnasDimensiones: number;
  };
  error?: string;
}

/**
 * Infiere tipos de datos analíticos avanzados y estadísticas de columna
 */
function inferirColumnaYMetadatos(
  nombreOriginal: string,
  valores: any[],
  colIndex: number
): Omit<DWColumna, 'columnaId' | 'datasetId' | 'proyectoId'> {
  const norm = nombreOriginal.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  let nonNulls = 0;
  let numbersCount = 0;
  let datesCount = 0;
  let boolsCount = 0;
  const distinctSet = new Set<string>();
  const freqMap = new Map<string, number>();

  let numMin = Infinity;
  let numMax = -Infinity;
  let numSum = 0;

  for (const v of valores) {
    if (v === null || v === undefined || v === '') continue;
    nonNulls++;
    const str = String(v).trim();
    distinctSet.add(str);
    freqMap.set(str, (freqMap.get(str) || 0) + 1);

    // Detección de números y monedas
    const cleanNumStr = str.replace(/[$€COP,\s]/gi, '').replace(/\.(?=.*\.)/g, '');
    const num = Number(cleanNumStr);
    if (!isNaN(num) && cleanNumStr.length > 0) {
      numbersCount++;
      numSum += num;
      if (num < numMin) numMin = num;
      if (num > numMax) numMax = num;
    }

    // Detección de booleanos
    const lower = str.toLowerCase();
    if (['true', 'false', 'si', 'no', '0', '1', 'verdadero', 'falso'].includes(lower)) {
      boolsCount++;
    }

    // Detección de fechas
    if (str.match(/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/) || str.match(/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/)) {
      const parsedDate = Date.parse(str);
      if (!isNaN(parsedDate)) {
        datesCount++;
      }
    }
  }

  const totalNulos = valores.length - nonNulls;
  const totalDistintos = distinctSet.size;

  let tipoDato: DWColumna['tipoDato'] = 'VARCHAR';
  let esMetrica = false;
  let esDimension = true;
  let columnaTypedMap = `VARCHAR_0${(colIndex % 8) + 1}`;

  if (nonNulls > 0) {
    if (numbersCount / nonNulls > 0.8) {
      // Si tiene símbolo de moneda o el nombre lo sugiere
      if (norm.includes('precio') || norm.includes('venta') || norm.includes('costo') || norm.includes('cop') || norm.includes('valor')) {
        tipoDato = 'CURRENCY';
      } else if (norm.includes('porcent') || norm.includes('tasa') || norm.includes('rate') || norm.includes('%')) {
        tipoDato = 'PERCENT';
      } else {
        tipoDato = 'NUMERIC';
      }
      esMetrica = true;
      esDimension = false;
      columnaTypedMap = `NUMERIC_0${(colIndex % 8) + 1}`;
    } else if (datesCount / nonNulls > 0.7) {
      tipoDato = 'DATE';
      columnaTypedMap = `DATE_0${(colIndex % 3) + 1}`;
    } else if (boolsCount / nonNulls > 0.8) {
      tipoDato = 'BOOLEAN';
    }
  }

  // Obtener top 5 valores frecuentes
  const valoresFrecuentes = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([valor, conteo]) => ({ valor, conteo }));

  return {
    nombreOriginal,
    nombreNormalizado: norm,
    indicePosicion: colIndex,
    tipoDato,
    esMetrica,
    esDimension,
    totalNulos,
    totalDistintos,
    valorMin: isFinite(numMin) ? numMin : undefined,
    valorMax: isFinite(numMax) ? numMax : undefined,
    valorPromedio: numbersCount > 0 ? Number((numSum / numbersCount).toFixed(2)) : undefined,
    valorSuma: numbersCount > 0 ? Number(numSum.toFixed(2)) : undefined,
    columnaTypedMap,
    valoresFrecuentes,
  };
}

/**
 * Procesa un archivo Excel/CSV subido por un estudiante o analista
 */
export async function procesarIngestionArchivo(params: {
  proyectoId: string;
  usuarioEmail: string;
  filePath: string;
  originalFilename: string;
  sheetName?: string;
  datasetName?: string;
}): Promise<IngestionResult> {
  const startTime = Date.now();
  const store = loadLocalStore();
  const proyecto = store.proyectos.find((p) => p.proyectoId === params.proyectoId);
  if (!proyecto) {
    return { success: false, error: 'Proyecto no encontrado o no autorizado' };
  }

  // 1. Verificar identidad y permisos
  const acceso = store.accesos.find(
    (a) => a.proyectoId === params.proyectoId && a.usuarioEmail.toLowerCase() === params.usuarioEmail.toLowerCase()
  );
  if (!acceso && proyecto.creadoPor.toLowerCase() !== params.usuarioEmail.toLowerCase()) {
    return { success: false, error: 'Acceso no autorizado: No eres miembro de este proyecto DW' };
  }
  if (acceso && !acceso.puedeCargar && proyecto.creadoPor.toLowerCase() !== params.usuarioEmail.toLowerCase()) {
    return { success: false, error: 'Permisos insuficientes: Tu rol de usuario tiene deshabilitada la carga de datasets' };
  }

  // 2. Validar formato y tamaño
  const ext = path.extname(params.originalFilename).toLowerCase();
  let formato: 'XLSX' | 'XLS' | 'CSV' = 'XLSX';
  if (ext === '.csv') formato = 'CSV';
  else if (ext === '.xls') formato = 'XLS';
  else if (ext !== '.xlsx') {
    return { success: false, error: `Formato de archivo no soportado (${ext}). Utilice .xlsx, .xls o .csv.` };
  }

  const stats = fs.statSync(params.filePath);
  const tamanoBytes = stats.size;
  const maxBytes = 50 * 1024 * 1024; // 50MB límite de seguridad corporativo
  if (tamanoBytes > maxBytes) {
    return { success: false, error: 'El archivo excede el tamaño máximo permitido por la infraestructura (50 MB)' };
  }

  // 3. Crear trabajo de procesamiento (DW_CARGAS)
  const cargaId = `car-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const datasetId = `dat-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const erroresDetalle: string[] = [];

  const nuevaCarga: DWCarga = {
    cargaId,
    proyectoId: params.proyectoId,
    datasetId,
    usuarioCarga: params.usuarioEmail,
    nombreArchivo: params.originalFilename,
    formato,
    estado: 'PROCESANDO',
    totalLeidas: 0,
    totalValidas: 0,
    totalRechazadas: 0,
    fechaInicio: new Date().toISOString(),
  };
  store.cargas.unshift(nuevaCarga);

  try {
    // 4. Leer y detectar hojas en Excel
    const workbook = xlsx.readFile(params.filePath, { cellDates: true });
    const hojasDisponibles = workbook.SheetNames;
    if (hojasDisponibles.length === 0) {
      throw new Error('El archivo Excel no contiene hojas de cálculo con datos legibles.');
    }

    const selectedSheet = params.sheetName && hojasDisponibles.includes(params.sheetName)
      ? params.sheetName
      : hojasDisponibles[0];

    const worksheet = workbook.Sheets[selectedSheet];
    const rawRows = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: null });

    if (rawRows.length === 0) {
      throw new Error(`La hoja "${selectedSheet}" no contiene registros para procesar.`);
    }

    // 5. Detectar columnas y encabezados
    const columnNames = Object.keys(rawRows[0]);
    if (columnNames.length === 0) {
      throw new Error('No se detectaron encabezados válidos en la fila superior del archivo.');
    }

    // 6. Inferencia de metadatos de columnas
    const columnasDataset: DWColumna[] = columnNames.map((colName, idx) => {
      const colValues = rawRows.map((r) => r[colName]);
      const meta = inferirColumnaYMetadatos(colName, colValues, idx);
      return {
        columnaId: `col-${datasetId}-${idx + 1}`,
        datasetId,
        proyectoId: params.proyectoId,
        ...meta,
      };
    });

    // 7. Limpieza, validación y división por capas (RAW -> STAGING -> ANALYTICS)
    const filasDataset: DWFila[] = [];
    let validas = 0;
    let rechazadas = 0;

    rawRows.forEach((rawRow, idx) => {
      const rowNum = idx + 1;
      const isCompletelyEmpty = Object.values(rawRow).every((v) => v === null || v === '');
      if (isCompletelyEmpty) {
        rechazadas++;
        erroresDetalle.push(`Fila ${rowNum}: Omitida por estar completamente vacía.`);
        return;
      }

      // Normalización STAGING
      const stagingRow: Record<string, any> = {};
      const typedRow: Record<string, any> = {};

      columnasDataset.forEach((col) => {
        const val = rawRow[col.nombreOriginal];
        if (val === null || val === undefined) {
          stagingRow[col.nombreNormalizado] = null;
        } else if (typeof val === 'string') {
          stagingRow[col.nombreNormalizado] = val.trim();
        } else {
          stagingRow[col.nombreNormalizado] = val;
        }

        // Mapeo a columna tipada para indexación rápida
        if (col.tipoDato === 'NUMERIC' || col.tipoDato === 'CURRENCY' || col.tipoDato === 'PERCENT') {
          const num = Number(String(val).replace(/[$€COP,\s]/gi, ''));
          typedRow[col.columnaTypedMap.toLowerCase()] = isNaN(num) ? null : num;
        } else if (col.tipoDato === 'DATE') {
          const d = new Date(val);
          typedRow[col.columnaTypedMap.toLowerCase()] = isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        } else {
          typedRow[col.columnaTypedMap.toLowerCase()] = val ? String(val).slice(0, 255) : null;
        }
      });

      validas++;
      filasDataset.push({
        filaId: `fila-${datasetId}-${rowNum}`,
        proyectoId: params.proyectoId,
        datasetId,
        cargaId,
        numeroFila: rowNum,
        capa: 'ANALYTICS',
        payloadRaw: rawRow,
        payloadStaging: stagingRow,
        numeric_01: typedRow.numeric_01,
        numeric_02: typedRow.numeric_02,
        numeric_03: typedRow.numeric_03,
        numeric_04: typedRow.numeric_04,
        numeric_05: typedRow.numeric_05,
        varchar_01: typedRow.varchar_01,
        varchar_02: typedRow.varchar_02,
        varchar_03: typedRow.varchar_03,
        varchar_04: typedRow.varchar_04,
        varchar_05: typedRow.varchar_05,
        date_01: typedRow.date_01,
        date_02: typedRow.date_02,
        estadoValidacion: 'VALIDA',
        fechaRegistro: new Date().toISOString(),
      });
    });

    // 8. Crear y registrar DW_DATASETS
    const datasetFinal: DWDataset = {
      datasetId,
      proyectoId: params.proyectoId,
      nombreDataset: params.datasetName || path.parse(params.originalFilename).name,
      descripcion: `Cargado desde ${params.originalFilename} (Hoja: ${selectedSheet})`,
      nombreArchivoOrig: params.originalFilename,
      storagePathOrig: params.filePath,
      formatoArchivo: formato,
      hojaSeleccionada: selectedSheet,
      hojasDisponibles,
      totalFilas: validas,
      totalColumnas: columnasDataset.length,
      tamanoBytes,
      version: 1,
      estado: erroresDetalle.length > 0 ? 'ADVERTENCIA' : 'PROCESADO',
      fechaCarga: new Date().toISOString(),
      cargadoPor: params.usuarioEmail,
    };

    // 9. Recomendar Gráficos automáticamente (Motor Inteligente de BI)
    const metricCols = columnasDataset.filter((c) => c.esMetrica);
    const dimCols = columnasDataset.filter((c) => c.esDimension && (c.totalDistintos || 0) <= 25);
    const graficosGenerados: DWGrafico[] = [];

    if (dimCols.length > 0 && metricCols.length > 0) {
      const primaryDim = dimCols[0];
      const primaryMetric = metricCols[0];

      // Gráfico 1: Barras Verticales
      const groupMap = new Map<string, number>();
      filasDataset.forEach((f) => {
        const cat = String(f.payloadStaging[primaryDim.nombreNormalizado] || 'Sin categoría');
        const numVal = Number(f.payloadStaging[primaryMetric.nombreNormalizado]) || 0;
        groupMap.set(cat, (groupMap.get(cat) || 0) + numVal);
      });

      const barData = Array.from(groupMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, value]) => ({ label, value: Number(value.toFixed(2)) }));

      graficosGenerados.push({
        graficoId: `gra-${Date.now()}-1`,
        proyectoId: params.proyectoId,
        datasetId,
        titulo: `${primaryMetric.nombreOriginal} por ${primaryDim.nombreOriginal}`,
        subtitulo: 'Distribución y volumen comparativo',
        tipoGrafico: 'BAR_VERTICAL',
        ejeXColumna: primaryDim.nombreOriginal,
        ejeYColumna: primaryMetric.nombreOriginal,
        operacionAgregada: 'SUM',
        paletaColor: 'PINTUCO_NAVY',
        ordenDisplay: 1,
        anchoColumnas: 6,
        datosCalculados: barData,
        fechaCreacion: new Date().toISOString(),
      });

      // Gráfico 2: Si hay una segunda métrica o segunda dimensión
      if (metricCols.length > 1) {
        const secondMetric = metricCols[1];
        const groupMap2 = new Map<string, number>();
        filasDataset.forEach((f) => {
          const cat = String(f.payloadStaging[primaryDim.nombreNormalizado] || 'Sin categoría');
          const numVal = Number(f.payloadStaging[secondMetric.nombreNormalizado]) || 0;
          groupMap2.set(cat, (groupMap2.get(cat) || 0) + numVal);
        });

        graficosGenerados.push({
          graficoId: `gra-${Date.now()}-2`,
          proyectoId: params.proyectoId,
          datasetId,
          titulo: `${secondMetric.nombreOriginal} por ${primaryDim.nombreOriginal}`,
          subtitulo: 'Análisis de métrica secundaria',
          tipoGrafico: 'PIE_DISTRIBUTION',
          ejeXColumna: primaryDim.nombreOriginal,
          ejeYColumna: secondMetric.nombreOriginal,
          operacionAgregada: 'SUM',
          paletaColor: 'PINTUCO_AMBER',
          ordenDisplay: 2,
          anchoColumnas: 6,
          datosCalculados: Array.from(groupMap2.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, value]) => ({ label, value: Number(value.toFixed(2)) })),
          fechaCreacion: new Date().toISOString(),
        });
      }
    }

    // 10. Crear / Actualizar Dashboard del Proyecto
    const dashboardId = `dash-${params.proyectoId}`;
    let dashboard = store.dashboards.find((d) => d.proyectoId === params.proyectoId && d.esDefault);
    if (!dashboard) {
      dashboard = {
        dashboardId,
        proyectoId: params.proyectoId,
        nombre: `Dashboard Ejecutivo - ${proyecto.nombre}`,
        descripcion: 'Panel analítico interactivo con métricas clave del proyecto.',
        esDefault: true,
        totalWidgets: graficosGenerados.length,
        graficosIds: graficosGenerados.map((g) => g.graficoId),
        creadoPor: params.usuarioEmail,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
      };
      store.dashboards.push(dashboard);
    } else {
      dashboard.totalWidgets += graficosGenerados.length;
      dashboard.graficosIds.push(...graficosGenerados.map((g) => g.graficoId));
      dashboard.fechaActualizacion = new Date().toISOString();
    }

    // 11. Finalizar Carga en DW_CARGAS
    const duracion = Date.now() - startTime;
    nuevaCarga.datasetId = datasetId;
    nuevaCarga.estado = erroresDetalle.length > 0 ? 'CON_ADVERTENCIAS' : 'EXITOSO';
    nuevaCarga.totalLeidas = rawRows.length;
    nuevaCarga.totalValidas = validas;
    nuevaCarga.totalRechazadas = rechazadas;
    nuevaCarga.erroresDetalle = erroresDetalle;
    nuevaCarga.tiempoDuracionMs = duracion;
    nuevaCarga.fechaFin = new Date().toISOString();

    // Actualizar contadores del proyecto
    proyecto.totalDatasets += 1;
    proyecto.totalRegistros += validas;
    proyecto.fechaActualizacion = new Date().toISOString();

    // Persistir estructuras en Store
    store.datasets.unshift(datasetFinal);
    store.columnas.push(...columnasDataset);
    store.filas.push(...filasDataset);
    store.graficos.push(...graficosGenerados);

    saveLocalStore(store);

    // Auditoría
    registrarAuditoria({
      proyectoId: params.proyectoId,
      usuarioEmail: params.usuarioEmail,
      accion: 'CARGA_DATASET_EXCEL',
      entidadAfectada: 'DW_DATASETS',
      idRegistroAfectado: datasetId,
      detallesOperacion: `Archivo procesado: ${params.originalFilename}. Filas válidas: ${validas}. Columnas: ${columnasDataset.length}. Duración: ${duracion}ms.`,
    });

    // 12. Replicación en Oracle Database si el pool está disponible
    if (isOracleConfigured()) {
      (async () => {
        try {
          await executeOracleQuery(
            `INSERT INTO DW_DATASETS (
              DATASET_ID, PROYECTO_ID, NOMBRE_DATASET, DESCRIPCION, NOMBRE_ARCHIVO_ORIG, STORAGE_PATH_ORIG, FORMATO_ARCHIVO, HOJA_SELECCIONADA, TOTAL_FILAS, TOTAL_COLUMNAS, TAMANO_BYTES, VERSION, ESTADO, CARGADO_POR
            ) VALUES (:id, :proy, :nom, :desc, :orig, :path, :fmt, :hoja, :filas, :cols, :bytes, :ver, :est, :user)`,
            {
              id: datasetId,
              proy: params.proyectoId,
              nom: datasetFinal.nombreDataset,
              desc: datasetFinal.descripcion || null,
              orig: datasetFinal.nombreArchivoOrig,
              path: datasetFinal.storagePathOrig,
              fmt: datasetFinal.formatoArchivo,
              hoja: datasetFinal.hojaSeleccionada || null,
              filas: datasetFinal.totalFilas,
              cols: datasetFinal.totalColumnas,
              bytes: datasetFinal.tamanoBytes,
              ver: datasetFinal.version,
              est: datasetFinal.estado,
              user: datasetFinal.cargadoPor,
            }
          );
        } catch (e: any) {
          console.warn('[Oracle DW Replicate Error]:', e.message);
        }
      })();
    }

    return {
      success: true,
      dataset: datasetFinal,
      columnas: columnasDataset,
      carga: nuevaCarga,
      graficosRecomendados: graficosGenerados,
      dashboard,
      estadisticas: {
        totalFilas: validas,
        totalColumnas: columnasDataset.length,
        columnasMetricas: metricCols.length,
        columnasDimensiones: dimCols.length,
      },
    };
  } catch (err: any) {
    nuevaCarga.estado = 'ERROR';
    nuevaCarga.erroresDetalle = [err.message];
    nuevaCarga.fechaFin = new Date().toISOString();
    saveLocalStore(store);

    registrarAuditoria({
      proyectoId: params.proyectoId,
      usuarioEmail: params.usuarioEmail,
      accion: 'ERROR_CARGA_EXCEL',
      entidadAfectada: 'DW_CARGAS',
      idRegistroAfectado: cargaId,
      detallesOperacion: `Fallo procesando ${params.originalFilename}: ${err.message}`,
    });

    return {
      success: false,
      error: `Error al procesar el archivo Excel: ${err.message}`,
      carga: nuevaCarga,
    };
  }
}

// -------------------------------------------------------------
// CONSULTAS ANALÍTICAS Y FILTROS PAGINADOS
// -------------------------------------------------------------

export function getDatasetsDeProyecto(proyectoId: string): DWDataset[] {
  const store = loadLocalStore();
  return store.datasets.filter((d) => d.proyectoId === proyectoId);
}

export function getColumnasDeDataset(datasetId: string): DWColumna[] {
  const store = loadLocalStore();
  return store.columnas.filter((c) => c.datasetId === datasetId);
}

export function getFilasPaginadas(params: {
  datasetId: string;
  pagina?: number;
  tamanoPagina?: number;
  busqueda?: string;
}): {
  filas: Record<string, any>[];
  total: number;
  pagina: number;
  totalPaginas: number;
} {
  const store = loadLocalStore();
  const pagina = Math.max(1, params.pagina || 1);
  const tamano = Math.min(100, Math.max(5, params.tamanoPagina || 20));

  let filasDataset = store.filas
    .filter((f) => f.datasetId === params.datasetId)
    .map((f) => f.payloadStaging);

  if (params.busqueda && params.busqueda.trim()) {
    const q = params.busqueda.trim().toLowerCase();
    filasDataset = filasDataset.filter((r) =>
      Object.values(r).some((v) => v !== null && String(v).toLowerCase().includes(q))
    );
  }

  const total = filasDataset.length;
  const start = (pagina - 1) * tamano;
  const paginated = filasDataset.slice(start, start + tamano);

  return {
    filas: paginated,
    total,
    pagina,
    totalPaginas: Math.ceil(total / tamano) || 1,
  };
}

export function getGraficosDeProyecto(proyectoId: string): DWGrafico[] {
  const store = loadLocalStore();
  return store.graficos.filter((g) => g.proyectoId === proyectoId);
}

export function crearGraficoPersonalizado(data: {
  proyectoId: string;
  datasetId: string;
  titulo: string;
  tipoGrafico: DWGrafico['tipoGrafico'];
  ejeXColumna: string;
  ejeYColumna: string;
  operacionAgregada: DWGrafico['operacionAgregada'];
  paletaColor?: string;
  creadoPor: string;
}): DWGrafico {
  const store = loadLocalStore();
  const filasDataset = store.filas.filter((f) => f.datasetId === data.datasetId);
  const columnasDataset = store.columnas.filter((c) => c.datasetId === data.datasetId);

  const colX = columnasDataset.find((c) => c.nombreOriginal === data.ejeXColumna || c.nombreNormalizado === data.ejeXColumna);
  const colY = columnasDataset.find((c) => c.nombreOriginal === data.ejeYColumna || c.nombreNormalizado === data.ejeYColumna);

  const xKey = colX ? colX.nombreNormalizado : data.ejeXColumna;
  const yKey = colY ? colY.nombreNormalizado : data.ejeYColumna;

  const aggMap = new Map<string, { sum: number; count: number; min: number; max: number }>();

  filasDataset.forEach((f) => {
    const xVal = String(f.payloadStaging[xKey] || 'Sin valor');
    const yVal = Number(f.payloadStaging[yKey]) || 0;

    const curr = aggMap.get(xVal) || { sum: 0, count: 0, min: Infinity, max: -Infinity };
    curr.sum += yVal;
    curr.count += 1;
    if (yVal < curr.min) curr.min = yVal;
    if (yVal > curr.max) curr.max = yVal;
    aggMap.set(xVal, curr);
  });

  const datosCalculados = Array.from(aggMap.entries())
    .map(([label, stats]) => {
      let val = stats.sum;
      if (data.operacionAgregada === 'AVG') val = stats.count > 0 ? stats.sum / stats.count : 0;
      else if (data.operacionAgregada === 'COUNT') val = stats.count;
      else if (data.operacionAgregada === 'MIN') val = stats.min !== Infinity ? stats.min : 0;
      else if (data.operacionAgregada === 'MAX') val = stats.max !== -Infinity ? stats.max : 0;
      return { label, value: Number(val.toFixed(2)) };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  const graficoId = `gra-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const nuevoGrafico: DWGrafico = {
    graficoId,
    proyectoId: data.proyectoId,
    datasetId: data.datasetId,
    titulo: data.titulo.trim(),
    tipoGrafico: data.tipoGrafico,
    ejeXColumna: data.ejeXColumna,
    ejeYColumna: data.ejeYColumna,
    operacionAgregada: data.operacionAgregada,
    paletaColor: data.paletaColor || 'PINTUCO_NAVY',
    ordenDisplay: store.graficos.filter((g) => g.proyectoId === data.proyectoId).length + 1,
    anchoColumnas: data.tipoGrafico === 'PIE_DISTRIBUTION' || data.tipoGrafico === 'DONUT' ? 6 : 6,
    datosCalculados,
    fechaCreacion: new Date().toISOString(),
  };

  store.graficos.push(nuevoGrafico);

  // Vincular al dashboard por defecto
  const dash = store.dashboards.find((d) => d.proyectoId === data.proyectoId && d.esDefault);
  if (dash && !dash.graficosIds.includes(graficoId)) {
    dash.graficosIds.push(graficoId);
    dash.totalWidgets += 1;
  }

  saveLocalStore(store);

  registrarAuditoria({
    proyectoId: data.proyectoId,
    usuarioEmail: data.creadoPor,
    accion: 'CREAR_GRAFICO_BI',
    entidadAfectada: 'DW_GRAFICOS',
    idRegistroAfectado: graficoId,
    detallesOperacion: `Gráfico ${data.titulo} (${data.tipoGrafico}) creado para dataset ${data.datasetId}`,
  });

  return nuevoGrafico;
}

export function getDashboardsDeProyecto(proyectoId: string): DWDashboard[] {
  const store = loadLocalStore();
  return store.dashboards.filter((d) => d.proyectoId === proyectoId);
}

export function getHistorialCargasDeProyecto(proyectoId: string): DWCarga[] {
  const store = loadLocalStore();
  return store.cargas.filter((c) => c.proyectoId === proyectoId);
}

export function getAuditoriaLogs(limite: number = 50): DWAuditoria[] {
  const store = loadLocalStore();
  return store.auditoria.slice(0, limite);
}

export function getIndicadoresResumen(proyectoId: string): {
  totalDatasets: number;
  totalFilas: number;
  totalColumnas: number;
  totalGraficos: number;
  totalCargasExitosas: number;
  metricasClave: { titulo: string; valor: string | number; subtitulo: string }[];
} {
  const store = loadLocalStore();
  const datasets = store.datasets.filter((d) => d.proyectoId === proyectoId);
  const graficos = store.graficos.filter((g) => g.proyectoId === proyectoId);
  const cargas = store.cargas.filter((c) => c.proyectoId === proyectoId);
  const columnas = store.columnas.filter((c) => c.proyectoId === proyectoId);

  const totalFilas = datasets.reduce((acc, d) => acc + d.totalFilas, 0);
  const totalColumnas = columnas.length;
  const exitosas = cargas.filter((c) => c.estado === 'EXITOSO').length;

  const metricCols = columnas.filter((c) => c.esMetrica && c.valorSuma !== undefined);
  const metricasClave = metricCols.slice(0, 4).map((c) => ({
    titulo: c.nombreOriginal,
    valor: c.tipoDato === 'CURRENCY'
      ? `$${(c.valorSuma || 0).toLocaleString('es-CO')}`
      : (c.valorSuma || 0).toLocaleString('es-CO'),
    subtitulo: `Promedio: ${(c.valorPromedio || 0).toLocaleString('es-CO')} | Min: ${c.valorMin ?? 0} | Max: ${c.valorMax ?? 0}`,
  }));

  return {
    totalDatasets: datasets.length,
    totalFilas,
    totalColumnas,
    totalGraficos: graficos.length,
    totalCargasExitosas: exitosas,
    metricasClave,
  };
}
