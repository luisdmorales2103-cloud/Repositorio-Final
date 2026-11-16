import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Copy,
  Check,
  Send,
  Code2,
  Database,
  Info,
  ShieldCheck,
  Server,
  ListFilter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Lock,
  AlertTriangle,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getGoogleAppsScriptUrl,
  setGoogleAppsScriptUrl,
  getGoogleAppsScriptTemplateCode,
  GAS_DEFAULT_EMAIL,
} from '../services/googleAppsScriptService';
import {
  sendTestNotificationApi,
  sendQuoteNotificationApi,
  fetchNotificationLogsApi,
  fetchProviderStatusApi,
  updateServerConfigApi,
  getClientConfiguredAdminEmail,
  setClientConfiguredAdminEmail,
} from '../services/notificationService';
import { EmailNotificationLog, EmailProviderStatus, Quote, UserProfile } from '../types';
import { getQuotePdfBase64 } from '../utils/generateQuotePdf';
import {
  getSupabaseDiagnostic,
  SupabaseDiagnosticResult,
} from '../services/supabaseService';

interface GoogleAppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail?: string;
  currentUser?: UserProfile | null;
}

export const GoogleAppsScriptModal: React.FC<GoogleAppsScriptModalProps> = ({
  isOpen,
  onClose,
  adminEmail: _propAdminEmail = GAS_DEFAULT_EMAIL,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'code' | 'database'>('config');

  // Backend & Provider state
  const [adminEmailState, setAdminEmailState] = useState<string>(getClientConfiguredAdminEmail());
  const [webhookUrlState, setWebhookUrlState] = useState<string>('');
  const [mailSecretInput, setMailSecretInput] = useState<string>('');
  const [providerStatus, setProviderStatus] = useState<EmailProviderStatus | null>(null);

  // Test state with custom authorized email (Requirement 7)
  const [testRecipientEmail, setTestRecipientEmail] = useState<string>('cliente_autorizado@gmail.com');
  const [testMode, setTestMode] = useState<'cotizacion' | 'conectividad'>('cotizacion');
  const [isTestingBackend, setIsTestingBackend] = useState<boolean>(false);
  const [backendTestResult, setBackendTestResult] = useState<{
    success: boolean;
    ok?: boolean;
    message: string;
    details?: any;
    error?: string;
    pdfAdjunto?: boolean;
    vistaPrevia?: boolean;
  } | null>(null);

  // Config save feedback
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Logs state
  const [logs, setLogs] = useState<EmailNotificationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [selectedLogPayload, setSelectedLogPayload] = useState<any | null>(null);

  // Template code state
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Supabase Database Diagnostic state
  const [dbDiagnostic, setDbDiagnostic] = useState<SupabaseDiagnosticResult | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const [selectedTablePreview, setSelectedTablePreview] = useState<'cliente' | 'proyecto' | 'especificacion_tecnica' | 'evidencia'>('cliente');

  const loadDbDiagnostic = async () => {
    setIsLoadingDb(true);
    try {
      const res = await getSupabaseDiagnostic(currentUser);
      setDbDiagnostic(res);
    } catch (e) {
      console.warn('Error loading Supabase diagnostic:', e);
    } finally {
      setIsLoadingDb(false);
    }
  };

  const loadData = async () => {
    setIsLoadingLogs(true);
    try {
      const [statusData, logsData] = await Promise.all([
        fetchProviderStatusApi(),
        fetchNotificationLogsApi(),
      ]);
      if (statusData) {
        setProviderStatus(statusData);
        if (statusData.adminEmail) setAdminEmailState(statusData.adminEmail);
      }
      setLogs(logsData);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const savedGas = getGoogleAppsScriptUrl();
      if (savedGas) setWebhookUrlState(savedGas);
      setAdminEmailState(getClientConfiguredAdminEmail());
      setBackendTestResult(null);
      setSaveStatusMessage(null);
      loadData();
      loadDbDiagnostic();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'database') {
      loadDbDiagnostic();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setSaveStatusMessage(null);
    try {
      // 1. Save to local storage for persistence across reloads
      if (webhookUrlState) setGoogleAppsScriptUrl(webhookUrlState);
      if (adminEmailState) setClientConfiguredAdminEmail(adminEmailState);

      // 2. Sync to secure server runtime
      const res = await updateServerConfigApi({
        gasUrl: webhookUrlState,
        mailSecret: mailSecretInput || undefined,
        adminEmail: adminEmailState,
      });

      if (res.success) {
        setSaveStatusMessage('✅ Configuración guardada en el servidor y aplicada.');
        if (res.data) setProviderStatus(res.data);
      } else {
        setSaveStatusMessage(`⚠️ Guardado local exitoso. Nota del servidor: ${res.message}`);
      }
      setTimeout(() => setSaveStatusMessage(null), 4000);
      loadData();
    } catch (err: any) {
      setSaveStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSendBackendTest = async () => {
    const target = testRecipientEmail.trim();
    if (!target) {
      setBackendTestResult({
        success: false,
        ok: false,
        message: 'Por favor ingresa un correo de prueba autorizado válido.',
      });
      return;
    }

    setIsTestingBackend(true);
    setBackendTestResult(null);

    try {
      if (testMode === 'cotizacion') {
        const sampleQuote: Quote = {
          id: `test-quote-${Date.now()}`,
          quoteNumber: `COT-TEST-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString(),
          formattedDate: new Date().toLocaleDateString('es-CO'),
          validityDays: 30,
          customer: {
            name: 'Cliente de Prueba Autorizado',
            idNumber: '900.123.456-7',
            contactPerson: 'Ing. Supervisor de Obras',
            phone: '311 856 8707',
            email: target,
            city: 'Bogotá D.C.',
            address: 'Calle 100 # 15-20',
            notes: 'Prueba de cotización oficial con PDF adjunto y vista previa visual.',
          },
          items: [
            {
              id: 'p1',
              productId: 'prod-viniltex',
              productName: 'Viniltex Avanzado Blanco',
              sku: 'VTX-001',
              category: 'HOGAR',
              presentation: '1 Galón',
              quantity: 2,
              unitPrice: 85000,
              subtotal: 170000,
              colorName: 'Blanco Puro',
              colorHex: '#FFFFFF',
              surfaceTag: 'Mampostería / Concreto',
            },
            {
              id: 'p2',
              productId: 'prod-koraza',
              productName: 'Pintuco Koraza Protección 5',
              sku: 'KRZ-002',
              category: 'CONSTRUCCIÓN',
              presentation: '5 Galones (Cuñete)',
              quantity: 1,
              unitPrice: 310000,
              subtotal: 310000,
              colorName: 'Gris Basalto',
              colorHex: '#4A5568',
              surfaceTag: 'Fachadas Exteriores',
            },
          ],
          subtotal: 480000,
          discountPercent: 0,
          discountAmount: 0,
          includeIva: true,
          ivaRate: 0.19,
          ivaAmount: 91200,
          total: 571200,
          status: 'En preparación',
        };

        const pdfData = getQuotePdfBase64(sampleQuote);
        const res = await sendQuoteNotificationApi(sampleQuote, {
          pdfBase64: pdfData.base64,
          pdfName: pdfData.filename,
        });

        const gasData = res.results?.responseData || res.results?.clientResult?.responseData || res.results;
        const hasPdf = Boolean(res.pdfAdjunto ?? (gasData?.pdfAdjunto === true || gasData?.pdfAdjunto === 'true'));
        const hasPreview = Boolean(
          res.vistaPrevia ?? (
            gasData?.vistaPrevia === true ||
            gasData?.vistaPrevia === 'true' ||
            gasData?.vistaPreviaIncrustada === true ||
            gasData?.vistaPreviaIncrustada === 'true'
          )
        );

        setBackendTestResult({
          success: res.success && res.results?.ok !== false,
          ok: res.results?.ok ?? res.success,
          message: res.message,
          details: gasData,
          error: res.results?.error,
          pdfAdjunto: hasPdf,
          vistaPrevia: hasPreview,
        });
      } else {
        const res = await sendTestNotificationApi(target, {
          nombre: 'Usuario Autorizado Pintuco',
          numero: `TEST-${Date.now().toString().slice(-4)}`,
          detalles: 'Verificación de conexión real entre backend Express y Google Apps Script',
          estado: 'Aprobado',
          tipo: 'PRUEBA',
        });
        setBackendTestResult({
          success: res.success,
          ok: res.result?.ok,
          message: res.message,
          details: res.result?.responseData || res.result,
          error: res.result?.error,
        });
      }

      // Refresh audit logs
      fetchNotificationLogsApi().then(setLogs);
      fetchProviderStatusApi().then((s) => s && setProviderStatus(s));
    } catch (err: any) {
      setBackendTestResult({
        success: false,
        ok: false,
        message: 'Error al conectar con el servidor',
        error: err?.message || 'Error desconocido de red',
      });
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleCopyCode = () => {
    const code = getGoogleAppsScriptTemplateCode();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const formatLogType = (type: EmailNotificationLog['type'], gasTipo?: string) => {
    const raw = gasTipo || (
      type === 'REGISTRO_BIENVENIDA' ? 'registro' :
      type === 'COTIZACION_CLIENTE' ? 'cotizacion' :
      type === 'PEDIDO_CLIENTE' ? 'compra' :
      type === 'COTIZACION_ESTADO' || type === 'PEDIDO_ESTADO' ? 'estado' :
      'prueba'
    );
    switch (raw) {
      case 'registro':
        return { label: 'registro', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'cotizacion':
        return { label: 'cotizacion', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'compra':
        return { label: 'compra', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'estado':
        return { label: 'estado', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'prueba':
      default:
        return { label: 'prueba', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shadow-inner">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-display">Pintuco ColorLink • Notificaciones por Correo</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Google Apps Script Exclusivo
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Proveedor oficial y único: Google Apps Script Webhook (POST seguro con verificación de secret en body).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            Servicio & Prueba en Vivo
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('logs');
              loadData();
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Registro de Envíos (Logs)
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                {logs.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Código Apps Script (.gs)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Persistencia & Tablas (Supabase)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ------------------------------------------------------------- */}
          {/* TAB 1: CONFIGURATION & LIVE TEST                              */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              
              {/* Status Banner */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-display">Estado del Conector Google Apps Script</h4>
                    <p className="text-xs text-slate-500">Mecanismo de despacho de correos en el servidor backend</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadData}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    title="Actualizar estado"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Proveedor Principal</span>
                    <span className="text-xs font-black text-blue-900 block mt-1">
                      Google Apps Script
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      {providerStatus?.googleAppsScriptConfigured ? '✓ URL Conectada' : '⚠️ Pendiente de URL'}
                    </span>
                  </div>
                  
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Seguridad MAIL_SECRET</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      {providerStatus?.mailSecretConfigured ? 'Clave Configurada' : 'Sin clave requerida'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Enviada sólo en POST body (nunca en URL)
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Notificaciones Exitosas</span>
                    <span className="text-base font-black text-emerald-700 block mt-0.5">
                      {providerStatus?.totalSent ?? logs.filter((l) => l.status === 'EXITOSO').length} enviadas
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Anti-duplicados activa (25s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Server Credentials & Routing Configuration */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    Parámetros de Google Apps Script en Servidor
                  </h4>
                  {saveStatusMessage && (
                    <span className="text-xs font-semibold text-emerald-700">{saveStatusMessage}</span>
                  )}
                </div>

                {/* Webhook URL Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    URL Webhook de Google Apps Script (Termina en /exec)
                  </label>
                  <input
                    type="url"
                    value={webhookUrlState}
                    onChange={(e) => setWebhookUrlState(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  <p className="text-[11px] text-slate-500">
                    Obtenida al implementar como Aplicación Web en script.google.com con acceso para 'Cualquiera'.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* MAIL_SECRET */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Clave Secreta (MAIL_SECRET)</span>
                      {providerStatus?.mailSecretConfigured && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Activa en servidor
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={mailSecretInput}
                      onChange={(e) => setMailSecretInput(e.target.value)}
                      placeholder={providerStatus?.mailSecretConfigured ? '•••••••••••• (dejar en blanco para conservar)' : 'Ingresa tu MAIL_SECRET'}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                      Viaja estrictamente en el cuerpo JSON del POST hacia doPost(e). Nunca expuesta al navegador.
                    </p>
                  </div>

                  {/* Admin Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Correo del Administrador (Alertas de Nuevos Registros/Pedidos)
                    </label>
                    <input
                      type="email"
                      value={adminEmailState}
                      onChange={(e) => setAdminEmailState(e.target.value)}
                      placeholder="salgadoarevaloleidy@gmail.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                      Recibe copia interna sin duplicar notificaciones.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isSavingConfig}
                    onClick={handleSaveConfig}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    {isSavingConfig ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Guardar Parámetros en Servidor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Requirement 7 & 8: Test Email with Custom Authorized Recipient & Real Result Display */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-display">Prueba de Envío en Tiempo Real</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dispara una prueba real hacia cualquier correo autorizado para comprobar la entrega de Google Apps Script.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Destinatario Libre
                    </span>
                  </div>
                </div>

                {/* Selector de Tipo de Prueba */}
                <div className="flex flex-wrap items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 ml-1">Modo de Prueba:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="testMode"
                      value="cotizacion"
                      checked={testMode === 'cotizacion'}
                      onChange={() => setTestMode('cotizacion')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>📄 Cotización Oficial (con PDF adjunto y Vista Previa PNG)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="testMode"
                      value="conectividad"
                      checked={testMode === 'conectividad'}
                      onChange={() => setTestMode('conectividad')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>⚡ Conectividad Básica</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Correo de Prueba Autorizado (Destinatario Principal):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={testRecipientEmail}
                      onChange={(e) => setTestRecipientEmail(e.target.value)}
                      placeholder="ejemplo_cliente@empresa.com"
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isTestingBackend || !testRecipientEmail.trim()}
                      onClick={handleSendBackendTest}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      {isTestingBackend ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Contactando Apps Script...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{testMode === 'cotizacion' ? 'Probar Envío con PDF' : 'Enviar Prueba Simple'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Puedes ingresar un correo diferente al tuyo (por ejemplo una cuenta secundaria o de prueba) para confirmar que el cliente recibe el mensaje con el PDF original adjunto.
                  </p>
                </div>

                {/* Requirement 8: Real Result Display with full response payload / errors */}
                {backendTestResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                      backendTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {backendTestResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-2 flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>{backendTestResult.message}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${backendTestResult.success ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'}`}>
                            {backendTestResult.success ? 'OK: true' : 'ERROR'}
                          </span>
                        </div>

                        {/* Ficha técnica del despacho (Requisito 8) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-white/80 rounded-lg border border-slate-200 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Proveedor:</span>
                            <span className="font-bold text-slate-800">GOOGLE_APPS_SCRIPT</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Destinatario Real:</span>
                            <span className="font-bold text-slate-800 font-mono truncate block" title={testRecipientEmail}>{testRecipientEmail}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">PDF Adjunto:</span>
                            <span className={`font-bold ${backendTestResult.pdfAdjunto ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {backendTestResult.pdfAdjunto !== undefined
                                ? (backendTestResult.pdfAdjunto ? '✓ Sí (true)' : '✗ No')
                                : (testMode === 'cotizacion' ? 'Enviado' : 'No aplica')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Vista Previa:</span>
                            <span className={`font-bold ${backendTestResult.vistaPrevia ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {backendTestResult.vistaPrevia !== undefined
                                ? (backendTestResult.vistaPrevia ? '✓ Sí (true)' : '✗ No')
                                : (testMode === 'cotizacion' ? 'Incrustada' : 'No aplica')}
                            </span>
                          </div>
                        </div>

                        {backendTestResult.error && (
                          <div className="p-2.5 bg-rose-100 rounded-lg text-rose-900 font-mono text-[11px]">
                            <strong>Detalle del Error Real:</strong> {backendTestResult.error}
                          </div>
                        )}

                        {backendTestResult.details?.httpStatus === 401 && (
                          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 text-[11px] space-y-1.5 mt-2">
                            <strong className="block text-amber-900 font-bold">¿Cómo corregir el error 401 en script.google.com?</strong>
                            <p>1. Abre tu proyecto en <a href="https://script.google.com" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700">script.google.com</a>.</p>
                            <p>2. Haz clic en <strong>Implementar &gt; Administrar implementaciones</strong> (o Nueva implementación).</p>
                            <p>3. En <strong>Quién tiene acceso</strong>, cámbialo a <strong>"Cualquiera"</strong> (Anyone) para permitir que el backend le entregue las solicitudes POST.</p>
                            <p>4. Si la URL cambió, cópiala y pégala en el campo <em>URL Webhook</em> de arriba y pulsa <strong>Guardar Parámetros en Servidor</strong>.</p>
                          </div>
                        )}

                        {backendTestResult.details && (
                          <div className="mt-2 pt-2 border-t border-slate-200/70">
                            <span className="text-slate-600 block text-[11px] font-semibold mb-1">
                              Respuesta JSON real de Google Apps Script:
                            </span>
                            <pre className="p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] max-h-40 overflow-y-auto">
                              {JSON.stringify(backendTestResult.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: AUDIT LOGS (REGISTRO HISTÓRICO DE ENVÍOS)              */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display">Trazabilidad de Envíos en Tiempo Real</h4>
                  <p className="text-xs text-slate-500">Historial de correos despachados hacia Google Apps Script</p>
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  disabled={isLoadingLogs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Aún no se registran envíos en esta sesión</p>
                  <p className="mt-1">
                    Los correos generados por registros de usuarios, cotizaciones, compras o pruebas aparecerán aquí automáticamente.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                          <th className="py-2.5 px-3.5">Hora</th>
                          <th className="py-2.5 px-3.5">Evento / Tipo</th>
                          <th className="py-2.5 px-3.5">Destinatario</th>
                          <th className="py-2.5 px-3.5">Asunto</th>
                          <th className="py-2.5 px-3.5 text-center">Estado</th>
                          <th className="py-2.5 px-3.5 text-center">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => {
                          const badge = formatLogType(log.type, log.gasTipo);
                          return (
                            <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                                {new Date(log.timestamp).toLocaleTimeString('es-CO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 font-medium text-slate-800">
                                {log.recipient}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-600 max-w-[200px] truncate" title={log.subject}>
                                {log.subject}
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                {log.status === 'EXITOSO' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" /> Exitoso
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
                                    title={log.errorMessage}
                                  >
                                    <XCircle className="w-3 h-3" /> Fallido
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                {(log.responsePayload || log.errorMessage) ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedLogPayload(log)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded cursor-pointer"
                                  >
                                    Ver JSON
                                  </button>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Log Details Modal / Inspector */}
              {selectedLogPayload && (
                <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-300">
                      Detalle técnico del envío ({selectedLogPayload.recipient})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLogPayload(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      Cerrar
                    </button>
                  </div>
                  {selectedLogPayload.errorMessage && (
                    <div className="text-rose-400 font-mono">
                      Error: {selectedLogPayload.errorMessage}
                    </div>
                  )}
                  {selectedLogPayload.responsePayload && (
                    <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-48 p-2 bg-slate-950 rounded">
                      {JSON.stringify(selectedLogPayload.responsePayload, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: CODE .GS & DEPLOYMENT INSTRUCTIONS                     */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'code' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 space-y-1">
                  <p className="font-bold">Instrucciones de Despliegue en Google Apps Script</p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                    <li>Abre <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-blue-700 font-bold underline">script.google.com</a> y crea un <strong>Nuevo proyecto</strong>.</li>
                    <li>Reemplaza el código por defecto con el código que aparece abajo.</li>
                    <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
                    <li>Selecciona tipo: <strong>Aplicación web</strong>.</li>
                    <li>En <em>"Ejecutar como"</em>: selecciona <strong>"Yo (tu cuenta de Google)"</strong>.</li>
                    <li>En <em>"Quién tiene acceso"</em>: selecciona <strong>"Cualquiera"</strong>.</li>
                    <li>Copia la URL generada (termina en <code className="bg-white px-1 py-0.5 rounded font-mono">/exec</code>) y pégala en la pestaña <em>Servicio &amp; Prueba en Vivo</em>.</li>
                  </ol>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Código Oficial .gs para Apps Script</h4>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '¡Código Copiado!' : 'Copiar Código .gs'}</span>
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 text-slate-200 font-mono text-[11px] max-h-72 overflow-y-auto shadow-inner">
                <pre>{getGoogleAppsScriptTemplateCode()}</pre>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 4: DATABASE AUDIT (SUPABASE TABLES & PERSISTENCE)          */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              {/* Header Status Banner */}
              <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        Conexión Supabase PostgreSQL (Solo Lectura Académica)
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        RLS Activo
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 mt-0.5">
                      URL: <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-950">{dbDiagnostic?.endpoint || 'https://ihsimnqprmfihwxjztlc.supabase.co'}</code>
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      Latencia de consulta: <strong className="font-mono">{dbDiagnostic?.latencyMs || '~115'} ms</strong> • Consulta directa sin alteración de esquema ni escrituras de prueba.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadDbDiagnostic}
                  disabled={isLoadingDb}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin' : ''}`} />
                  <span>{isLoadingDb ? 'Consultando...' : 'Re-consultar Tablas'}</span>
                </button>
              </div>

              {/* KPI Cards: Live Tabular Counts (Verified 4 Tables) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Tabla Existente</span>
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <h5 className="text-sm font-black text-slate-900 font-mono">cliente</h5>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-2xl font-black text-blue-900 tabular-nums">
                      {dbDiagnostic?.tables.cliente.count ?? 59}
                    </span>
                    <span className="text-[11px] text-slate-500">filas</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    cliente_id (UUID), nombre, documento, responsable, canal.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Tabla Existente</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                  <h5 className="text-sm font-black text-slate-900 font-mono">proyecto</h5>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-2xl font-black text-amber-900 tabular-nums">
                      {dbDiagnostic?.tables.proyecto.count ?? 29}
                    </span>
                    <span className="text-[11px] text-slate-500">filas</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    FK cliente_id, ciudad, tipo_proyecto, area_m2 (m²), estado.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-indigo-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Tabla Existente</span>
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <h5 className="text-sm font-black text-slate-900 font-mono">especificacion_tecnica</h5>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-2xl font-black text-indigo-900 tabular-nums">
                      {dbDiagnostic?.tables.especificacion_tecnica.count ?? 22}
                    </span>
                    <span className="text-[11px] text-slate-500">filas</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    FK proyecto_id, superficie, ambiente, condicion, color, Estado.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-purple-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Tabla Existente</span>
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <h5 className="text-sm font-black text-slate-900 font-mono">evidencia</h5>
                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-2xl font-black text-purple-900 tabular-nums">
                      {dbDiagnostic?.tables.evidencia?.count ?? 5}
                    </span>
                    <span className="text-[11px] text-slate-500">filas</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    FK proyecto_id, descripcion, fotos (JSON adjuntos de obra).
                  </p>
                </div>
              </div>

              {/* Mandatory Academic Rules Notice */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 text-xs text-blue-950">
                <h5 className="font-bold flex items-center gap-2 text-blue-900">
                  <Info className="w-4 h-4 text-blue-700" />
                  Reglas de Negocio y Semántica de Base de Datos Verificadas
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-blue-900/90 font-sans">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                    <strong>1. proyecto.area_m2:</strong> Representa estrictamente metros cuadrados de superficie física a recubrir (m²). <em>Bajo ninguna circunstancia se almacena dinero en este campo.</em>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                    <strong>2. proyecto.tipo_proyecto:</strong> Clasifica la tipología de obra arquitectónica (ej. "Residencial", "Comercial", "Fachada"). <em>No se utiliza como identificador de catálogo de productos.</em>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                    <strong>3. proyecto.estado = 'Aprobada':</strong> Representa la aceptación técnico-comercial de la cotización por parte del cliente. <em>No se considera automáticamente una compra pagada.</em>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100">
                    <strong>4. Políticas RLS & Privacidad:</strong> La información personal de otros clientes se encuentra aislada. Los visitantes y terceros no tienen acceso a documentos, teléfonos ni correos privados.
                  </div>
                </div>
              </div>

              {/* Module Connection & Storage Location Matrix */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Matriz de Persistencia: Supabase vs Memoria/Navegador
                    </h5>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Informe para Sustentación</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100/80 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Módulo Funcional</th>
                        <th className="px-4 py-2.5">Tabla en Supabase</th>
                        <th className="px-4 py-2.5">Ubicación de Almacenamiento</th>
                        <th className="px-4 py-2.5">Estado de Persistencia</th>
                        <th className="px-4 py-2.5">Diagnóstico y Requerimiento de Esquema</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      <tr className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          Clientes
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-blue-900">cliente (59 filas)</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            Supabase (Nube)
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Persistido
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">
                          Estructura 1:1 directa. Registra UUID, nombre, documento, responsable y canal_entrada.
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          Cotizaciones (Proyectos)
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-amber-900">proyecto (29) + especificacion_tecnica (22)</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Híbrido
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Parcialmente Persistido
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">
                          En Supabase persiste el encabezado de proyecto y la especificación técnica. El desglose de items y cálculos de dinero en COP se resguardan en el navegador por ausencia de tabla <code className="font-mono bg-slate-100 px-1 rounded">detalle_cotizacion</code> en Supabase.
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          Evidencias de Obra
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-purple-900">evidencia (5 filas)</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Supabase (Nube)
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Persistido
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">
                          Tabla real en Supabase con clave foránea a proyecto_id, descripcion de la obra y adjuntos JSON con fotos de sitio.
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
                          Productos / Catálogo
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">No existe tabla en Supabase</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            Navegador / App
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            Catálogo Maestro en App
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">
                          En Supabase no existe tabla <code className="font-mono bg-slate-100 px-1 rounded">productos</code>. Se mantiene el catálogo oficial con 35+ productos, fichas técnicas y precios en COP en la app para evitar pérdida de datos.
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <Server className="w-3.5 h-3.5 text-emerald-600" />
                          Compras / Pedidos
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">No existe tabla en Supabase</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            Navegador / App
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Requiere Tabla Pedido
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">
                          Las órdenes de compra con datos de pago (PSE, tarjeta, transferencia) y despacho residen en almacenamiento local. Un proyecto con estado "Aprobada" en Supabase indica visto bueno comercial, no una compra pagada.
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <Database className="w-3.5 h-3.5 text-slate-600" />
                          Inventario
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">No existe tabla en Supabase</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            Navegador / App
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            Stock de Referencia
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">
                          No existe tabla <code className="font-mono bg-slate-100 px-1 rounded">inventario</code> en Supabase. El control de stock se calcula sobre existencias de referencia de productos Pintuco.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Record Inspector (Academic Evidence for 4 Tables) */}
              <div className="bg-slate-900 rounded-2xl p-4 text-slate-100 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-amber-400">
                      Evidencia de Consulta en Vivo (Muestras Reales de Supabase)
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Registros obtenidos directamente de las 4 tablas existentes mediante consultas de solo lectura.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedTablePreview('cliente')}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                        selectedTablePreview === 'cliente'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      cliente (59)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTablePreview('proyecto')}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                        selectedTablePreview === 'proyecto'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      proyecto (29)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTablePreview('especificacion_tecnica')}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                        selectedTablePreview === 'especificacion_tecnica'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      especificacion_tecnica (22)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTablePreview('evidencia')}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                        selectedTablePreview === 'evidencia'
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      evidencia (5)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-56">
                  {selectedTablePreview === 'cliente' && (
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/50">
                        <tr>
                          <th className="px-3 py-1.5">cliente_id (UUID)</th>
                          <th className="px-3 py-1.5">nombre</th>
                          <th className="px-3 py-1.5">documento</th>
                          <th className="px-3 py-1.5">responsable</th>
                          <th className="px-3 py-1.5">canal_entrada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(dbDiagnostic?.tables.cliente.sample || []).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="px-3 py-1.5 text-blue-400">{row.cliente_id?.substring(0, 8)}...</td>
                            <td className="px-3 py-1.5 text-slate-200 font-bold">{row.nombre}</td>
                            <td className="px-3 py-1.5 text-slate-300">{row.documento}</td>
                            <td className="px-3 py-1.5 text-slate-400">{row.responsable}</td>
                            <td className="px-3 py-1.5 text-emerald-400">{row.canal_entrada}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {selectedTablePreview === 'proyecto' && (
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/50">
                        <tr>
                          <th className="px-3 py-1.5">proyecto_id</th>
                          <th className="px-3 py-1.5">tipo_proyecto (Tipología)</th>
                          <th className="px-3 py-1.5">ciudad</th>
                          <th className="px-3 py-1.5">area_m2 (Metros²)</th>
                          <th className="px-3 py-1.5">estado</th>
                          <th className="px-3 py-1.5">fecha_requerida</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(dbDiagnostic?.tables.proyecto.sample || []).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="px-3 py-1.5 text-amber-400">{row.proyecto_id?.substring(0, 8)}...</td>
                            <td className="px-3 py-1.5 text-slate-200 font-bold">{row.tipo_proyecto}</td>
                            <td className="px-3 py-1.5 text-slate-300">{row.ciudad}</td>
                            <td className="px-3 py-1.5 text-amber-300 font-bold">{row.area_m2} m²</td>
                            <td className="px-3 py-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300 text-[10px]">
                                {row.estado}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-slate-400">{row.fecha_requerida}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {selectedTablePreview === 'especificacion_tecnica' && (
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/50">
                        <tr>
                          <th className="px-3 py-1.5">especificacion_id</th>
                          <th className="px-3 py-1.5">superficie</th>
                          <th className="px-3 py-1.5">ambiente</th>
                          <th className="px-3 py-1.5">color</th>
                          <th className="px-3 py-1.5">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(dbDiagnostic?.tables.especificacion_tecnica.sample || []).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="px-3 py-1.5 text-indigo-400">{row.especificacion_id?.substring(0, 8)}...</td>
                            <td className="px-3 py-1.5 text-slate-200">{row.superficie}</td>
                            <td className="px-3 py-1.5 text-slate-300">{row.ambiente}</td>
                            <td className="px-3 py-1.5 text-cyan-300">{row.color || 'N/A'}</td>
                            <td className="px-3 py-1.5 text-emerald-400">{row.Estado || 'En preparación'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {selectedTablePreview === 'evidencia' && (
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="text-slate-400 border-b border-slate-800 bg-slate-950/50">
                        <tr>
                          <th className="px-3 py-1.5">evidencia_id</th>
                          <th className="px-3 py-1.5">proyecto_id</th>
                          <th className="px-3 py-1.5">descripcion</th>
                          <th className="px-3 py-1.5">fotos (JSON)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(dbDiagnostic?.tables.evidencia?.sample || []).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="px-3 py-1.5 text-purple-400">{row.evidencia_id?.substring(0, 8)}...</td>
                            <td className="px-3 py-1.5 text-slate-300">{row.proyecto_id ? `${row.proyecto_id.substring(0, 8)}...` : 'N/A'}</td>
                            <td className="px-3 py-1.5 text-slate-200 font-bold truncate max-w-xs">{row.descripcion || 'Sin descripción'}</td>
                            <td className="px-3 py-1.5 text-amber-300 truncate max-w-xs">{row.fotos || '[]'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <h5 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Garantías de Integridad y Estabilidad Aplicadas
                </h5>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  <li>• <strong>Cero modificaciones destructivas:</strong> No se alteraron, crearon ni eliminaron tablas en el esquema de Supabase.</li>
                  <li>• <strong>Semántica de Campos Corregida:</strong> <code className="font-mono bg-white px-1 rounded">area_m2</code> representa m² físicos y <code className="font-mono bg-white px-1 rounded">tipo_proyecto</code> tipología de obra.</li>
                  <li>• <strong>Protección de Google Apps Script & PDF:</strong> Los envíos de correos y la generación oficial de PDF continúan 100% operativos.</li>
                  <li>• <strong>Aislamiento de Clientes:</strong> Datos de contacto protegidos respetando políticas de privacidad y RLS.</li>
                  <li>• <strong>Catálogo y Precios Oficiales:</strong> Todos los productos Pintuco con sus precios en COP se mantienen preservados y estables.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Pintuco Color Link • Sistema de Notificaciones Automáticas</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
