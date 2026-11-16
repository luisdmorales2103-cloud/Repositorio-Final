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
  columnaTypedMap: string;
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
  anchoColumnas: number;
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

export interface DWOracleHealth {
  oracleConfigured: boolean;
  oracleConnected: boolean;
  probeResult: {
    isConnected: boolean;
    version?: string;
    serverBanner?: string;
    latencyMs?: number;
    configSummary?: any;
    error?: string;
  };
  connectString: string;
  poolMin: number;
  poolMax: number;
  timestamp: string;
}

export interface DWIndicadoresResumen {
  totalDatasets: number;
  totalFilas: number;
  totalColumnas: number;
  totalGraficos: number;
  totalCargasExitosas: number;
  metricasClave: { titulo: string; valor: string | number; subtitulo: string }[];
}
