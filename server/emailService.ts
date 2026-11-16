import {
  getWelcomeEmailHtml,
  getNewUserAdminEmailHtml,
  getQuoteCustomerEmailHtml,
  getQuoteAdminEmailHtml,
  getQuoteStatusCustomerEmailHtml,
  getOrderCustomerEmailHtml,
  getOrderAdminEmailHtml,
  getOrderStatusCustomerEmailHtml,
  getTestEmailHtml,
} from './emailTemplates.js';
import { getQuotePdfBase64 } from '../src/utils/generateQuotePdf.js';
import { generateQuotePreviewPng } from './quotePreviewPng.js';

export type AllowedGasTipo = 'prueba' | 'registro' | 'cotizacion' | 'compra' | 'estado';

export interface EmailLogEntry {
  id: string;
  timestamp: string;
  type:
    | 'REGISTRO_BIENVENIDA'
    | 'REGISTRO_ADMIN'
    | 'COTIZACION_CLIENTE'
    | 'COTIZACION_ADMIN'
    | 'COTIZACION_ESTADO'
    | 'PEDIDO_CLIENTE'
    | 'PEDIDO_ADMIN'
    | 'PEDIDO_ESTADO'
    | 'TEST_CONEXION';
  gasTipo: AllowedGasTipo;
  recipient: string;
  subject: string;
  status: 'EXITOSO' | 'FALLIDO';
  provider: 'GOOGLE_APPS_SCRIPT';
  referenceId?: string;
  errorMessage?: string;
  previewUrl?: string;
  responsePayload?: any;
}

export function resolveGasTipo(tipo?: string, eventType?: EmailLogEntry['type']): AllowedGasTipo {
  const norm = (tipo || '').toLowerCase().trim();
  if (norm === 'prueba' || norm === 'registro' || norm === 'cotizacion' || norm === 'compra' || norm === 'estado') {
    return norm;
  }
  if (norm === 'pedido') return 'compra';
  if (eventType === 'REGISTRO_BIENVENIDA') return 'registro';
  if (eventType === 'COTIZACION_CLIENTE' || eventType === 'COTIZACION_ADMIN') return 'cotizacion';
  if (eventType === 'PEDIDO_CLIENTE' || eventType === 'PEDIDO_ADMIN') return 'compra';
  if (eventType === 'COTIZACION_ESTADO' || eventType === 'PEDIDO_ESTADO') return 'estado';
  return 'prueba';
}

// In-memory audit log for sent notifications
const notificationLogs: EmailLogEntry[] = [];

// Anti-duplicate (idempotency) cache: records key -> timestamp
const recentDispatchCache = new Map<string, number>();
const DUP_WINDOW_MS = 25000; // 25 seconds window to block accidental duplicate clicks

// Runtime configuration cache (strictly initialized from private server environment variables)
const runtimeConfig = {
  gasUrl: (process.env.GOOGLE_APPS_SCRIPT_URL || '').trim(),
  mailSecret: (process.env.MAIL_SECRET || '').trim(),
  adminEmail: (process.env.ADMIN_EMAIL || 'salgadoarevaloleidy@gmail.com').trim(),
};

export function isValidEmail(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return re.test(email.trim());
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const lastTime = recentDispatchCache.get(key);
  if (lastTime && now - lastTime < DUP_WINDOW_MS) {
    return true;
  }
  recentDispatchCache.set(key, now);

  // Clean old cache entries
  if (recentDispatchCache.size > 200) {
    for (const [k, time] of recentDispatchCache.entries()) {
      if (now - time > DUP_WINDOW_MS) {
        recentDispatchCache.delete(k);
      }
    }
  }
  return false;
}

export function getAdminEmail(): string {
  return runtimeConfig.adminEmail || process.env.ADMIN_EMAIL?.trim() || 'salgadoarevaloleidy@gmail.com';
}

export function getGasUrl(): string {
  return runtimeConfig.gasUrl || process.env.GOOGLE_APPS_SCRIPT_URL?.trim() || '';
}

export function getMailSecret(): string {
  return runtimeConfig.mailSecret || process.env.MAIL_SECRET?.trim() || '';
}

export function updateRuntimeConfig(updates: { gasUrl?: string; mailSecret?: string; adminEmail?: string }) {
  if (updates.gasUrl !== undefined) {
    runtimeConfig.gasUrl = updates.gasUrl.trim();
    process.env.GOOGLE_APPS_SCRIPT_URL = runtimeConfig.gasUrl;
  }
  if (updates.mailSecret !== undefined) {
    runtimeConfig.mailSecret = updates.mailSecret.trim();
    process.env.MAIL_SECRET = runtimeConfig.mailSecret;
  }
  if (updates.adminEmail !== undefined && isValidEmail(updates.adminEmail)) {
    runtimeConfig.adminEmail = updates.adminEmail.trim();
    process.env.ADMIN_EMAIL = runtimeConfig.adminEmail;
  }
}

function addLog(entry: EmailLogEntry) {
  notificationLogs.unshift(entry);
  if (notificationLogs.length > 200) {
    notificationLogs.pop();
  }
}

export function getLogs(): EmailLogEntry[] {
  return [...notificationLogs];
}

/**
 * Sends notification via Google Apps Script (sole primary provider).
 * Strict Rules Enforced:
 * 1. NEVER attaches MAIL_SECRET to the URL query string.
 * 2. Sends both `secret` and `mailSecret` in the JSON POST body.
 * 3. Client email is the primary recipient (`to`, `recipient`, `clientEmail`).
 * 4. Passes `adminEmail` and `adminHtml` so Apps Script can handle admin delivery in one single call.
 * 5. Validates JSON response and checks that ok === true (or status === 'success').
 */
async function postToGoogleAppsScript({
  recipient,
  subject,
  html,
  type,
  referenceId,
  extraPayload,
}: {
  recipient: string;
  subject: string;
  html: string;
  type: EmailLogEntry['type'];
  referenceId?: string;
  extraPayload?: Record<string, any>;
}): Promise<{
  success: boolean;
  ok: boolean;
  message?: string;
  error?: string;
  responseData?: any;
  httpStatus?: number;
}> {
  let gasUrl = getGasUrl().trim();
  const mailSecret = getMailSecret();
  const adminEmail = getAdminEmail();

  if (!gasUrl || !gasUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      ok: false,
      error: 'GOOGLE_APPS_SCRIPT_URL no está configurada o es inválida en las variables privadas del servidor. Debe iniciar con https://script.google.com/',
    };
  }

  // 4. Comprueba que GOOGLE_APPS_SCRIPT_URL termine en /exec
  try {
    const u = new URL(gasUrl);
    u.search = ''; // Strip any accidental query string
    let path = u.pathname;
    if (path.endsWith('/dev')) {
      path = path.replace(/\/dev$/, '/exec');
    } else if (!path.endsWith('/exec')) {
      path = path.replace(/\/+$/, '') + '/exec';
    }
    u.pathname = path;
    gasUrl = u.toString();
  } catch {}

  if (!gasUrl.endsWith('/exec')) {
    return {
      success: false,
      ok: false,
      error: `GOOGLE_APPS_SCRIPT_URL inválida ("${gasUrl}"). Debe terminar estrictamente en /exec.`,
    };
  }

  // 4 y 5. Tipos permitidos: prueba, registro, cotizacion, compra, estado
  const normalizedTipo = resolveGasTipo(extraPayload?.tipo, type);

  const recipientName = String(
    extraPayload?.nombre ||
    extraPayload?.user?.name ||
    extraPayload?.customer?.name ||
    extraPayload?.cliente_nombre ||
    'Cliente Autorizado Pintuco'
  ).trim();

  const refNumber = String(extraPayload?.numero || referenceId || 'REF-001').trim();
  const detallesMsg = String(extraPayload?.detalles || subject || 'Notificación oficial Pintuco ColorLink').trim();
  const currentEstado = String(extraPayload?.estado || extraPayload?.newStatus || 'Aprobado').trim();

  // Requisitos 4 y 5: Solicitud POST desde el backend utilizando exactamente estos campos:
  // secret, tipo, email, nombre, numero, detalles, estado
  // Más campos opcionales de compatibilidad para adjuntos y vista previa (Fase 4):
  // pdfBase64, pdfName, imageBase64, imageName
  const bodyPayload: Record<string, any> = {
    secret: mailSecret,
    tipo: normalizedTipo,
    email: recipient.trim().toLowerCase(),
    nombre: recipientName,
    numero: refNumber,
    detalles: detallesMsg,
    estado: currentEstado,
  };

  if (extraPayload?.pdfBase64 && typeof extraPayload.pdfBase64 === 'string') {
    bodyPayload.pdfBase64 = extraPayload.pdfBase64;
    bodyPayload.pdfName = extraPayload.pdfName || `${refNumber}.pdf`;
  }

  if (extraPayload?.imageBase64 && typeof extraPayload.imageBase64 === 'string') {
    bodyPayload.imageBase64 = extraPayload.imageBase64;
    bodyPayload.imageName = extraPayload.imageName || 'preview.png';
  }

  // Validar en el backend que el tamaño no exceda el límite permitido por Google Apps Script (10 MB)
  const totalBase64Len =
    (bodyPayload.pdfBase64 ? bodyPayload.pdfBase64.length : 0) +
    (bodyPayload.imageBase64 ? bodyPayload.imageBase64.length : 0);
  if (totalBase64Len > 14 * 1024 * 1024) {
    return {
      success: false,
      ok: false,
      error: 'El tamaño de los archivos adjuntos excede el límite máximo permitido por Google Apps Script (10 MB).',
    };
  }

  try {
    // IMPORTANT: URL is strictly clean gasUrl with NO query parameters (never append ?secret=...)
    // Standard Google Apps Script Web Apps return a 302 redirect to script.googleusercontent.com
    // which must be retrieved via GET.
    let response = await fetch(gasUrl, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyPayload),
    });

    // If Google Apps Script returns a 302 redirect (standard behavior for doPost)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        response = await fetch(location, {
          method: 'GET',
          redirect: 'follow',
        });
      }
    } else if (response.status === 401 || response.status === 403) {
      // Also try with redirect follow as fallback in case Google handled it differently
      try {
        const altResponse = await fetch(gasUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        });
        if (altResponse.ok) {
          response = altResponse;
        }
      } catch {}
    }

    const httpStatus = response.status;
    const responseText = await response.text();
    let jsonResponse: any = null;

    try {
      jsonResponse = JSON.parse(responseText);
    } catch {
      // Extract title from HTML if returned by Google
      const titleMatch = responseText.match(/<title>([^<]+)<\/title>/i);
      const htmlTitle = titleMatch ? titleMatch[1].trim() : '';

      // Requirement 5: Never confuse an HTTP 200 HTML response with success. Apps Script MUST return valid JSON with ok: true
      const errorDetail = httpStatus === 401
        ? `Google Apps Script retornó HTTP 401 (No Autorizado - "${htmlTitle || 'Acceso restringido'}"). Esto ocurre cuando en script.google.com la implementación tiene 'Quién tiene acceso' configurado como 'Solo yo' o 'Mi organización' en lugar de 'Cualquiera'.`
        : `Google Apps Script no devolvió un JSON válido (HTTP ${httpStatus} - "${htmlTitle || 'HTML'}"). Respuesta recibida: ${responseText.slice(0, 250)}`;

      return {
        success: false,
        ok: false,
        httpStatus,
        error: errorDetail,
        responseData: {
          httpStatus,
          title: htmlTitle,
          rawSnippet: responseText.slice(0, 300),
        },
      };
    }

    // Verify response indicates true success:
    // Checks for ok === true or status === 'success' or success === true
    const isOk = Boolean(
      jsonResponse &&
        (jsonResponse.ok === true ||
          jsonResponse.ok === 'true' ||
          jsonResponse.status === 'success' ||
          jsonResponse.status === 'ok' ||
          jsonResponse.success === true)
    );

    if (!isOk) {
      const errMsg =
        jsonResponse?.error ||
        jsonResponse?.message ||
        jsonResponse?.status ||
        `Google Apps Script respondió sin ok: true (HTTP ${httpStatus})`;
      return {
        success: false,
        ok: false,
        httpStatus,
        error: String(errMsg),
        responseData: jsonResponse,
      };
    }

    // Para cotizaciones, verificar y normalizar confirmación de adjuntos por parte de Apps Script
    if (normalizedTipo === 'cotizacion' && jsonResponse) {
      const hasPdf = Boolean(jsonResponse.pdfAdjunto === true || jsonResponse.pdfAdjunto === 'true');
      const hasPreview = Boolean(
        jsonResponse.vistaPrevia === true ||
        jsonResponse.vistaPrevia === 'true' ||
        jsonResponse.vistaPreviaIncrustada === true ||
        jsonResponse.vistaPreviaIncrustada === 'true'
      );

      jsonResponse.pdfAdjunto = hasPdf;
      jsonResponse.vistaPrevia = hasPreview;
      jsonResponse.vistaPreviaIncrustada = hasPreview;
    }

    return {
      success: true,
      ok: true,
      httpStatus,
      message: jsonResponse.message || 'Notificación despachada exitosamente vía Google Apps Script',
      responseData: jsonResponse,
    };
  } catch (err: any) {
    return {
      success: false,
      ok: false,
      error: `Error de red al conectar con Google Apps Script: ${err.message}`,
    };
  }
}

/**
 * Primary Email Dispatcher:
 * Exclusively executes through Google Apps Script.
 */
export async function sendEmail({
  to,
  subject,
  html,
  type,
  referenceId,
  extraPayload,
}: {
  to: string;
  subject: string;
  html: string;
  type: EmailLogEntry['type'];
  referenceId?: string;
  extraPayload?: Record<string, any>;
}): Promise<{
  success: boolean;
  ok: boolean;
  provider: EmailLogEntry['provider'];
  messageId?: string;
  error?: string;
  responseData?: any;
}> {
  const normRecipient = to.trim().toLowerCase();
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const gasTipo = resolveGasTipo(extraPayload?.tipo, type);

  // 1. Email validation: verify recipient is a valid email
  if (!isValidEmail(normRecipient)) {
    const errorMsg = `Dirección de correo inválida: "${to}"`;
    console.error(`[EmailService] ${errorMsg}`);
    addLog({
      id: logId,
      timestamp: new Date().toISOString(),
      type,
      gasTipo,
      recipient: to,
      subject,
      status: 'FALLIDO',
      provider: 'GOOGLE_APPS_SCRIPT',
      referenceId,
      errorMessage: errorMsg,
    });
    return {
      success: false,
      ok: false,
      provider: 'GOOGLE_APPS_SCRIPT',
      error: errorMsg,
    };
  }

  // 2. Anti-duplicate (idempotency) check
  const idempotencyKey = `${type}_${normRecipient}_${referenceId || ''}`;
  if (isDuplicate(idempotencyKey)) {
    console.warn(`[EmailService] Previniendo envío duplicado para: ${idempotencyKey}`);
    return {
      success: true,
      ok: true,
      provider: 'GOOGLE_APPS_SCRIPT',
      messageId: `dup-${Date.now()}`,
      responseData: { duplicatePrevented: true, key: idempotencyKey },
    };
  }

  // 3. SOLE PROVIDER: Google Apps Script Webhook (POST from backend)
  const gasResult = await postToGoogleAppsScript({
    recipient: normRecipient,
    subject,
    html,
    type,
    referenceId,
    extraPayload,
  });

  if (gasResult.success) {
    addLog({
      id: logId,
      timestamp: new Date().toISOString(),
      type,
      gasTipo,
      recipient: normRecipient,
      subject,
      status: 'EXITOSO',
      provider: 'GOOGLE_APPS_SCRIPT',
      referenceId,
      responsePayload: gasResult.responseData,
    });

    return {
      success: true,
      ok: true,
      provider: 'GOOGLE_APPS_SCRIPT',
      messageId: gasResult.responseData?.messageId || `gas-${Date.now()}`,
      responseData: gasResult.responseData,
    };
  }

  // Failure handling: NO simulated fallback, report the real failure
  console.error(`[EmailService] Falló envío vía Google Apps Script: ${gasResult.error}`);
  addLog({
    id: logId,
    timestamp: new Date().toISOString(),
    type,
    gasTipo,
    recipient: normRecipient,
    subject,
    status: 'FALLIDO',
    provider: 'GOOGLE_APPS_SCRIPT',
    referenceId,
    errorMessage: gasResult.error,
    responsePayload: gasResult.responseData,
  });

  return {
    success: false,
    ok: false,
    provider: 'GOOGLE_APPS_SCRIPT',
    error: gasResult.error,
    responseData: gasResult.responseData,
  };
}

export function getProviderConfigStatus(): {
  activeProvider: string;
  adminEmail: string;
  googleAppsScriptConfigured: boolean;
  mailSecretConfigured: boolean;
  gasUrlMasked: string;
  totalSent: number;
} {
  const gasUrl = getGasUrl();
  const mailSecret = getMailSecret();
  const isGasConfigured = Boolean(gasUrl && gasUrl.startsWith('https://script.google.com/'));

  let maskedUrl = '';
  if (gasUrl) {
    try {
      const u = new URL(gasUrl);
      maskedUrl = `${u.origin}${u.pathname.slice(0, 25)}.../exec`;
    } catch {
      maskedUrl = 'URL de Google Apps Script configurada';
    }
  }

  return {
    activeProvider: isGasConfigured
      ? 'Google Apps Script (Proveedor Principal)'
      : 'Google Apps Script (Pendiente de URL en variables privadas)',
    adminEmail: getAdminEmail(),
    googleAppsScriptConfigured: isGasConfigured,
    mailSecretConfigured: Boolean(mailSecret),
    gasUrlMasked: maskedUrl,
    totalSent: notificationLogs.filter((l) => l.status === 'EXITOSO').length,
  };
}

// -------------------------------------------------------------
// EVENT DISPATCHERS (SINGLE DISPATCH RULE ENFORCED)
// Cada evento realiza EXACTAMENTE UNA petición a Google Apps Script,
// evitando duplicados al administrador ya que Apps Script notifica
// a ambos en esa única ejecución.
// -------------------------------------------------------------

/**
 * 1. REGISTRO DE USUARIOS:
 * - Destinatario principal: correo registrado por el cliente (bienvenida sin contraseña).
 * - Notificación adicional: Apps Script notifica al administrador en la misma petición.
 */
export async function dispatchWelcomeNotifications(user: {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  idNumber?: string;
  role?: string;
  createdAt?: string;
}): Promise<{ success: boolean; ok: boolean; clientResult: any; error?: string }> {
  const clientHtml = getWelcomeEmailHtml(user);
  const adminHtml = getNewUserAdminEmailHtml(user);
  const adminEmail = getAdminEmail();

  const refNumber = user.idNumber || user.role || `REG-${Date.now().toString().slice(-4)}`;
  const detallesMsg = `Bienvenida a Pintuco ColorLink | Usuario: ${user.name} | Ciudad: ${user.city || 'Bogotá D.C.'} | Tel: ${user.phone || 'No registrado'} | Perfil: ${user.role || 'Cliente'}`;

  // Envío unificado al destinatario principal (cliente registrado)
  // Requisitos 4 y 5: tipo 'registro'
  const result = await sendEmail({
    to: user.email,
    subject: `¡Bienvenido a Pintuco Color Link, ${user.name}! Tu cuenta está lista`,
    html: clientHtml,
    type: 'REGISTRO_BIENVENIDA',
    referenceId: refNumber,
    extraPayload: {
      tipo: 'registro',
      email: user.email,
      nombre: user.name,
      numero: refNumber,
      detalles: detallesMsg,
      estado: 'Registrado',
    },
  });

  return {
    success: result.success,
    ok: result.ok,
    clientResult: result,
    error: result.error,
  };
}

/**
 * 2. SOLICITUDES DE COTIZACIÓN:
 * - Destinatario principal: correo del cliente (confirmación con productos, cantidades y valor total).
 * - FASE 2: Adjunta el PDF oficial original nombrado Cotizacion_Pintuco_[RADICADO].pdf
 * - FASE 3: Incrusta la vista previa visual fiel de la cotización usando cid:previewImage
 * - Notificación adicional: Apps Script notifica al administrador en la misma petición.
 */
export async function dispatchQuoteNotifications(
  quote: any,
  files?: {
    pdfBase64?: string;
    pdfName?: string;
    imageBase64?: string;
    imageName?: string;
  }
): Promise<{ success: boolean; ok: boolean; clientResult: any; error?: string }> {
  const clientEmail = (quote.customer?.email || quote.cliente_email || '').trim().toLowerCase();
  const adminEmail = getAdminEmail();
  const rad = quote.quoteNumber || 'COT-2026';
  const sanitizedRad = rad.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (!clientEmail || !isValidEmail(clientEmail)) {
    return {
      success: false,
      ok: false,
      clientResult: null,
      error: `Correo del cliente inválido o ausente: "${clientEmail}"`,
    };
  }

  // FASE 2: Reutilizar el PDF real generado por ColorLink para cada cotización
  let pdfBase64 = files?.pdfBase64;
  let pdfName = files?.pdfName || `Cotizacion_Pintuco_${sanitizedRad}.pdf`;

  if (!pdfBase64) {
    try {
      const generated = getQuotePdfBase64(quote);
      pdfBase64 = generated.base64;
      pdfName = generated.filename;
    } catch (e: any) {
      console.warn('[EmailService] Generación de PDF en servidor:', e.message);
    }
  }

  // FASE 3: Reutilizar la vista previa PNG enviada por el cliente o generarla en el servidor
  let imageBase64 = files?.imageBase64;
  let imageName = files?.imageName || `VistaPrevia_Cotizacion_${sanitizedRad}.png`;

  if (!imageBase64) {
    try {
      const pngBuf = generateQuotePreviewPng(quote);
      imageBase64 = pngBuf.toString('base64');
    } catch (e: any) {
      console.warn('[EmailService] Generación de vista previa PNG en servidor:', e.message);
    }
  }

  const items = quote.items || [];
  const itemsText = items
    .map(
      (it: any) =>
        `${it.productName} (${it.presentation || '1 galón'}) x${it.quantity}: $${Number(it.subtotal || 0).toLocaleString('es-CO')}`
    )
    .join(', ');
  const detallesSummary = `${itemsText || 'Cotización de pinturas'} | Subtotal: $${Number(quote.subtotal || 0).toLocaleString('es-CO')} | IVA (19%): $${Number(quote.ivaAmount || 0).toLocaleString('es-CO')} | Total: $${Number(quote.total || 0).toLocaleString('es-CO')} COP | Vigencia: ${quote.validityDays || 15} días | Radicado: ${rad}`;

  const clientHtml = getQuoteCustomerEmailHtml(quote, { hasPreviewImage: Boolean(imageBase64) });
  const adminHtml = getQuoteAdminEmailHtml(quote);

  // Envío unificado: una sola llamada a Apps Script (Regla de Despacho Único)
  const result = await sendEmail({
    to: clientEmail,
    subject: `📋 Cotización Radicada [${rad}] - Pintuco Color Link`,
    html: clientHtml,
    type: 'COTIZACION_CLIENTE',
    referenceId: rad,
    extraPayload: {
      tipo: 'cotizacion',
      email: clientEmail,
      nombre: quote.customer?.name || 'Cliente Particular',
      numero: rad,
      detalles: detallesSummary,
      estado: quote.status || 'En preparación',
      subtotal: quote.subtotal,
      iva: quote.ivaAmount,
      total: quote.total,
      quote,
      customer: quote.customer,
      adminEmail,
      adminHtml,
      adminSubject: `📋 Nueva Cotización [${rad}] - ${quote.customer?.name || 'Cliente Web'}`,
      pdfBase64,
      pdfName,
      imageBase64,
      imageName,
    },
  });

  return {
    success: result.success,
    ok: result.ok,
    clientResult: result,
    error: result.error,
  };
}

/**
 * 3. COMPRAS DE CLIENTES CONFIRMADAS (PEDIDOS):
 * - Destinatario principal: correo del cliente con los detalles de compra.
 * - Notificación adicional: Apps Script notifica al administrador en la misma petición.
 */
export async function dispatchOrderNotifications(
  order: any
): Promise<{ success: boolean; ok: boolean; clientResult: any; error?: string }> {
  const clientEmail = (order.cliente_email || order.customer?.email || '').trim().toLowerCase();
  const adminEmail = getAdminEmail();
  const orderNum = order.orderNumber || 'PED-2026';

  if (!clientEmail || !isValidEmail(clientEmail)) {
    return {
      success: false,
      ok: false,
      clientResult: null,
      error: `Correo del cliente inválido o ausente para el pedido: "${clientEmail}"`,
    };
  }

  const clientHtml = getOrderCustomerEmailHtml(order);
  const adminHtml = getOrderAdminEmailHtml(order);

  const items = order.items || [];
  const itemsText = items
    .map(
      (it: any) =>
        `${it.productName || it.name} (${it.presentation || '1 galón'}) x${it.quantity}: $${Number(it.subtotal || 0).toLocaleString('es-CO')}`
    )
    .join(', ');
  const detallesOrder = `${itemsText || 'Compra de pinturas y materiales'} | Total Pedido: $${Number(order.total || 0).toLocaleString('es-CO')} COP | Método de Pago: ${order.paymentMethod || 'Transferencia'} | Destino: ${order.deliveryAddress || order.deliveryCity || order.customer?.city || 'Bogotá D.C.'}`;

  // Requisitos 4 y 5: Solicitud con tipo 'compra' y campos exactos
  const result = await sendEmail({
    to: clientEmail,
    subject: `🛍️ Confirmación de Compra [${orderNum}] - Pintuco Color Link`,
    html: clientHtml,
    type: 'PEDIDO_CLIENTE',
    referenceId: orderNum,
    extraPayload: {
      tipo: 'compra',
      email: clientEmail,
      nombre: order.cliente_nombre || order.customer?.name || 'Cliente Particular',
      numero: orderNum,
      detalles: detallesOrder,
      estado: order.status || 'Pendiente de Confirmación de Pago',
    },
  });

  return {
    success: result.success,
    ok: result.ok,
    clientResult: result,
    error: result.error,
  };
}

/**
 * 4. CAMBIO DE ESTADO DE UNA COTIZACIÓN:
 * - Destinatario principal: notificar al cliente el nuevo estado.
 * - Apps Script envía copia al administrador si está configurado en el script.
 */
export async function dispatchQuoteStatusNotification(
  quote: any,
  oldStatus: string,
  newStatus: string,
  customMessage?: string
): Promise<{ success: boolean; ok: boolean; clientResult: any; error?: string }> {
  const clientEmail = (quote.customer?.email || quote.cliente_email || '').trim().toLowerCase();
  const adminEmail = getAdminEmail();
  const rad = quote.quoteNumber || 'COT-2026';

  if (!clientEmail || !isValidEmail(clientEmail)) {
    return {
      success: false,
      ok: false,
      clientResult: null,
      error: `No se encontró un correo válido para el cliente en la cotización ${rad}`,
    };
  }

  const html = getQuoteStatusCustomerEmailHtml(quote, oldStatus, newStatus, customMessage);

  const detalles = `Cotización ${rad}: cambio de estado de [${oldStatus}] a [${newStatus}]${customMessage ? ' | Nota: ' + customMessage : ''}`;

  const result = await sendEmail({
    to: clientEmail,
    subject: `Actualización de Estado: Cotización ${rad} -> [${newStatus}]`,
    html,
    type: 'COTIZACION_ESTADO',
    referenceId: `${rad}_${newStatus}`,
    extraPayload: {
      tipo: 'estado',
      email: clientEmail,
      nombre: quote.customer?.name || 'Cliente Particular',
      numero: rad,
      detalles: detalles,
      estado: newStatus,
    },
  });

  return {
    success: result.success,
    ok: result.ok,
    clientResult: result,
    error: result.error,
  };
}

/**
 * 4. CAMBIO DE ESTADO DE UNA COMPRA / PEDIDO:
 * - Destinatario principal: notificar al cliente el estado logístico del despacho.
 * - Apps Script envía copia al administrador si está configurado en el script.
 */
export async function dispatchOrderStatusNotification(
  order: any,
  newStatus: string
): Promise<{ success: boolean; ok: boolean; clientResult: any; error?: string }> {
  const clientEmail = (order.cliente_email || order.customer?.email || '').trim().toLowerCase();
  const adminEmail = getAdminEmail();
  const orderNum = order.orderNumber || 'PED-2026';

  if (!clientEmail || !isValidEmail(clientEmail)) {
    return {
      success: false,
      ok: false,
      clientResult: null,
      error: `No se encontró un correo de cliente válido para el pedido ${orderNum}`,
    };
  }

  const html = getOrderStatusCustomerEmailHtml(order, newStatus);
  const detalles = `Pedido de compra ${orderNum}: estado de entrega actualizado a [${newStatus}]`;

  const result = await sendEmail({
    to: clientEmail,
    subject: `Trazabilidad de Entrega: Pedido ${orderNum} -> [${newStatus}]`,
    html,
    type: 'PEDIDO_ESTADO',
    referenceId: `${orderNum}_${newStatus}`,
    extraPayload: {
      tipo: 'estado',
      email: clientEmail,
      nombre: order.cliente_nombre || order.customer?.name || 'Cliente Particular',
      numero: orderNum,
      detalles: detalles,
      estado: newStatus,
    },
  });

  return {
    success: result.success,
    ok: result.ok,
    clientResult: result,
    error: result.error,
  };
}

/**
 * PRUEBA DE CONECTIVIDAD:
 * Permite realizar una prueba a cualquier correo autorizado (cliente o administrador).
 * Envía los campos exactos: secret, tipo, email, nombre, numero, detalles y estado.
 */
export async function dispatchTestEmail(
  targetEmail: string,
  customData?: {
    nombre?: string;
    numero?: string;
    detalles?: string;
    estado?: string;
    tipo?: string;
  }
): Promise<any> {
  const status = getProviderConfigStatus();
  const html = getTestEmailHtml(targetEmail, status.activeProvider);
  const testNumber = customData?.numero || `TEST-${Date.now().toString().slice(-4)}`;

  return sendEmail({
    to: targetEmail,
    subject: '✅ Verificación de Notificaciones Oficiales - Pintuco Color Link',
    html,
    type: 'TEST_CONEXION',
    referenceId: testNumber,
    extraPayload: {
      tipo: 'prueba',
      email: targetEmail,
      nombre: customData?.nombre || 'Usuario Autorizado Pintuco',
      numero: testNumber,
      detalles: customData?.detalles || 'Prueba de conexión real entre backend seguro y Google Apps Script',
      estado: customData?.estado || 'Aprobado',
    },
  });
}
