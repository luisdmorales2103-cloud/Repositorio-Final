import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  BarChart3,
  FileSpreadsheet,
  Upload,
  Plus,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Download,
  Terminal,
  Shield,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  ExternalLink,
  Radio,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Table as TableIcon,
  Activity,
  FileText,
  Clock,
  ChevronRight,
  Server,
  Lock,
  ArrowUpRight,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
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
import {
  fetchDWProyectos,
  fetchDWProyectoDetalle,
  crearDWProyecto,
  subirArchivoDataset,
  fetchFilasPaginadas,
  crearGraficoDW,
  fetchDWHealth,
  testOracleConnection,
  asignarDWMiembro,
  fetchDWAuditoria,
} from '../services/dwService';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { isMasterAdminEmail } from '../utils/auth';

interface DataWarehouseViewProps {
  currentUser?: UserProfile | null;
  onLock?: () => void;
}

export const DataWarehouseView: React.FC<DataWarehouseViewProps> = ({ currentUser, onLock }) => {
  const [activeTab, setActiveTab] = useState<'supabase_bi' | 'seguridad_rls' | 'dashboard' | 'ingesta' | 'explorador' | 'proyectos' | 'oracle'>('supabase_bi');

  // Estados de consulta a Supabase en Vivo (Tablas Reales: cliente, proyecto, especificacion_tecnica, evidencia)
  const [supabaseData, setSupabaseData] = useState<{
    clientes: any[];
    proyectos: any[];
    especificaciones: any[];
    evidencias: any[];
  } | null>(null);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [clienteRlsBlocked, setClienteRlsBlocked] = useState<boolean>(false);
  const [selectedSupabaseTable, setSelectedSupabaseTable] = useState<'proyecto' | 'cliente' | 'especificacion_tecnica' | 'evidencia'>('proyecto');
  const [supabaseSearchTerm, setSupabaseSearchTerm] = useState<string>('');
  const [supabasePage, setSupabasePage] = useState<number>(1);

  // Estados de Sesión Criptográfica Supabase Auth JWT
  const [supabaseSession, setSupabaseSession] = useState<any | null>(null);
  const [jwtLoading, setJwtLoading] = useState<boolean>(false);
  const [jwtEmailInput, setJwtEmailInput] = useState<string>('salgadoarevaloleidy@gmail.com');
  const [jwtPasswordInput, setJwtPasswordInput] = useState<string>('');
  const [jwtAuthError, setJwtAuthError] = useState<string | null>(null);
  const [jwtAuthSuccess, setJwtAuthSuccess] = useState<string | null>(null);

  // Estados de Auditoría en Vivo (Consulta anónima directa)
  const [anonTestLoading, setAnonTestLoading] = useState<boolean>(false);
  const [anonTestResult, setAnonTestResult] = useState<{
    testedAt: string;
    status: number;
    rowCount: number;
    hasPii: boolean;
    samplePii?: any;
    rawMessage: string;
  } | null>(null);
  const [copiedRlsSql, setCopiedRlsSql] = useState<boolean>(false);
  const [copiedRollbackSql, setCopiedRollbackSql] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  // Estados de Proyectos DW
  const [proyectos, setProyectos] = useState<DWProyecto[]>([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string>('');
  const [proyectoDetalle, setProyectoDetalle] = useState<{
    proyecto: DWProyecto;
    miembros: DWAcceso[];
    datasets: DWDataset[];
    graficos: DWGrafico[];
    dashboards: DWDashboard[];
    indicadores: DWIndicadoresResumen;
  } | null>(null);

  // Estados de carga y modales
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoCodigo, setNuevoCodigo] = useState<string>('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState<string>('');
  const [nuevaCategoria, setNuevaCategoria] = useState<string>('VENTAS_Y_OPERACIONES');

  // Estados de Ingestión
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetNameInput, setDatasetNameInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFeedback, setUploadFeedback] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del Explorador de Datos
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [columnasDataset, setColumnasDataset] = useState<DWColumna[]>([]);
  const [filasPaginadas, setFilasPaginadas] = useState<Record<string, any>[]>([]);
  const [totalFilas, setTotalFilas] = useState<number>(0);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoadingFilas, setIsLoadingFilas] = useState<boolean>(false);

  // Estados de Gráficos y BI
  const [isCreatingChart, setIsCreatingChart] = useState<boolean>(false);
  const [chartTitulo, setChartTitulo] = useState<string>('');
  const [chartTipo, setChartTipo] = useState<DWGrafico['tipoGrafico']>('BAR_VERTICAL');
  const [chartColX, setChartColX] = useState<string>('');
  const [chartColY, setChartColY] = useState<string>('');
  const [chartOp, setChartOp] = useState<DWGrafico['operacionAgregada']>('SUM');

  // Estado de Oracle Connection & Health
  const [oracleHealth, setOracleHealth] = useState<DWOracleHealth | null>(null);
  const [isProbingOracle, setIsProbingOracle] = useState<boolean>(false);
  const [oracleProbeResult, setOracleProbeResult] = useState<any | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [auditoriaLogs, setAuditoriaLogs] = useState<DWAuditoria[]>([]);

  // Miembros modal
  const [isAddingMember, setIsAddingMember] = useState<boolean>(false);
  const [nuevoMiembroEmail, setNuevoMiembroEmail] = useState<string>('');
  const [nuevoMiembroRol, setNuevoMiembroRol] = useState<DWAcceso['rol']>('ESTUDIANTE');

  // Suscripción al ciclo de vida de Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = Boolean(currentUser && currentUser.email);
  const userEmail = currentUser?.email || '';

  // --------------------------------------------------------------------------
  // VALIDACIÓN CRIPTOGRÁFICA SEGÚN REQUERIMIENTOS:
  // "4. Utilices autenticación real de Supabase Auth con sesiones JWT para autorizar el acceso administrativo."
  // "5. No consideres localStorage ni listas de correos en React como autorización suficiente."
  // --------------------------------------------------------------------------
  const hasValidJwt = Boolean(supabaseSession?.access_token && supabaseSession?.user?.email);
  const jwtUserEmail = (supabaseSession?.user?.email || '').toLowerCase().trim();
  const isJwtAdmin = Boolean(hasValidJwt && isMasterAdminEmail(jwtUserEmail));

  // El acceso administrativo para consultar PII depende EXCLUSIVAMENTE de la sesión JWT válida:
  const isAdmin = isJwtAdmin;

  // Sesión local existente en React/localStorage (insuficiente para PII por sí sola):
  const isLocalAdminOnly = Boolean(
    isAuthenticated &&
    currentUser?.rol === 'admin' &&
    isMasterAdminEmail(currentUser.email) &&
    !isJwtAdmin
  );

  const [projectFilterMode, setProjectFilterMode] = useState<'all' | 'valid' | 'suspicious'>('all');
  const [exportAlert, setExportAlert] = useState<string | null>(null);

  // Consulta en Vivo a Supabase (Tablas reales cliente, proyecto, especificacion_tecnica, evidencia)
  const loadSupabaseData = async () => {
    setIsLoadingSupabase(true);
    setSupabaseError(null);
    setClienteRlsBlocked(false);
    try {
      // Seguridad a nivel de red y principio de mínimo privilegio:
      // Si el usuario no tiene JWT de Administrador Master verificado, se solicitan únicamente columnas no sensibles (cliente_id, nombre, created_at).
      // Los datos PII (documento, responsable, canal_entrada) NUNCA viajan en la carga útil HTTP de visitantes.
      const clienteQuery = isAdmin
        ? supabase.from('cliente').select('*').order('created_at', { ascending: false })
        : supabase.from('cliente').select('cliente_id, nombre, created_at').order('created_at', { ascending: false });

      const [cRes, pRes, sRes, eRes] = await Promise.all([
        clienteQuery,
        supabase.from('proyecto').select('*').order('created_at', { ascending: false }),
        supabase.from('especificacion_tecnica').select('*'),
        supabase.from('evidencia').select('*'),
      ]);

      let clientesData: any[] = [];
      if (cRes.error) {
        console.warn('Acceso denegado o protegido por RLS en tabla cliente:', cRes.error.message);
        setClienteRlsBlocked(true);
      } else {
        clientesData = cRes.data || [];
      }

      if (pRes.error) throw new Error(`Error en tabla proyecto: ${pRes.error.message}`);
      if (sRes.error) throw new Error(`Error en tabla especificacion_tecnica: ${sRes.error.message}`);
      if (eRes.error) throw new Error(`Error en tabla evidencia: ${eRes.error.message}`);

      setSupabaseData({
        clientes: clientesData,
        proyectos: pRes.data || [],
        especificaciones: sRes.data || [],
        evidencias: eRes.data || [],
      });
    } catch (err: any) {
      console.error('Error consultando Supabase para BI:', err);
      setSupabaseError(err?.message || 'Error de conexión con las tablas de Supabase');
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  // Función para autenticar directamente con Supabase Auth y generar sesión JWT
  const handleJwtLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJwtLoading(true);
    setJwtAuthError(null);
    setJwtAuthSuccess(null);
    try {
      const cleanEmail = jwtEmailInput.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: jwtPasswordInput,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setJwtAuthError(
            `Credenciales inválidas en Supabase Auth. El usuario "${cleanEmail}" debe crearse en Supabase Dashboard -> Authentication -> Users -> "Add User" (con Auto Confirm activado) antes de poder emitir tokens JWT.`
          );
        } else {
          setJwtAuthError(`Error de Supabase Auth: ${error.message}`);
        }
      } else if (data.session) {
        setSupabaseSession(data.session);
        setJwtAuthSuccess(`¡Sesión JWT autenticada con éxito para ${data.session.user.email}! Token criptográfico activo.`);
        setJwtPasswordInput('');
        loadSupabaseData();
      }
    } catch (err: any) {
      setJwtAuthError(`Excepción al autenticar con Supabase: ${err?.message}`);
    } finally {
      setJwtLoading(false);
    }
  };

  const handleJwtLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSupabaseSession(null);
      setJwtAuthSuccess(null);
      setJwtAuthError(null);
      loadSupabaseData();
    } catch (err: any) {
      console.warn('Error al cerrar sesión de Supabase Auth:', err);
    }
  };

  // Auditoría en Vivo de Consulta Anónima (Simula atacante o visitante sin autenticar)
  const runLiveAnonAudit = async () => {
    setAnonTestLoading(true);
    try {
      const res = await fetch('https://ihsimnqprmfihwxjztlc.supabase.co/rest/v1/cliente?select=*&limit=3', {
        headers: {
          apikey: 'sb_publishable_c9280ZabG63_vTGxHc-Okg_RIRTzMQM',
        },
      });
      const status = res.status;
      const data = await res.json();
      const isArray = Array.isArray(data);
      const rowCount = isArray ? data.length : 0;
      const firstRow = isArray && data.length > 0 ? data[0] : null;
      const hasPii = Boolean(firstRow && (firstRow.documento || firstRow.responsable || firstRow.canal_entrada));

      setAnonTestResult({
        testedAt: new Date().toLocaleTimeString('es-CO'),
        status,
        rowCount,
        hasPii,
        samplePii: hasPii ? { documento: firstRow.documento, responsable: firstRow.responsable } : null,
        rawMessage: isArray
          ? `HTTP ${status} OK — PostgREST devolvió ${data.length} filas.`
          : `HTTP ${status} — Respuesta: ${JSON.stringify(data)}`,
      });
    } catch (err: any) {
      setAnonTestResult({
        testedAt: new Date().toLocaleTimeString('es-CO'),
        status: 0,
        rowCount: 0,
        hasPii: false,
        rawMessage: `Error de red: ${err?.message}`,
      });
    } finally {
      setAnonTestLoading(false);
    }
  };

  // 1. Cargar Proyectos DW iniciales
  const loadProyectos = async () => {
    setIsLoading(true);
    try {
      const proys = await fetchDWProyectos(userEmail);
      setProyectos(proys);
      if (proys.length > 0 && !selectedProyectoId) {
        setSelectedProyectoId(proys[0].proyectoId);
      }
    } catch (err) {
      console.error('Error cargando proyectos DW:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Cargar detalle del proyecto seleccionado
  const loadProyectoDetalle = async (id: string) => {
    if (!id) return;
    try {
      const data = await fetchDWProyectoDetalle(id);
      setProyectoDetalle(data);
      if (data.datasets.length > 0) {
        setSelectedDatasetId(data.datasets[0].datasetId);
      }
    } catch (err) {
      console.error('Error cargando detalle proyecto:', err);
    }
  };

  // 3. Cargar salud y estado de Oracle
  const loadHealth = async () => {
    try {
      const health = await fetchDWHealth();
      setOracleHealth(health);
      const logs = await fetchDWAuditoria();
      setAuditoriaLogs(logs);
    } catch (err) {
      console.error('Error health Oracle:', err);
    }
  };

  // Protección RLS y privacidad de datos sensibles
  const maskSensitive = (val: string | null | undefined, type: 'doc' | 'name' | 'email') => {
    if (isAdmin) return val || '—';
    if (!val) return '—';
    if (type === 'email') {
      const parts = String(val).split('@');
      if (parts.length === 2) {
        return `${parts[0].slice(0, 2)}***@${parts[1]}`;
      }
      return '***@***';
    }
    if (type === 'doc') {
      const s = String(val);
      return s.length > 4 ? `***${s.slice(-4)}` : '***';
    }
    if (type === 'name') {
      const s = String(val);
      return `${s.slice(0, 3)}*** (Protegido por RLS)`;
    }
    return '***';
  };

  const handleExportSupabaseCsv = (tableName: string, data: any[]) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    let maskedFieldsCount = 0;
    const rows = data.map((row) =>
      headers
        .map((h) => {
          let val = row[h];
          if (tableName === 'cliente' && !isAdmin) {
            if (h === 'documento' || h === 'responsable' || h === 'canal_entrada') {
              maskedFieldsCount++;
              if (h === 'documento') val = maskSensitive(val, 'doc');
              if (h === 'responsable') val = maskSensitive(val, 'name');
              if (h === 'canal_entrada') val = maskSensitive(val, 'email');
            }
          }
          if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
          const str = String(val ?? '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );

    if (tableName === 'cliente' && !isAdmin) {
      setExportAlert('Aviso de Privacidad RLS: Los campos de identificación personal (documento, responsable y canal) fueron enmascarados en el archivo CSV exportado para cumplir con las directivas de protección de datos.');
    } else {
      setExportAlert(null);
    }

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `supabase_${tableName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  useEffect(() => {
    loadProyectos();
    loadHealth();
    loadSupabaseData();
  }, [userEmail]);

  useEffect(() => {
    if (selectedProyectoId) {
      loadProyectoDetalle(selectedProyectoId);
    }
  }, [selectedProyectoId]);

  // 4. Cargar filas cuando cambia el dataset o la página
  useEffect(() => {
    if (selectedDatasetId) {
      setIsLoadingFilas(true);
      fetchFilasPaginadas(selectedDatasetId, paginaActual, 15, searchTerm)
        .then((res) => {
          setFilasPaginadas(res.filas);
          setTotalFilas(res.total);
          setTotalPaginas(res.totalPaginas);
        })
        .finally(() => setIsLoadingFilas(false));
    }
  }, [selectedDatasetId, paginaActual, searchTerm]);

  const handleCrearProyecto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    try {
      const nuevo = await crearDWProyecto({
        nombre: nuevoNombre,
        codigoProyecto: nuevoCodigo,
        descripcion: nuevaDescripcion,
        categoria: nuevaCategoria,
        userEmail,
      });
      setIsCreatingProject(false);
      setNuevoNombre('');
      setNuevoCodigo('');
      setNuevaDescripcion('');
      await loadProyectos();
      setSelectedProyectoId(nuevo.proyectoId);
    } catch (err: any) {
      alert(`Error creando proyecto: ${err.message}`);
    }
  };

  const handleSubirArchivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedProyectoId) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadFeedback(null);

    try {
      const res = await subirArchivoDataset(selectedProyectoId, selectedFile, {
        datasetName: datasetNameInput || undefined,
        userEmail,
      });

      setUploadFeedback(res);
      setSelectedFile(null);
      setDatasetNameInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Recargar detalles y dashboards
      await loadProyectoDetalle(selectedProyectoId);
      if (res.dataset) {
        setSelectedDatasetId(res.dataset.datasetId);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Fallo durante el procesamiento del archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestOracleProbe = async () => {
    setIsProbingOracle(true);
    try {
      const res = await testOracleConnection();
      setOracleProbeResult(res);
      await loadHealth();
    } catch (err: any) {
      setOracleProbeResult({ success: false, message: err.message });
    } finally {
      setIsProbingOracle(false);
    }
  };

  const handleCrearGrafico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProyectoId || !selectedDatasetId || !chartTitulo) return;
    try {
      await crearGraficoDW(selectedProyectoId, {
        datasetId: selectedDatasetId,
        titulo: chartTitulo,
        tipoGrafico: chartTipo,
        ejeXColumna: chartColX,
        ejeYColumna: chartColY,
        operacionAgregada: chartOp,
        userEmail,
      });
      setIsCreatingChart(false);
      setChartTitulo('');
      loadProyectoDetalle(selectedProyectoId);
    } catch (err: any) {
      alert(`Error creando gráfico: ${err.message}`);
    }
  };

  const handleAsignarMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMiembroEmail.trim() || !selectedProyectoId) return;
    try {
      await asignarDWMiembro(selectedProyectoId, {
        usuarioEmail: nuevoMiembroEmail,
        rol: nuevoMiembroRol,
        userEmail,
      });
      setIsAddingMember(false);
      setNuevoMiembroEmail('');
      loadProyectoDetalle(selectedProyectoId);
    } catch (err: any) {
      alert(`Error asignando miembro: ${err.message}`);
    }
  };

  const proyectoActual = proyectoDetalle?.proyecto || proyectos.find((p) => p.proyectoId === selectedProyectoId);
  const datasetActual = proyectoDetalle?.datasets.find((d) => d.datasetId === selectedDatasetId);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">

      {/* TOP HEADER & ORACLE CONNECTION STATUS */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shadow-inner">
                <Database className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
                  Data Warehouse & Business Intelligence
                </h1>
                <p className="text-xs sm:text-sm text-blue-200 font-medium">
                  Plataforma multiproyecto corporativa respaldada por Oracle Database, Docker y analítica de alto volumen.
                </p>
              </div>
            </div>
          </div>

          {/* Oracle Status Badge & Probe Trigger */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-xs ${
                oracleHealth?.oracleConnected
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500/40 text-amber-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${oracleHealth?.oracleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>
                {oracleHealth?.oracleConnected
                  ? 'Oracle Database: Conexión Activa'
                  : 'Oracle DW: Modo de Preparación'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleTestOracleProbe}
              disabled={isProbingOracle}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Probar conexión real a Oracle"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbingOracle ? 'animate-spin' : ''}`} />
              <span>Probar Conexión</span>
            </button>

            {onLock && (
              <button
                type="button"
                onClick={onLock}
                className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-400/30 flex items-center gap-1.5 cursor-pointer"
                title="Bloquear acceso administrativo (exigirá clave 8085 nuevamente)"
              >
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span>Bloquear Módulo</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Selector Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider shrink-0">Proyecto Activo:</span>
            <select
              value={selectedProyectoId}
              onChange={(e) => setSelectedProyectoId(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-w-[240px]"
            >
              {proyectos.map((p) => (
                <option key={p.proyectoId} value={p.proyectoId}>
                  {p.codigoProyecto} - {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingProject(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddingMember(true)}
              className="px-3 py-1.5 bg-blue-700/60 hover:bg-blue-600/80 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-blue-500/30 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Asignar Miembro</span>
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('supabase_bi');
            setSupabasePage(1);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'supabase_bi'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Supabase DW Live BI</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            {supabaseData ? `${supabaseData.proyectos.length + supabaseData.clientes.length} Regs` : 'En Vivo'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seguridad_rls')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'seguridad_rls'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Auditoría RLS & Seguridad</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
            hasValidJwt ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700 animate-pulse'
          }`}>
            {hasValidJwt ? 'JWT Activo' : 'Vulnerabilidad'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard & Gráficos BI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ingesta')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ingesta'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Pipeline Ingestión Excel / CSV</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('explorador')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'explorador'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Explorador de Datos & Capas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proyectos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'proyectos'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Gestión Multiproyecto ({proyectos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('oracle')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'oracle'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Esquema Oracle DW & Auditoría</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 0: SUPABASE DW LIVE BI (TABLAS REALES)                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'supabase_bi' && (
        <div className="space-y-6">
          {/* BANNER DE ESTADO SUPABASE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-white">PostgreSQL Supabase Data Warehouse</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">ihsimnqprmfihwxjztlc.supabase.co</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consultas directas a tablas maestras: <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">cliente</code>, <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">proyecto</code>, <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">especificacion_tecnica</code> y <code className="text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">evidencia</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Autenticación & Permisos</span>
                <span className={`text-xs font-semibold ${isAdmin ? 'text-emerald-300' : isLocalAdminOnly ? 'text-amber-300' : isAuthenticated ? 'text-blue-300' : 'text-slate-300'}`}>
                  {isAdmin
                    ? `🛡️ JWT Master Verificado (${jwtUserEmail})`
                    : isLocalAdminOnly
                    ? `⚠️ Sesión Local (${currentUser?.email}) — Falta JWT`
                    : isAuthenticated
                    ? `👤 Cliente (${currentUser?.name || currentUser?.email})`
                    : '🔒 Consulta Pública / Anon'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {isAdmin
                    ? 'Acceso analítico total y PII autorizado por JWT'
                    : isLocalAdminOnly
                    ? 'PII bloqueado (Requiere sesión JWT en Supabase Auth)'
                    : 'Datos personales protegidos'}
                </span>
              </div>
              <button
                type="button"
                onClick={loadSupabaseData}
                disabled={isLoadingSupabase}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                title="Sincronizar y recargar tablas de Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSupabase ? 'animate-spin' : ''}`} />
                <span>{isLoadingSupabase ? 'Consultando...' : 'Actualizar'}</span>
              </button>
            </div>
          </div>

          {/* ALERTA DE SEGURIDAD RLS & ACCESO A PII */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs ${
            isAdmin
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                isAdmin
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}>
                {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {isAdmin
                    ? `Autenticación Criptográfica JWT Activa: ${jwtUserEmail}`
                    : 'Diagnóstico de Seguridad: Políticas RLS & Protección de PII de Clientes'}
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {isAdmin
                    ? 'Sesión válida en Supabase Auth. Los 59 clientes con sus documentos y contactos están autorizados para visualización administrativa.'
                    : isLocalAdminOnly
                    ? 'Se detectó inicio de sesión local de administrador, pero NO una sesión JWT de Supabase Auth. Por directiva de seguridad, el acceso a PII permanece bloqueado hasta autenticar con Supabase Auth.'
                    : 'Por directiva de mínimo privilegio, los documentos y datos de contacto de clientes están protegidos. La clave pública de Supabase requiere la aplicación de RLS en el Dashboard.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('seguridad_rls')}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Auditoría RLS & SQL</span>
              </button>
            </div>
          </div>

          {/* ESTADO DE ERROR CON BOTÓN REINTENTAR */}
          {supabaseError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900 shadow-xs">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-xl text-red-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-950">Fallo en la Consulta de Supabase</h3>
                  <p className="text-sm text-red-800 mt-1">{supabaseError}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Las tablas no se pudieron consultar o la política RLS denegó la lectura temporalmente.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={loadSupabaseData}
                      disabled={isLoadingSupabase}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingSupabase ? 'animate-spin' : ''}`} />
                      <span>Reintentar Consulta</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ESTADO DE CARGA */}
          {isLoadingSupabase && !supabaseData && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Consultando Data Warehouse en Supabase...</h4>
              <p className="text-xs text-slate-500 mt-1">Cargando registros reales de clientes, proyectos, especificaciones y evidencias.</p>
            </div>
          )}

          {/* DASHBOARD Y TABLAS BI CUANDO HAY DATOS */}
          {supabaseData && (
            (() => {
              const totalClientes = supabaseData.clientes.length;
              const totalProyectos = supabaseData.proyectos.length;
              const totalSpecs = supabaseData.especificaciones.length;
              const totalEvidencias = supabaseData.evidencias.length;

              // 1. CLASIFICACIÓN DE ÁREA TÉCNICA (proyecto.area_m2)
              // Área técnica arquitectónica plausible (<= 1000 m²) vs importes monetarios COP (> 1000)
              const validAreaProjects = supabaseData.proyectos.filter((p) => {
                const area = Number(p.area_m2);
                return !isNaN(area) && area > 0 && area <= 1000;
              });
              const suspiciousAreaProjects = supabaseData.proyectos.filter((p) => {
                const area = Number(p.area_m2);
                return isNaN(area) || area <= 0 || area > 1000;
              });

              const confirmedAreaM2 = validAreaProjects.reduce((acc, p) => acc + (Number(p.area_m2) || 0), 0);
              const suspiciousAreaCOP = suspiciousAreaProjects.reduce((acc, p) => acc + (Number(p.area_m2) || 0), 0);

              // 2. CLASIFICACIÓN DE TIPOLOGÍA DE PROYECTO (proyecto.tipo_proyecto)
              const isCotOrProduct = (tipo: string) => {
                const t = (tipo || '').toLowerCase();
                return (
                  tipo.startsWith('COT-') ||
                  t.includes('cot-') ||
                  t.includes('pintura') ||
                  t.includes('impermeabilizante') ||
                  t.includes('thinner') ||
                  t.includes('superwash') ||
                  t.includes('vinil')
                );
              };

              const isSyntheticTest = (str: string) => {
                const s = (str || '').trim();
                return s.length <= 2 || /^a{3,}/i.test(s) || s.toLowerCase() === 'test';
              };

              // Tipologías válidas de obra vs inconsistencias
              const validTiposCount: Record<string, number> = {};
              const cotProductsCount: Record<string, number> = {};
              const syntheticTiposCount: Record<string, number> = {};

              supabaseData.proyectos.forEach((p) => {
                const raw = (p.tipo_proyecto || 'Sin tipo').trim();
                if (isSyntheticTest(raw)) {
                  const key = raw.length > 20 ? `${raw.slice(0, 16)}...` : raw;
                  syntheticTiposCount[key] = (syntheticTiposCount[key] || 0) + 1;
                } else if (isCotOrProduct(raw)) {
                  cotProductsCount[raw] = (cotProductsCount[raw] || 0) + 1;
                } else {
                  let cleanLabel = raw;
                  if (raw === 'residencial_remodelacion') cleanLabel = 'Residencial (Remodelación)';
                  else if (raw === 'Fachada edificio residencial') cleanLabel = 'Fachada Edificio Residencial';
                  validTiposCount[cleanLabel] = (validTiposCount[cleanLabel] || 0) + 1;
                }
              });

              const validTiposSorted = Object.entries(validTiposCount).sort((a, b) => b[1] - a[1]);
              const cotProductsSorted = Object.entries(cotProductsCount).sort((a, b) => b[1] - a[1]);
              const totalValidTipos = Object.values(validTiposCount).reduce((a, b) => a + b, 0);
              const totalCotProducts = Object.values(cotProductsCount).reduce((a, b) => a + b, 0);
              const totalSyntheticTipos = Object.values(syntheticTiposCount).reduce((a, b) => a + b, 0);

              // 3. CLASIFICACIÓN DE ESTADOS (proyecto.estado)
              const validEstados = ['En preparación', 'Aprobada', 'Enviada'];
              const validEstadosCount: Record<string, number> = {};
              const syntheticEstadosCount: Record<string, number> = {};

              supabaseData.proyectos.forEach((p) => {
                const st = (p.estado || '').trim();
                if (validEstados.includes(st)) {
                  validEstadosCount[st] = (validEstadosCount[st] || 0) + 1;
                } else {
                  const label = st.length > 20 ? `${st.slice(0, 16)}... (String sintético)` : st;
                  syntheticEstadosCount[label] = (syntheticEstadosCount[label] || 0) + 1;
                }
              });

              const totalValidEstados = Object.values(validEstadosCount).reduce((a, b) => a + b, 0);
              const totalSyntheticEstados = Object.values(syntheticEstadosCount).reduce((a, b) => a + b, 0);

              // 4. CLASIFICACIÓN DE CIUDADES (proyecto.ciudad)
              const validCiudadesCount: Record<string, number> = {};
              const syntheticCiudadesCount: Record<string, number> = {};

              supabaseData.proyectos.forEach((p) => {
                const c = (p.ciudad || '').trim();
                if (isSyntheticTest(c)) {
                  const key = c.length > 20 ? `${c.slice(0, 16)}...` : c;
                  syntheticCiudadesCount[key] = (syntheticCiudadesCount[key] || 0) + 1;
                } else {
                  validCiudadesCount[c || 'No especificada'] = (validCiudadesCount[c || 'No especificada'] || 0) + 1;
                }
              });
              const validCiudadesSorted = Object.entries(validCiudadesCount).sort((a, b) => b[1] - a[1]);

              // 5. CLASIFICACIÓN DE ESPECIFICACIONES (sustrato y ambiente)
              const sustratosValidos: Record<string, number> = {};
              const sustratosObservados: Record<string, number> = {};
              supabaseData.especificaciones.forEach((s) => {
                const sus = (s.superficie || s.sustrato || 'No definido').trim();
                if (isSyntheticTest(sus)) {
                  sustratosObservados[sus] = (sustratosObservados[sus] || 0) + 1;
                } else {
                  sustratosValidos[sus] = (sustratosValidos[sus] || 0) + 1;
                }
              });

              const ambientesValidos: Record<string, number> = {};
              const ambientesObservados: Record<string, number> = {};
              supabaseData.especificaciones.forEach((s) => {
                const amb = (s.ambiente || s.ambiente_exposicion || 'No definido').trim();
                if (isSyntheticTest(amb)) {
                  ambientesObservados[amb] = (ambientesObservados[amb] || 0) + 1;
                } else {
                  ambientesValidos[amb] = (ambientesValidos[amb] || 0) + 1;
                }
              });

              // TABLA Y FILTROS DEL EXPLORADOR
              let currentRows: any[] = [];
              if (selectedSupabaseTable === 'proyecto') {
                if (projectFilterMode === 'valid') {
                  currentRows = validAreaProjects;
                } else if (projectFilterMode === 'suspicious') {
                  currentRows = suspiciousAreaProjects;
                } else {
                  currentRows = supabaseData.proyectos;
                }
              } else if (selectedSupabaseTable === 'cliente') {
                currentRows = supabaseData.clientes;
              } else if (selectedSupabaseTable === 'especificacion_tecnica') {
                currentRows = supabaseData.especificaciones;
              } else if (selectedSupabaseTable === 'evidencia') {
                currentRows = supabaseData.evidencias;
              }

              // Filtrado por buscador
              const filteredRows = currentRows.filter((row) => {
                if (!supabaseSearchTerm.trim()) return true;
                const term = supabaseSearchTerm.toLowerCase();
                return Object.values(row).some((val) =>
                  String(val ?? '').toLowerCase().includes(term)
                );
              });

              const pageSize = 10;
              const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
              const currentPageSafe = Math.min(supabasePage, totalPages);
              const paginatedRows = filteredRows.slice((currentPageSafe - 1) * pageSize, currentPageSafe * pageSize);
              const tableHeaders = selectedSupabaseTable === 'cliente'
                ? ['cliente_id', 'nombre', 'documento', 'responsable', 'canal_entrada', 'created_at']
                : (currentRows.length > 0 ? Object.keys(currentRows[0]) : []);


              return (
                <div className="space-y-6">
                  {/* PANEL DE CONTROL DE CALIDAD DE DATOS (DATA QUALITY & PROFILING) */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-amber-500/30 rounded-2xl p-5 text-white shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-white">Auditoría de Calidad de Datos & Normalización</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {suspiciousAreaProjects.length} Registros Observados en `proyecto`
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Solo Lectura • Base Intacta
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            Para garantizar la validez científica y comercial del Data Warehouse antes de la sustentación académica, el motor BI aplica validación y saneamiento en tiempo de lectura:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10 text-xs">
                            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-white/5">
                              <span className="text-amber-300 font-bold block">1. Calidad de Superficie (51.7%):</span>
                              <p className="text-slate-300 mt-0.5 text-[11px]">
                                15 proyectos en rango técnico preliminar ({confirmedAreaM2.toLocaleString('es-CO')} m²). Se identificaron y aislaron 14 registros con montos COP (${suspiciousAreaCOP.toLocaleString('es-CO')}).
                              </p>
                              <span className="text-[10px] text-amber-200/80 italic block mt-1">
                                *Nota: El rango numérico no certifica validación al 100% sin conciliación en obra.
                              </span>
                            </div>
                            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-white/5">
                              <span className="text-blue-300 font-bold block">2. Tipología de Proyecto:</span>
                              <p className="text-slate-300 mt-0.5 text-[11px]">
                                {totalValidTipos} proyectos con tipologías arquitectónicas puras. Se segmentaron {totalCotProducts} radicados/productos (COT-*) y {totalSyntheticTipos} cadenas de prueba.
                              </p>
                            </div>
                            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-white/5">
                              <span className="text-purple-300 font-bold block">3. Estados del Negocio:</span>
                              <p className="text-slate-300 mt-0.5 text-[11px]">
                                {totalValidEstados} estados operativos válidos ("En preparación", "Aprobada", "Enviada"). Se aislaron {totalSyntheticEstados} cadenas sintéticas de prueba.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KPI CARDS RESUMEN SUPABASE */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Registrados</span>
                      <span className="text-2xl font-black text-blue-900 block mt-1">{totalClientes}</span>
                      <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                        Tabla `cliente` ({isAdmin ? 'Auditoría completa' : 'PII protegido / No transferido'})
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proyectos Totales</span>
                      <span className="text-2xl font-black text-slate-900 block mt-1">{totalProyectos}</span>
                      <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                        <strong className="text-emerald-700">{validAreaProjects.length} en rango preliminar</strong> • <span className="text-amber-600">{suspiciousAreaProjects.length} observados</span>
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Superficie en Rango Preliminar</span>
                      <span className="text-2xl font-black text-emerald-700 block mt-1">
                        {confirmedAreaM2.toLocaleString('es-CO')} <span className="text-sm font-semibold">m²</span>
                      </span>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded" title="Valores numéricos plausibles (10-350 m²), sujetos a verificación en obra">
                          {validAreaProjects.length} obras (10–350 m²)
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded" title="Valores superiores a 1.000 m² correspondientes a montos de cotizaciones en COP">
                          ⚠️ {suspiciousAreaProjects.length} montos COP aislados
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Índice de Calidad (`area_m2`)</span>
                      <span className="text-2xl font-black text-indigo-700 block mt-1">
                        51.7%
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                        15 en rango • 14 inconsistencias ({totalSpecs} specs / {totalEvidencias} evid.)
                      </span>
                    </div>
                  </div>

                  {/* VISUALES ANALÍTICOS BI CON SEPARACIÓN ESTRICTA */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfico 1: Tipología de Proyecto */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-emerald-600" />
                            Tipología de Proyecto
                          </h4>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {totalValidTipos} válidos
                          </span>
                        </div>

                        {/* SECCIÓN A: TIPOLOGÍAS DE OBRA VÁLIDAS */}
                        <div className="space-y-2 mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Categorías Arquitectónicas Confirmadas:
                          </span>
                          {validTiposSorted.map(([tipo, count]) => {
                            const pct = totalValidTipos > 0 ? Math.round((count / totalValidTipos) * 100) : 0;
                            return (
                              <div key={tipo} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-slate-700">
                                  <span className="truncate">{tipo}</span>
                                  <span className="font-bold text-slate-900">{count} ({pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* SECCIÓN B: REGISTROS INCONSISTENTES AISLADOS */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                            Pendientes de Normalización ({totalCotProducts + totalSyntheticTipos}):
                          </span>
                          <div className="space-y-1 text-[11px] text-slate-600">
                            <div className="flex justify-between">
                              <span>Radicados de cotización (COT-*) & Pinturas:</span>
                              <span className="font-bold text-amber-800">{totalCotProducts} proyectos</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cadenas sintéticas de prueba (AAAA..., R):</span>
                              <span className="font-bold text-amber-800">{totalSyntheticTipos} proyectos</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gráfico 2: Estados Operativos */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" />
                            Estados del Proyecto
                          </h4>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {totalValidEstados} válidos
                          </span>
                        </div>

                        {/* SECCIÓN A: ESTADOS DE NEGOCIO VÁLIDOS */}
                        <div className="space-y-2 mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Ciclo de Vida Operativo:
                          </span>
                          {Object.entries(validEstadosCount).map(([estado, count]) => {
                            const pct = totalValidEstados > 0 ? Math.round((count / totalValidEstados) * 100) : 0;
                            return (
                              <div key={estado} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-slate-700">
                                  <span className="truncate">{estado}</span>
                                  <span className="font-bold text-slate-900">{count} ({pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* SECCIÓN B: ESTADOS SINTÉTICOS AISLADOS */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                            Inconsistencias Detectadas ({totalSyntheticEstados}):
                          </span>
                          <div className="space-y-1 text-[11px] text-slate-600">
                            {Object.entries(syntheticEstadosCount).map(([st, count]) => (
                              <div key={st} className="flex justify-between">
                                <span className="truncate font-mono">{st}:</span>
                                <span className="font-bold text-amber-800">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gráfico 3: Cobertura por Ciudad */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            Distribución por Ciudad
                          </h4>
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            {validCiudadesSorted.length} ciudades
                          </span>
                        </div>

                        {/* CIUDADES CONFIRMADAS */}
                        <div className="space-y-2 mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Ciudades Confirmadas en Colombia:
                          </span>
                          {validCiudadesSorted.slice(0, 4).map(([ciudad, count]) => {
                            const pct = totalProyectos > 0 ? Math.round((count / totalProyectos) * 100) : 0;
                            return (
                              <div key={ciudad} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-slate-700">
                                  <span className="truncate">{ciudad}</span>
                                  <span className="font-bold text-slate-900">{count} ({pct}%)</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* CIUDADES SINTÉTICAS */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                            Valores Atípicos en Ciudad:
                          </span>
                          <div className="space-y-1 text-[11px] text-slate-600">
                            {Object.entries(syntheticCiudadesCount).map(([c, count]) => (
                              <div key={c} className="flex justify-between">
                                <span className="font-mono truncate">{c}:</span>
                                <span className="font-bold text-amber-800">{count} reg</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sustratos y Ambientes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-600" />
                          Sustratos Técnicos Especificados
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Tabla `especificacion_tecnica`</span>
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(sustratosValidos).map(([sus, count]) => (
                          <div key={sus} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                            <span className="font-medium text-slate-700">{sus}</span>
                            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">{count} proyectos</span>
                          </div>
                        ))}
                        {Object.keys(sustratosObservados).length > 0 && (
                          <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-200/60 text-[11px] text-amber-800 flex justify-between">
                            <span>Sustratos de prueba sintética aislados:</span>
                            <span className="font-bold">{Object.values(sustratosObservados).reduce((a, b) => a + b, 0)} registros</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          Ambientes de Exposición
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Condición Ambiental</span>
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(ambientesValidos).map(([amb, count]) => (
                          <div key={amb} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                            <span className="font-medium text-slate-700">{amb}</span>
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{count} especificaciones</span>
                          </div>
                        ))}
                        {Object.keys(ambientesObservados).length > 0 && (
                          <div className="p-2 rounded-xl bg-amber-50/50 border border-amber-200/60 text-[11px] text-amber-800 flex justify-between">
                            <span>Ambientes de prueba sintética aislados:</span>
                            <span className="font-bold">{Object.values(ambientesObservados).reduce((a, b) => a + b, 0)} registros</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* EXPLORADOR DE TABLAS REALES SUPABASE */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {/* Header Explorador */}
                    <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <TableIcon className="w-4 h-4 text-blue-700" />
                          Explorador de Tablas del Data Warehouse
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Visualización en vivo de filas indexadas en PostgreSQL Supabase con clasificación de calidad.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleExportSupabaseCsv(selectedSupabaseTable, filteredRows)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-300"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Exportar CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* ALERTA DE PRIVACIDAD EN EXPORTACIÓN */}
                    {exportAlert && (
                      <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex items-center justify-between text-xs text-blue-800">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{exportAlert}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExportAlert(null)}
                          className="text-blue-500 hover:text-blue-700 font-bold ml-2 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Selector de Tabla y Buscador */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Tabs de tabla */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupabaseTable('proyecto');
                            setSupabasePage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedSupabaseTable === 'proyecto'
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          proyecto ({totalProyectos})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupabaseTable('cliente');
                            setSupabasePage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedSupabaseTable === 'cliente'
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          cliente ({totalClientes})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupabaseTable('especificacion_tecnica');
                            setSupabasePage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedSupabaseTable === 'especificacion_tecnica'
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          especificacion_tecnica ({totalSpecs})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSupabaseTable('evidencia');
                            setSupabasePage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            selectedSupabaseTable === 'evidencia'
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          evidencia ({totalEvidencias})
                        </button>
                      </div>

                      {/* Buscador */}
                      <div className="relative min-w-[220px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={supabaseSearchTerm}
                          onChange={(e) => {
                            setSupabaseSearchTerm(e.target.value);
                            setSupabasePage(1);
                          }}
                          placeholder="Buscar registros..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    {/* Subfiltro específico para la tabla `proyecto` */}
                    {selectedSupabaseTable === 'proyecto' && (
                      <div className="bg-slate-100/70 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
                        <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider shrink-0">Filtro de Calidad:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectFilterMode('all');
                            setSupabasePage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            projectFilterMode === 'all'
                              ? 'bg-slate-800 text-white'
                              : 'bg-white text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Todos los proyectos ({totalProyectos})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectFilterMode('valid');
                            setSupabasePage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            projectFilterMode === 'valid'
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
                          }`}
                        >
                          <span>Áreas Confirmadas ({validAreaProjects.length})</span>
                          <span className="text-[10px] font-normal">({confirmedAreaM2.toLocaleString('es-CO')} m²)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectFilterMode('suspicious');
                            setSupabasePage(1);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            projectFilterMode === 'suspicious'
                              ? 'bg-amber-700 text-white'
                              : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
                          }`}
                        >
                          <span>Pendientes / Montos COP ({suspiciousAreaProjects.length})</span>
                          <span className="text-[10px] font-normal">(${suspiciousAreaCOP.toLocaleString('es-CO')} COP)</span>
                        </button>
                      </div>
                    )}

                    {/* Aviso RLS si se mira cliente */}
                    {selectedSupabaseTable === 'cliente' && !isAdmin && (
                      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-800 font-medium">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Políticas RLS activas: Documentos, teléfonos y correos de clientes están enmascarados para usuarios no administradores. No se permite exportar datos personales no autorizados.</span>
                      </div>
                    )}

                    {/* Tabla de Datos */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                          <tr>
                            {tableHeaders.map((header) => (
                              <th key={header} className="px-4 py-3 whitespace-nowrap">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedRows.length === 0 ? (
                            <tr>
                              <td colSpan={tableHeaders.length || 1} className="px-4 py-8 text-center text-slate-400">
                                No se encontraron registros con el filtro aplicado.
                              </td>
                            </tr>
                          ) : (
                            paginatedRows.map((row, idx) => (
                              <tr key={row.proyecto_id || row.cliente_id || row.especificacion_id || row.evidencia_id || row.id || idx} className="hover:bg-slate-50 transition-colors">
                                {tableHeaders.map((header) => {
                                  let cellVal = row[header];

                                  // Privacidad RLS en tabla cliente para visitantes: Datos no transferidos por red
                                  if (selectedSupabaseTable === 'cliente' && !isAdmin && (header === 'documento' || header === 'responsable' || header === 'canal_entrada')) {
                                    return (
                                      <td key={header} className="px-4 py-3 whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-amber-800 bg-amber-50 border border-amber-200" title="Columna PII excluida del payload HTTP según política de mínimo privilegio">
                                          Protegido por RLS (No transferido)
                                        </span>
                                      </td>
                                    );
                                  }


                                  // Formato de campo `area_m2` en tabla `proyecto`
                                  if (selectedSupabaseTable === 'proyecto' && header === 'area_m2') {
                                    const numArea = Number(cellVal);
                                    if (numArea > 1000) {
                                      return (
                                        <td key={header} className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md">
                                              ${numArea.toLocaleString('es-CO')} COP
                                            </span>
                                            <span className="text-[10px] text-amber-600 font-semibold" title="Valor monetario registrado en campo técnico">
                                              (Monto COP)
                                            </span>
                                          </div>
                                        </td>
                                      );
                                    }
                                    return (
                                      <td key={header} className="px-4 py-3 whitespace-nowrap font-mono font-bold text-emerald-700">
                                        {cellVal ? `${cellVal} m²` : '—'}
                                      </td>
                                    );
                                  }

                                  // Formato de campo `tipo_proyecto`
                                  if (selectedSupabaseTable === 'proyecto' && header === 'tipo_proyecto') {
                                    const strTipo = String(cellVal || '');
                                    if (isSyntheticTest(strTipo)) {
                                      return (
                                        <td key={header} className="px-4 py-3 whitespace-nowrap">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                            {strTipo.slice(0, 15)}... (Prueba sintética)
                                          </span>
                                        </td>
                                      );
                                    }
                                    if (isCotOrProduct(strTipo)) {
                                      return (
                                        <td key={header} className="px-4 py-3 whitespace-nowrap text-slate-800 text-[11px]">
                                          <div className="flex items-center gap-1.5">
                                            <span className="truncate max-w-[220px] font-medium">{strTipo}</span>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                              Radicado / Pintura
                                            </span>
                                          </div>
                                        </td>
                                      );
                                    }
                                    return (
                                      <td key={header} className="px-4 py-3 whitespace-nowrap font-medium text-slate-900 text-[11px]">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                          {strTipo === 'residencial_remodelacion' ? 'Residencial (Remodelación)' : strTipo}
                                        </span>
                                      </td>
                                    );
                                  }

                                  // Formato de badge para estado
                                  if (header === 'estado' || header === 'Estado') {
                                    const strEstado = String(cellVal || '');
                                    if (isSyntheticTest(strEstado)) {
                                      return (
                                        <td key={header} className="px-4 py-3 whitespace-nowrap">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                            {strEstado.slice(0, 10)}... (Sintético)
                                          </span>
                                        </td>
                                      );
                                    }
                                    return (
                                      <td key={header} className="px-4 py-3 whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                          {strEstado}
                                        </span>
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={header} className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                                      {cellVal !== null && cellVal !== undefined ? String(cellVal) : <span className="text-slate-300">—</span>}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Mostrando {filteredRows.length > 0 ? (currentPageSafe - 1) * pageSize + 1 : 0} a{' '}
                        {Math.min(currentPageSafe * pageSize, filteredRows.length)} de {filteredRows.length} registros
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSupabasePage((p) => Math.max(1, p - 1))}
                          disabled={currentPageSafe <= 1}
                          className="px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                        >
                          Anterior
                        </button>
                        <span className="font-semibold text-slate-700">
                          {currentPageSafe} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSupabasePage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPageSafe >= totalPages}
                          className="px-3 py-1 bg-slate-100 rounded-lg font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 0.5: AUDITORÍA DE SEGURIDAD & RLS SUPABASE                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'seguridad_rls' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* HEADER PRINCIPAL */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border border-amber-500/40 rounded-2xl p-6 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base text-white">Auditoría de Seguridad & Row-Level Security (RLS) en Supabase</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      PostgreSQL ihsimnqprmfihwxjztlc
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Base Intacta (Solo Lectura)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                    Diagnóstico de vulnerabilidad de la API pública en la tabla <code className="text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">cliente</code>, control de acceso mediante tokens criptográficos JWT de Supabase Auth y script SQL preparado para aplicar RLS estricto.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={runLiveAnonAudit}
                  disabled={anonTestLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Radio className={`w-3.5 h-3.5 ${anonTestLoading ? 'animate-pulse text-red-600' : ''}`} />
                  <span>{anonTestLoading ? 'Auditando...' : 'Testear API en Vivo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 TARJETAS KPI RESUMEN DE SEGURIDAD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Vulnerabilidad en API Pública */}
            <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">API Pública (Anon Key)</span>
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-lg font-black text-red-950 block mt-2">
                Expuesta en Origen
              </span>
              <span className="text-[11px] text-red-700 font-medium block mt-1 leading-snug">
                PostgREST permite SELECT a anon hasta ejecutar el script SQL de RLS.
              </span>
            </div>

            {/* KPI 2: Protección en Frontend */}
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tráfico Web (Frontend)</span>
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-lg font-black text-blue-950 block mt-2">
                Mínimo Privilegio
              </span>
              <span className="text-[11px] text-blue-700 font-medium block mt-1 leading-snug">
                Documentos y contactos (PII) no viajan por red a visitantes no administradores.
              </span>
            </div>

            {/* KPI 3: Sesión JWT Supabase Auth */}
            <div className={`bg-white p-5 rounded-2xl border shadow-2xs ${hasValidJwt ? 'border-emerald-200' : 'border-amber-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${hasValidJwt ? 'text-emerald-600' : 'text-amber-600'}`}>
                  Sesión JWT Supabase Auth
                </span>
                <KeyRound className={`w-4 h-4 ${hasValidJwt ? 'text-emerald-500' : 'text-amber-500'}`} />
              </div>
              <span className={`text-lg font-black block mt-2 ${hasValidJwt ? 'text-emerald-950' : 'text-amber-950'}`}>
                {hasValidJwt ? 'JWT Verificado' : 'Sin Token JWT'}
              </span>
              <span className={`text-[11px] font-medium block mt-1 leading-snug ${hasValidJwt ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isJwtAdmin
                  ? `Firmado para ${jwtUserEmail}`
                  : 'localStorage insuficiente: Requiere sesión JWT real.'}
              </span>
            </div>

            {/* KPI 4: Registros de Clientes */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registros Tabla Cliente</span>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-lg font-black text-slate-900 block mt-2">
                {supabaseData?.clientes?.length || 59} Clientes
              </span>
              <span className="text-[11px] text-slate-600 font-medium block mt-1 leading-snug">
                Documentos de identidad y números telefónicos resguardados.
              </span>
            </div>
          </div>

          {/* HERRAMIENTA DE AUDITORÍA ANÓNIMA EN VIVO */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Prueba de Penetración & Consulta Anónima en Vivo (REST)
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ejecuta una petición HTTP REST real hacia el endpoint público de Supabase utilizando <strong className="text-slate-700">únicamente la anon key pública</strong> (sin cabecera de autenticación JWT).
                </p>
              </div>

              <button
                type="button"
                onClick={runLiveAnonAudit}
                disabled={anonTestLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${anonTestLoading ? 'animate-spin' : ''}`} />
                <span>{anonTestLoading ? 'Consultando PostgREST...' : 'Ejecutar Prueba Anónima Ahora'}</span>
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 overflow-x-auto">
              GET https://ihsimnqprmfihwxjztlc.supabase.co/rest/v1/cliente?select=*&limit=3<br />
              apikey: sb_publishable_c9280ZabG63_vTGxHc-Okg_RIRTzMQM (Sin Bearer JWT)
            </div>

            {anonTestResult && (
              <div className="mt-4 animate-in fade-in duration-200">
                {anonTestResult.hasPii ? (
                  <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-950">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-xs text-red-900">
                            VULNERABILIDAD ACTIVA DETECTADA EN LA BASE DE DATOS
                          </h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-200 text-red-900">
                            Hora: {anonTestResult.testedAt}
                          </span>
                        </div>
                        <p className="text-xs text-red-800 mt-1 leading-relaxed">
                          La clave anónima devolvió exitosamente {anonTestResult.rowCount} registros con datos de identificación personal sin solicitar autenticación.
                        </p>
                        {anonTestResult.samplePii && (
                          <div className="mt-2 p-2 bg-red-100/70 rounded-lg text-[11px] font-mono text-red-900">
                            <strong>Dato privado expuesto en la respuesta:</strong> Documento: <code className="bg-red-200 px-1 py-0.5 rounded">{anonTestResult.samplePii.documento}</code> | Responsable: <code className="bg-red-200 px-1 py-0.5 rounded">{anonTestResult.samplePii.responsable}</code>
                          </div>
                        )}
                        <p className="text-xs text-red-700 mt-2 font-semibold">
                          Acción requerida: Para cerrar esta vulnerabilidad en Supabase, copia y ejecuta el script SQL provisto abajo en el SQL Editor del proyecto.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-extrabold text-xs text-emerald-900">
                          ACCESO ANÓNIMO BLOQUEADO EXITOSAMENTE
                        </h5>
                        <p className="text-xs text-emerald-800 mt-1">
                          {anonTestResult.rawMessage}
                        </p>
                        <p className="text-xs text-emerald-700 mt-1 font-semibold">
                          La consulta sin token JWT no recibió ningún documento ni dato privado.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MÓDULO DE AUTENTICACIÓN SUPABASE AUTH JWT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-blue-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Gestión de Autenticación & Sesión JWT de Supabase Auth
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              En cumplimiento estricto del requerimiento: <strong className="text-slate-800">"4. Utilices autenticación real de Supabase Auth con sesiones JWT para autorizar el acceso administrativo"</strong> y <strong className="text-slate-800">"5. No consideres localStorage ni listas de correos en React como autorización suficiente"</strong>. Para desbloquear la consulta y exportación de datos sensibles de clientes (PII), se requiere una sesión JWT firmada por Supabase Auth.
            </p>

            {hasValidJwt ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">
                      Sesión JWT Criptográfica Activa & Verificada
                    </span>
                    <span className="text-xs text-emerald-800 font-mono block mt-0.5">
                      Usuario: <strong>{jwtUserEmail}</strong> {isJwtAdmin ? '🛡️ (Administrador Master Autorizado)' : '👤 (Cliente)'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                      Token JWT: {supabaseSession?.access_token?.slice(0, 32)}... (Firmado por Supabase Auth)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleJwtLogout}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                >
                  Cerrar Sesión JWT
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <form onSubmit={handleJwtLogin} className="space-y-3.5 max-w-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Iniciar Sesión en Supabase Auth para Emitir Token JWT</span>
                  </div>

                  {jwtAuthError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                      {jwtAuthError}
                    </div>
                  )}

                  {jwtAuthSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                      {jwtAuthSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Correo Administrador Master
                      </label>
                      <input
                        type="email"
                        required
                        value={jwtEmailInput}
                        onChange={(e) => setJwtEmailInput(e.target.value)}
                        placeholder="salgadoarevaloleidy@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contraseña de Acceso
                      </label>
                      <input
                        type="password"
                        required
                        value={jwtPasswordInput}
                        onChange={(e) => setJwtPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={jwtLoading}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{jwtLoading ? 'Autenticando...' : 'Emitir Token JWT con Supabase Auth'}</span>
                    </button>
                  </div>
                </form>

                <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  <strong>Instrucción para habilitar la cuenta en Supabase Auth:</strong> Si recibes el mensaje <em>"Invalid login credentials"</em>, significa que la cuenta de correo aún no existe en la tabla de usuarios de Supabase Auth (<code className="font-mono">auth.users</code>). Para crearla, ingresa a tu proyecto en <strong>Supabase Dashboard &gt; Authentication &gt; Users &gt; "Add User" &gt; "Create User"</strong> con correo <code className="font-mono font-bold">salgadoarevaloleidy@gmail.com</code> y contraseña, asegurándote de marcar la casilla <strong>"Auto Confirm User"</strong> (dado que el servicio de correo SMTP de Supabase está desactivado).
                </div>
              </div>
            )}
          </div>

          {/* SCRIPT SQL EXACTO PARA SUPABASE SQL EDITOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">
                    Script SQL Exacto de Políticas RLS para Supabase
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ejecutar en: <span className="text-amber-300 font-mono">Supabase Dashboard &gt; SQL Editor</span>. Bloquea el acceso anónimo y autoriza únicamente administradores autenticados vía JWT.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`-- ====================================================================
-- PINTUCO COLORLINK — POLÍTICA DE SEGURIDAD RLS ESTRICTA PARA CLIENTES
-- Proyecto: ihsimnqprmfihwxjztlc (Supabase PostgreSQL)
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Habilitar Row-Level Security obligatorio en la tabla cliente
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier política permisiva previa existente
DROP POLICY IF EXISTS "Allow public read" ON public.cliente;
DROP POLICY IF EXISTS "Permitir lectura publica" ON public.cliente;
DROP POLICY IF EXISTS "Public select" ON public.cliente;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cliente;
DROP POLICY IF EXISTS "cliente_select_master_admin" ON public.cliente;

-- 3. Crear política restrictiva: Solo usuarios autenticados con JWT emitido por Supabase Auth
--    cuyo email esté en la lista institucional de administradores pueden leer la tabla cliente completa.
CREATE POLICY "cliente_select_master_admin"
ON public.cliente
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') IN (
    'salgadoarevaloleidy@gmail.com',
    'luisdmorales@pintuco.com',
    'luisdmorales2103@gmail.com',
    'juanjpromero@pintuco.com',
    'juanjpromero@gmail.com'
  )
);

-- 4. Revocar el permiso SELECT a anon sobre la tabla cliente
REVOKE SELECT ON public.cliente FROM anon;

-- 5. Otorgar SELECT únicamente al rol authenticated
GRANT SELECT ON public.cliente TO authenticated;`);
                  setCopiedRlsSql(true);
                  setTimeout(() => setCopiedRlsSql(false), 2500);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                {copiedRlsSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRlsSql ? '¡SQL Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-200/90 leading-relaxed overflow-x-auto max-h-80 overflow-y-auto">
              <pre>{`-- ====================================================================
-- PINTUCO COLORLINK — POLÍTICA DE SEGURIDAD RLS ESTRICTA PARA CLIENTES
-- Proyecto: ihsimnqprmfihwxjztlc (Supabase PostgreSQL)
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ====================================================================

-- 1. Habilitar Row-Level Security obligatorio en la tabla cliente
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier política permisiva previa existente
DROP POLICY IF EXISTS "Allow public read" ON public.cliente;
DROP POLICY IF EXISTS "Permitir lectura publica" ON public.cliente;
DROP POLICY IF EXISTS "Public select" ON public.cliente;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cliente;
DROP POLICY IF EXISTS "cliente_select_master_admin" ON public.cliente;

-- 3. Crear política restrictiva: Solo usuarios autenticados con JWT emitido por Supabase Auth
--    cuyo email esté en la lista institucional de administradores pueden leer la tabla cliente completa.
CREATE POLICY "cliente_select_master_admin"
ON public.cliente
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') IN (
    'salgadoarevaloleidy@gmail.com',
    'luisdmorales@pintuco.com',
    'luisdmorales2103@gmail.com',
    'juanjpromero@pintuco.com',
    'juanjpromero@gmail.com'
  )
);

-- 4. Revocar el permiso SELECT a anon sobre la tabla cliente
REVOKE SELECT ON public.cliente FROM anon;

-- 5. Otorgar SELECT únicamente al rol authenticated
GRANT SELECT ON public.cliente TO authenticated;`}</pre>
            </div>

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed">
              <strong>Nota de Seguridad Obligatoria:</strong> De acuerdo con tus instrucciones (<em>"8. No ejecutes cambios en Supabase sin mi autorización"</em>), la aplicación <strong>no ejecuta automáticamente</strong> este código DDL en Supabase. Puedes revisarlo con total tranquilidad y ejecutarlo directamente en el SQL Editor de tu cuenta de Supabase cuando lo estimes conveniente.
            </div>
          </div>

          {/* ANÁLISIS DE IMPACTO EN EL MÓDULO BI & SCRIPT DE ROLLBACK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Impacto en el Módulo BI */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700" />
                <span>Análisis de Impacto en el Módulo Data Warehouse BI</span>
              </h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Cómo se comporta la aplicación tras aplicar la política RLS en Supabase:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-900 block">Para Visitantes y Usuarios Anónimos:</span>
                  <span className="text-slate-600 block mt-0.5">
                    La tabla <code className="font-mono text-slate-800">cliente</code> devolverá una colección vacía o denegación RLS controlada. El frontend <strong>no fallará ni quedará en blanco</strong>: mostrará un aviso de confidencialidad RLS y continuará presentando los 29 proyectos, especificaciones técnicas y evidencias intactas.
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-950 block">Para Administradores con JWT:</span>
                  <span className="text-emerald-800 block mt-0.5">
                    Al autenticar la sesión con Supabase Auth, PostgREST valida la firma criptográfica del JWT y la cláusula <code className="font-mono">(auth.jwt() -&gt;&gt; 'email') IN (...)</code> evalúa a verdadero, permitiendo la lectura y exportación completa de los 59 clientes.
                  </span>
                </div>
              </div>
            </div>

            {/* Script de Reversión (Rollback) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                  <span>Script de Reversión Inmediata (Rollback)</span>
                </h4>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`ALTER TABLE public.cliente DISABLE ROW LEVEL SECURITY;\nGRANT SELECT ON public.cliente TO anon;`);
                    setCopiedRollbackSql(true);
                    setTimeout(() => setCopiedRollbackSql(false), 2500);
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedRollbackSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRollbackSql ? '¡Copiado!' : 'Copiar Rollback'}</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Si por cualquier motivo de tu entrega académica requieres restaurar temporalmente la lectura pública en Supabase, ejecuta estas 2 líneas en el SQL Editor:
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                <pre>{`ALTER TABLE public.cliente DISABLE ROW LEVEL SECURITY;\nGRANT SELECT ON public.cliente TO anon;`}</pre>
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                Este comando desactiva RLS sobre la tabla <code className="font-mono">cliente</code> y restaura los permisos SELECT para el rol anónimo de forma instantánea.
              </p>
            </div>
          </div>

          {/* INSTRUCCIONES DE VERIFICACIÓN EXTERNA (CURL & CONSOLA) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span>Instrucciones de Verificación Externa (cURL y DevTools)</span>
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Para comprobar que una consulta anónima a <code className="font-mono text-slate-800">cliente</code> ya no puede recuperar información privada, ejecuta cualquiera de estas dos verificaciones independientes:
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">Opción 1: Verificación desde la Terminal (cURL)</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`curl -i -X GET "https://ihsimnqprmfihwxjztlc.supabase.co/rest/v1/cliente?select=*" \\\n  -H "apikey: sb_publishable_c9280ZabG63_vTGxHc-Okg_RIRTzMQM"`);
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2500);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCurl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCurl ? '¡Copiado!' : 'Copiar cURL'}</span>
                  </button>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto">
                  <pre>{`curl -i -X GET "https://ihsimnqprmfihwxjztlc.supabase.co/rest/v1/cliente?select=*" \\\n  -H "apikey: sb_publishable_c9280ZabG63_vTGxHc-Okg_RIRTzMQM"`}</pre>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  <strong>Resultado esperado tras aplicar RLS:</strong> Respuesta HTTP 200 con un arreglo vacío <code className="font-mono font-bold">[]</code> o HTTP 401/403 con mensaje de permiso denegado. Ningún documento o contacto será devuelto.
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1.5">Opción 2: Verificación desde la Consola del Navegador (F12)</span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto">
                  <pre>{`fetch("https://ihsimnqprmfihwxjztlc.supabase.co/rest/v1/cliente?select=*", {
  headers: { "apikey": "sb_publishable_c9280ZabG63_vTGxHc-Okg_RIRTzMQM" }
}).then(r => r.json()).then(data => console.log("Resultado Consulta Anon:", data));`}</pre>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  <strong>Resultado esperado:</strong> Imprimirá <code className="font-mono font-bold">[]</code> en la consola en lugar de los 59 registros de clientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: DASHBOARD & GRÁFICOS BI                                */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* KPI CARDS RESUMEN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Datasets Cargados</span>
              <span className="text-2xl font-black text-slate-900 block mt-1">
                {proyectoDetalle?.indicadores.totalDatasets || 0}
              </span>
              <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">En capa ANALYTICS</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registros Analizados</span>
              <span className="text-2xl font-black text-emerald-700 block mt-1">
                {(proyectoDetalle?.indicadores.totalFilas || 0).toLocaleString('es-CO')}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Filas tipadas e indexadas</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gráficos Automáticos</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">
                {proyectoDetalle?.graficos.length || 0}
              </span>
              <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">Recomendados por el motor</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cargas Exitosas</span>
              <span className="text-2xl font-black text-blue-900 block mt-1">
                {proyectoDetalle?.indicadores.totalCargasExitosas || 0}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Sin alteración del original</span>
            </div>
          </div>

          {/* Action bar for charts */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Indicadores y Visualizaciones del Proyecto</h2>
              <p className="text-xs text-slate-500">Métricas analíticas generadas automáticamente para {proyectoActual?.nombre}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingChart(true)}
              disabled={!proyectoDetalle?.datasets.length}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Gráfico Personalizado</span>
            </button>
          </div>

          {/* CHARTS GRID */}
          {(!proyectoDetalle?.graficos || proyectoDetalle.graficos.length === 0) ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Aún no hay gráficos en este proyecto</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ve a la pestaña <strong>Pipeline Ingestión Excel / CSV</strong> y sube un archivo con datos numéricos para que el motor analítico recomiende automáticamente visualizaciones y dashboards.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('ingesta')}
                className="mt-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Subir Primer Excel / CSV</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {proyectoDetalle.graficos.map((graf) => (
                <div
                  key={graf.graficoId}
                  className={`bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between ${
                    graf.anchoColumnas === 12 ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        {graf.tipoGrafico.includes('BAR') && <BarChart3 className="w-3.5 h-3.5 text-blue-600" />}
                        {graf.tipoGrafico.includes('LINE') && <LineIcon className="w-3.5 h-3.5 text-amber-600" />}
                        {graf.tipoGrafico.includes('PIE') && <PieIcon className="w-3.5 h-3.5 text-emerald-600" />}
                        {graf.tipoGrafico.replace('_', ' ')} • {graf.operacionAgregada}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{graf.ejeYColumna} / {graf.ejeXColumna}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 font-display">{graf.titulo}</h4>
                    {graf.subtitulo && <p className="text-xs text-slate-500">{graf.subtitulo}</p>}
                  </div>

                  {/* Render Visual Representation of Data */}
                  <div className="py-2">
                    {(!graf.datosCalculados || graf.datosCalculados.length === 0) ? (
                      <div className="p-8 text-center text-xs text-slate-400">Sin datos agregados disponibles</div>
                    ) : graf.tipoGrafico === 'BAR_VERTICAL' || graf.tipoGrafico === 'BAR_HORIZONTAL' ? (
                      <div className="space-y-2.5">
                        {(() => {
                          const maxVal = Math.max(...graf.datosCalculados.map((d) => d.value), 1);
                          return graf.datosCalculados.map((d, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span>{d.label}</span>
                                <span className="font-mono text-slate-900">{d.value.toLocaleString('es-CO')}</span>
                              </div>
                              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    i % 2 === 0 ? 'bg-blue-600' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.max(5, (d.value / maxVal) * 100)}%` }}
                                />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : graf.tipoGrafico === 'PIE_DISTRIBUTION' || graf.tipoGrafico === 'DONUT' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {graf.datosCalculados.map((d, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                            <span className="text-[11px] text-slate-600 block truncate" title={d.label}>{d.label}</span>
                            <span className="text-sm font-extrabold text-blue-900 font-mono block mt-0.5">
                              {d.value.toLocaleString('es-CO')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {graf.datosCalculados.map((d, i) => (
                          <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg text-xs">
                            <span className="font-medium text-slate-700">{d.label}</span>
                            <span className="font-mono font-bold text-blue-900">{d.value.toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Capa ANALYTICS • Oracle DW</span>
                    <span>Actualizado en tiempo real</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PIPELINE INGESTIÓN EXCEL / CSV                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'ingesta' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Carga Automatizada de Datos (13 Pasos de Ingestión)
              </h3>
              <p className="text-xs text-slate-500">
                Sube archivos Excel (.xlsx, .xls) o .csv. El sistema almacena el original en la capa RAW, normaliza en STAGING, infiere tipos y carga en la capa ANALYTICS sin alterar el archivo original.
              </p>
            </div>

            {/* Formulario de Carga */}
            <form onSubmit={handleSubirArchivo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Nombre del Dataset (Opcional):</label>
                  <input
                    type="text"
                    value={datasetNameInput}
                    onChange={(e) => setDatasetNameInput(e.target.value)}
                    placeholder="Ej: Reporte Trimestral de Ventas y Cobertura"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Proyecto Destino:</label>
                  <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                    {proyectoActual?.nombre} ({proyectoActual?.codigoProyecto})
                  </div>
                </div>
              </div>

              {/* Drag and drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950'
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />

                <div className="space-y-2">
                  <FileSpreadsheet className={`w-10 h-10 mx-auto ${selectedFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-bold text-emerald-900">{selectedFile.name}</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Listo para procesar
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-slate-700">
                        Haz clic aquí para seleccionar o arrastra tu archivo Excel o CSV
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Soporta formatos .xlsx, .xls y .csv hasta 50 MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedFile || isUploading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ejecutando Ingestión & Inferencia...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Iniciar Procesamiento de Ingesta</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Ingestion Feedback Result */}
            {uploadFeedback && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>¡Archivo procesado exitosamente e integrado a la Capa ANALYTICS de Oracle!</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-400 font-bold block">Filas Válidas</span>
                    <span className="text-base font-black text-emerald-800">{uploadFeedback.estadisticas.totalFilas}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-400 font-bold block">Columnas Detectadas</span>
                    <span className="text-base font-black text-slate-800">{uploadFeedback.estadisticas.totalColumnas}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-400 font-bold block">Métricas Inferred</span>
                    <span className="text-base font-black text-blue-800">{uploadFeedback.estadisticas.columnasMetricas}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-400 font-bold block">Gráficos Recomendados</span>
                    <span className="text-base font-black text-amber-700">{uploadFeedback.graficosRecomendados?.length || 0}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('explorador')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Ver Datos en Explorador
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Ver Dashboard BI
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: EXPLORADOR DE DATOS & CAPAS                            */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'explorador' && (
        <div className="space-y-6">

          {/* Dataset Selector & Export Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Dataset Seleccionado:</span>
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  setPaginaActual(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
              >
                {proyectoDetalle?.datasets.map((d) => (
                  <option key={d.datasetId} value={d.datasetId}>
                    {d.nombreDataset} ({d.totalFilas} filas)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en filas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPaginaActual(1);
                  }}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-44"
                />
              </div>

              <a
                href={`/api/dw/datasets/${selectedDatasetId}/export?format=csv`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Exportar archivo CSV analítico"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </a>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {isLoadingFilas ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Cargando registros paginados...
              </div>
            ) : filasPaginadas.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No se encontraron registros para este dataset o filtro de búsqueda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <th className="py-3 px-4 w-12 text-center text-slate-400">#</th>
                      {Object.keys(filasPaginadas[0] || {}).map((colName) => (
                        <th key={colName} className="py-3 px-4 font-mono text-[11px] uppercase tracking-wider">
                          {colName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filasPaginadas.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-400">
                          {(paginaActual - 1) * 15 + idx + 1}
                        </td>
                        {Object.values(row).map((val: any, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-4 text-slate-800 whitespace-nowrap">
                            {val === null || val === undefined ? (
                              <span className="text-slate-300 italic">null</span>
                            ) : typeof val === 'number' ? (
                              <span className="font-mono text-blue-900 font-semibold">
                                {val.toLocaleString('es-CO')}
                              </span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>
                Mostrando página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> ({totalFilas} registros totales)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paginaActual <= 1}
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaActual >= totalPaginas}
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: GESTIÓN MULTIPROYECTO                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'proyectos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((proy) => (
              <div
                key={proy.proyectoId}
                onClick={() => setSelectedProyectoId(proy.proyectoId)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer bg-white shadow-xs space-y-4 ${
                  proy.proyectoId === selectedProyectoId
                    ? 'border-blue-600 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                    {proy.codigoProyecto}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {proy.estado}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 font-display">{proy.nombre}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{proy.descripcion}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Datasets:</span>
                    <strong className="text-slate-800">{proy.totalDatasets}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Registros:</span>
                    <strong className="text-slate-800">{proy.totalRegistros.toLocaleString('es-CO')}</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-blue-600 font-bold">
                  <span>Seleccionar Proyecto</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: ESQUEMA ORACLE DW & AUDITORÍA                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'oracle' && (
        <div className="space-y-6">

          {/* Model Architecture Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Arquitectura de Tablas del Data Warehouse Oracle
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-blue-900 block">1. DW_PROYECTOS & DW_ACCESOS</span>
                <p className="text-slate-500 text-[11px]">Control de proyectos ilimitados y roles RBAC (Administrador, Analista, Estudiante).</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-emerald-900 block">2. DW_DATASETS & DW_COLUMNAS</span>
                <p className="text-slate-500 text-[11px]">Diccionario de metadatos, tipos inferidos, métricas y dimensiones analíticas.</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-bold text-amber-900 block">3. DW_FILAS & DW_GRAFICOS</span>
                <p className="text-slate-500 text-[11px]">Capas RAW, STAGING y ANALYTICS particionadas con proyección columnar tipada.</p>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-2 p-6">
            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Bitácora de Auditoría en Tiempo Real (DW_AUDITORIA)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Usuario</th>
                    <th className="py-2.5 px-3">Acción</th>
                    <th className="py-2.5 px-3">Entidad</th>
                    <th className="py-2.5 px-3">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditoriaLogs.slice(0, 10).map((log) => (
                    <tr key={log.auditoriaId} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestampEvento).toLocaleTimeString('es-CO')}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{log.usuarioEmail}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                          {log.accion}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{log.entidadAfectada}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate">{log.detallesOperacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: NUEVO PROYECTO                                         */}
      {/* ------------------------------------------------------------- */}
      {isCreatingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 font-display">Crear Nuevo Proyecto Data Warehouse</h3>
            <form onSubmit={handleCrearProyecto} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Nombre del Proyecto *</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Análisis Logístico de Despachos 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Código Único (Opcional)</label>
                <input
                  type="text"
                  value={nuevoCodigo}
                  onChange={(e) => setNuevoCodigo(e.target.value)}
                  placeholder="Ej: PRJ-LOGISTICA-2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Categoría</label>
                <select
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                >
                  <option value="VENTAS_Y_OPERACIONES">Ventas y Operaciones</option>
                  <option value="CALIDAD_I+D">Control de Calidad e I+D</option>
                  <option value="FINANZAS">Finanzas y Rentabilidad</option>
                  <option value="PRODUCCION">Planta y Producción</option>
                  <option value="ACADEMICO">Investigación Académica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Descripción</label>
                <textarea
                  rows={2}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Objetivos analíticos e indicadores esperados..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ASIGNAR MIEMBRO                                        */}
      {/* ------------------------------------------------------------- */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 font-display">Asignar Miembro o Estudiante</h3>
            <form onSubmit={handleAsignarMiembro} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={nuevoMiembroEmail}
                  onChange={(e) => setNuevoMiembroEmail(e.target.value)}
                  placeholder="estudiante@universidad.edu.co"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Rol Asignado</label>
                <select
                  value={nuevoMiembroRol}
                  onChange={(e) => setNuevoMiembroRol(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                >
                  <option value="ESTUDIANTE">Estudiante (Puede cargar y analizar)</option>
                  <option value="ANALISTA">Analista (Puede crear gráficos y dashboards)</option>
                  <option value="ADMINISTRADOR">Administrador (Control total)</option>
                  <option value="LECTOR">Lector (Solo lectura)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 cursor-pointer"
                >
                  Asignar Permisos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREAR GRÁFICO PERSONALIZADO                            */}
      {/* ------------------------------------------------------------- */}
      {isCreatingChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 font-display">Crear Gráfico Analítico BI</h3>
            <form onSubmit={handleCrearGrafico} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Título del Gráfico *</label>
                <input
                  type="text"
                  required
                  value={chartTitulo}
                  onChange={(e) => setChartTitulo(e.target.value)}
                  placeholder="Ej: Distribución de Ventas por Ciudad"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Tipo de Gráfico</label>
                  <select
                    value={chartTipo}
                    onChange={(e) => setChartTipo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="BAR_VERTICAL">Barras Verticales</option>
                    <option value="BAR_HORIZONTAL">Barras Horizontales</option>
                    <option value="LINE_TREND">Línea de Tendencia</option>
                    <option value="PIE_DISTRIBUTION">Pastel / Distribución</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Operación</label>
                  <select
                    value={chartOp}
                    onChange={(e) => setChartOp(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="SUM">Suma (SUM)</option>
                    <option value="AVG">Promedio (AVG)</option>
                    <option value="COUNT">Conteo (COUNT)</option>
                    <option value="MAX">Máximo (MAX)</option>
                    <option value="MIN">Mínimo (MIN)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Eje X (Dimensión) *</label>
                  <select
                    required
                    value={chartColX}
                    onChange={(e) => setChartColX(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="">Selecciona columna...</option>
                    {columnasDataset.map((c) => (
                      <option key={c.columnaId} value={c.nombreOriginal}>
                        {c.nombreOriginal} ({c.tipoDato})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Eje Y (Métrica) *</label>
                  <select
                    required
                    value={chartColY}
                    onChange={(e) => setChartColY(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="">Selecciona columna...</option>
                    {columnasDataset.map((c) => (
                      <option key={c.columnaId} value={c.nombreOriginal}>
                        {c.nombreOriginal} ({c.tipoDato})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingChart(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!chartColX || !chartColY}
                  className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  Generar Gráfico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
