import {
  DWProyecto,
  DWAcceso,
  DWDataset,
  DWColumna,
  DWCarga,
  DWGrafico,
  DWDashboard,
  DWAuditoria,
  DWOracleHealth,
  DWIndicadoresResumen,
} from '../types/dw';

export async function fetchDWHealth(): Promise<DWOracleHealth> {
  const res = await fetch('/api/dw/health');
  return res.json();
}

export async function testOracleConnection(): Promise<{ success: boolean; message: string; probe?: any }> {
  const res = await fetch('/api/dw/test-oracle-connection', { method: 'POST' });
  return res.json();
}

export async function fetchDWProyectos(userEmail?: string): Promise<DWProyecto[]> {
  const headers: Record<string, string> = {};
  if (userEmail) headers['x-user-email'] = userEmail;
  const res = await fetch('/api/dw/proyectos', { headers });
  const data = await res.json();
  return data.proyectos || [];
}

export async function fetchDWProyectoDetalle(proyectoId: string): Promise<{
  proyecto: DWProyecto;
  miembros: DWAcceso[];
  datasets: DWDataset[];
  graficos: DWGrafico[];
  dashboards: DWDashboard[];
  indicadores: DWIndicadoresResumen;
}> {
  const res = await fetch(`/api/dw/proyectos/${proyectoId}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Error al cargar proyecto');
  return data;
}

export async function crearDWProyecto(data: {
  nombre: string;
  codigoProyecto?: string;
  descripcion?: string;
  categoria?: string;
  userEmail?: string;
}): Promise<DWProyecto> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.userEmail) headers['x-user-email'] = data.userEmail;

  const res = await fetch('/api/dw/proyectos', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Fallo creando proyecto');
  return json.proyecto;
}

export async function asignarDWMiembro(proyectoId: string, data: {
  usuarioEmail: string;
  usuarioNombre?: string;
  rol: DWAcceso['rol'];
  puedeCargar?: boolean;
  puedeEditar?: boolean;
  puedeExportar?: boolean;
  userEmail?: string;
}): Promise<DWAcceso> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.userEmail) headers['x-user-email'] = data.userEmail;

  const res = await fetch(`/api/dw/proyectos/${proyectoId}/miembros`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Error asignando miembro');
  return json.acceso;
}

export async function subirArchivoDataset(
  proyectoId: string,
  archivo: File,
  options?: { datasetName?: string; sheetName?: string; userEmail?: string }
): Promise<{
  success: boolean;
  dataset: DWDataset;
  columnas: DWColumna[];
  carga: DWCarga;
  graficosRecomendados: DWGrafico[];
  dashboard: DWDashboard;
  estadisticas: any;
}> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  if (options?.datasetName) formData.append('datasetName', options.datasetName);
  if (options?.sheetName) formData.append('sheetName', options.sheetName);

  const headers: Record<string, string> = {};
  if (options?.userEmail) headers['x-user-email'] = options.userEmail;

  const res = await fetch(`/api/dw/proyectos/${proyectoId}/datasets`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Error procesando archivo');
  return json;
}

export async function fetchFilasPaginadas(
  datasetId: string,
  pagina: number = 1,
  tamano: number = 20,
  busqueda: string = ''
): Promise<{
  filas: Record<string, any>[];
  total: number;
  pagina: number;
  totalPaginas: number;
}> {
  const params = new URLSearchParams({
    pagina: String(pagina),
    tamano: String(tamano),
    q: busqueda,
  });
  const res = await fetch(`/api/dw/datasets/${datasetId}/filas?${params.toString()}`);
  return res.json();
}

export async function crearGraficoDW(proyectoId: string, data: {
  datasetId: string;
  titulo: string;
  tipoGrafico: DWGrafico['tipoGrafico'];
  ejeXColumna: string;
  ejeYColumna: string;
  operacionAgregada: DWGrafico['operacionAgregada'];
  paletaColor?: string;
  userEmail?: string;
}): Promise<DWGrafico> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.userEmail) headers['x-user-email'] = data.userEmail;

  const res = await fetch(`/api/dw/proyectos/${proyectoId}/graficos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Error creando gráfico');
  return json.grafico;
}

export async function fetchDWAuditoria(): Promise<DWAuditoria[]> {
  const res = await fetch('/api/dw/auditoria?limit=50');
  const data = await res.json();
  return data.logs || [];
}
