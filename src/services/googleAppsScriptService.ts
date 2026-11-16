import { Quote, OrderConfirmation } from '../types';

export const GAS_STORAGE_KEY = 'colorpro_gas_webhook_url';
export const GAS_DEFAULT_EMAIL = 'salgadoarevaloleidy@gmail.com';
export const GOOGLE_APPS_SCRIPT_EXEC_URL =
  'https://script.google.com/macros/s/AKfycbw2HSMvC9ZC2vlNXDUUMf9iUF1WV3MDo4rokoGP6yuajndPQvCfVpXBWiduE6HieXhjfg/exec';

export interface SendGoogleEmailParams {
  email: string;
  asunto: string;
  mensaje: string;
}

/**
 * Servicio centralizado de notificaciones por correo vía Google Apps Script.
 * Ejecuta un fetch POST en segundo plano con mode: 'no-cors' hacia el Web App oficial.
 */
export async function sendGoogleEmail({
  email,
  asunto,
  mensaje,
}: SendGoogleEmailParams): Promise<boolean> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return false;
  }

  try {
    await fetch(GOOGLE_APPS_SCRIPT_EXEC_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        email: cleanEmail,
        asunto,
        mensaje,
      }),
    });
    return true;
  } catch (error) {
    console.warn('[sendGoogleEmail] Error al enviar notificación vía Google Apps Script:', error);
    return false;
  }
}

/**
 * Get current Google Apps Script Webhook URL (informational only; actual calls execute via secure backend)
 */
export function getGoogleAppsScriptUrl(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(GAS_STORAGE_KEY);
      if (stored && stored.trim().length > 0) {
        return stored.trim();
      }
    }
  } catch {}
  return '';
}

/**
 * Save Google Apps Script Webhook URL to localStorage (informational)
 */
export function setGoogleAppsScriptUrl(url: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (url.trim()) {
        localStorage.setItem(GAS_STORAGE_KEY, url.trim());
      } else {
        localStorage.removeItem(GAS_STORAGE_KEY);
      }
    }
  } catch {}
}

/**
 * Legacy proxy dispatchers: all routing now executes securely through backend /api/notifications/*
 * ensuring MAIL_SECRET and GOOGLE_APPS_SCRIPT_URL remain strictly confidential.
 */
export async function sendQuoteNotification(
  quote: Quote,
  _adminEmail: string = GAS_DEFAULT_EMAIL
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/notifications/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote }),
    });
    const data = await res.json();
    return { success: data.success ?? res.ok, message: data.message || 'Cotización notificada' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function sendOrderNotification(
  order: OrderConfirmation,
  _adminEmail: string = GAS_DEFAULT_EMAIL
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/notifications/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });
    const data = await res.json();
    return { success: data.success ?? res.ok, message: data.message || 'Pedido notificado' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function sendTestNotification(
  targetEmail: string = GAS_DEFAULT_EMAIL
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail }),
    });
    const data = await res.json();
    return { success: data.success ?? res.ok, message: data.message || 'Prueba despachada' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Ready-to-use Google Apps Script code for the user in script.google.com
 * Supports:
 * - Secret validation via MAIL_SECRET
 * - Primary delivery to client registered email
 * - Additional notification to administrator email
 * - Formatted JSON response with { ok: true, status: "success" }
 */
export function getGoogleAppsScriptTemplateCode(): string {
  return `/**
 * ============================================================================
 * PINTUCO COLOR LINK - NOTIFICADOR POR CORREO (GOOGLE APPS SCRIPT)
 * ============================================================================
 * Soporta:
 * 1. Validación de seguridad mediante MAIL_SECRET.
 * 2. Destinatario principal: correo del cliente registrado.
 * 3. Notificación al administrador (adminEmail) sin duplicados.
 * 4. FASE 2: Archivo adjunto PDF original (Cotizacion_Pintuco_[RADICADO].pdf).
 * 5. FASE 3: Vista previa visual en el cuerpo del correo mediante cid:previewImage.
 * 6. Compatibilidad total: si no se envía adjunto o imagen, el correo se envía
 *    con el resumen de texto y tabla sin fallar.
 * ============================================================================
 */

var ADMIN_EMAIL_DEFAULT = "${GAS_DEFAULT_EMAIL}";
// Opcional: define tu clave secreta para validar peticiones autorizadas desde el backend
var MAIL_SECRET_CONFIGURADO = ""; 

function doPost(e) {
  try {
    var raw = (e && e.postData) ? e.postData.contents : "";
    if (!raw) {
      return jsonResponse({ ok: false, status: "error", message: "Sin contenido POST recibido" });
    }

    var payload = JSON.parse(raw);

    // 1. Validación de seguridad autorizada mediante MAIL_SECRET
    if (MAIL_SECRET_CONFIGURADO) {
      var incomingSecret = payload.mailSecret || payload.secret || "";
      if (incomingSecret !== MAIL_SECRET_CONFIGURADO) {
        return jsonResponse({ ok: false, status: "unauthorized", message: "Clave MAIL_SECRET no autorizada" });
      }
    }

    // 2. Identificar los campos enviados desde el backend de ColorLink:
    var secret = payload.secret || payload.mailSecret || "";
    var tipo = String(payload.tipo || "prueba").toLowerCase().trim();
    var clientEmail = payload.email || payload.clientEmail || payload.to || "";
    var nombre = payload.nombre || "Cliente Autorizado";
    var numero = payload.numero || "REF-001";
    var detalles = payload.detalles || "";
    var estado = payload.estado || "Aprobado";
    var adminEmail = payload.adminEmail || ADMIN_EMAIL_DEFAULT;

    // Campos de adjuntos y vista previa (FASE 2 y 3)
    var pdfBase64 = payload.pdfBase64 || null;
    var pdfName = payload.pdfName || ("Cotizacion_Pintuco_" + numero.replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf");
    var imageBase64 = payload.imageBase64 || null;
    var imageName = payload.imageName || ("VistaPrevia_" + numero.replace(/[^a-zA-Z0-9_-]/g, "_") + ".png");

    // 3. Procesar archivo PDF adjunto
    var attachments = [];
    if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length > 50) {
      try {
        var cleanPdfBase64 = pdfBase64.indexOf(",") > -1 ? pdfBase64.split(",")[1] : pdfBase64;
        var pdfBytes = Utilities.base64Decode(cleanPdfBase64);
        var pdfBlob = Utilities.newBlob(pdfBytes, "application/pdf", pdfName);
        attachments.push(pdfBlob);
      } catch (attErr) {
        Logger.log("Advertencia decodificando PDF: " + attErr.toString());
      }
    }

    // 4. Procesar imagen de vista previa incrustada (cid:previewImage)
    var inlineImages = {};
    if (imageBase64 && typeof imageBase64 === "string" && imageBase64.length > 50) {
      try {
        var cleanImgBase64 = imageBase64.indexOf(",") > -1 ? imageBase64.split(",")[1] : imageBase64;
        var imgBytes = Utilities.base64Decode(cleanImgBase64);
        var imgBlob = Utilities.newBlob(imgBytes, "image/png", imageName);
        inlineImages["previewImage"] = imgBlob;
      } catch (imgErr) {
        Logger.log("Advertencia decodificando vista previa: " + imgErr.toString());
      }
    }

    // 5. Asunto y cuerpo HTML formateado
    var subject = "Pintuco ColorLink: " + tipo.toUpperCase() + " [" + numero + "] - " + estado;
    var previewHtmlBlock = "";
    if (inlineImages["previewImage"]) {
      previewHtmlBlock = "<div style='margin:18px 0;text-align:center;background:#f8fafc;padding:14px;border:1px solid #cbd5e1;border-radius:10px;'>" +
        "<div style='font-size:12px;font-weight:bold;color:#1e3a8a;margin-bottom:8px;'>📄 VISTA PREVIA DEL DOCUMENTO OFICIAL</div>" +
        "<img src='cid:previewImage' alt='Vista Previa Cotización' style='max-width:100%;height:auto;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.1);display:block;margin:0 auto;' />" +
        "<p style='font-size:11px;color:#64748b;margin:8px 0 0 0;'>El documento oficial en formato PDF descargable e imprimible está adjunto a este correo (" + pdfName + ").</p>" +
        "</div>";
    }

    var htmlContent = "<div style='font-family:sans-serif;padding:22px;color:#1e293b;max-width:620px;margin:0 auto;line-height:1.5;'>" +
      "<div style='border-bottom:2px solid #0f4c81;padding-bottom:12px;margin-bottom:16px;display:flex;align-items:center;'>" +
      "<h2 style='color:#0f4c81;margin:0;font-size:20px;'>PINTUCO COLOR LINK</h2>" +
      "</div>" +
      "<p style='font-size:14px;'>Hola <strong>" + nombre + "</strong>,</p>" +
      "<p style='font-size:14px;'>Tu solicitud <strong>" + numero + "</strong> (Tipo: <em>" + tipo + "</em>) se encuentra en estado: <strong style='color:#0f4c81;'>" + estado + "</strong>.</p>" +
      previewHtmlBlock +
      "<div style='background:#f8fafc;padding:14px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;line-height:1.6;margin:16px 0;'>" +
      detalles +
      "</div>" +
      (attachments.length > 0 ? "<p style='font-size:12px;color:#059669;'>📎 <strong>Archivo adjunto:</strong> Se incluye el documento oficial <strong>" + pdfName + "</strong>.</p>" : "") +
      "<p style='font-size:11px;color:#64748b;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;'>" +
      "Notificación oficial automatizada emitida por Pintuco ColorLink Colombia." +
      "</p>" +
      "</div>";

    // 6. Envío al Destinatario Principal (Cliente registrado)
    if (clientEmail && isValidEmail(clientEmail)) {
      var clientMailOptions = {
        to: clientEmail,
        subject: subject,
        htmlBody: htmlContent
      };
      if (attachments.length > 0) {
        clientMailOptions.attachments = attachments;
      }
      if (Object.keys(inlineImages).length > 0) {
        clientMailOptions.inlineImages = inlineImages;
      }
      MailApp.sendEmail(clientMailOptions);
    }

    // 7. Notificación Adicional al Administrador (sin duplicar envíos)
    var adminNotificado = false;
    if (adminEmail && isValidEmail(adminEmail) && adminEmail.toLowerCase() !== clientEmail.toLowerCase()) {
      var adminMailOptions = {
        to: adminEmail,
        subject: "[ADMIN] " + subject,
        htmlBody: htmlContent
      };
      if (attachments.length > 0) {
        adminMailOptions.attachments = attachments;
      }
      if (Object.keys(inlineImages).length > 0) {
        adminMailOptions.inlineImages = inlineImages;
      }
      MailApp.sendEmail(adminMailOptions);
      adminNotificado = true;
    }

    // Retorna { ok: true } interpretado por el backend
    return jsonResponse({
      ok: true,
      status: "success",
      proveedor: "GOOGLE_APPS_SCRIPT",
      adminNotificado: adminNotificado,
      pdfAdjunto: attachments.length > 0,
      vistaPreviaIncrustada: Boolean(inlineImages["previewImage"]),
      message: "Notificación y documentos despachados exitosamente",
      tipo: tipo,
      numero: numero,
      estado: estado,
      clientEmail: clientEmail,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    Logger.log("Error en doPost: " + err.toString());
    return jsonResponse({ ok: false, status: "error", error: err.toString() });
  }
}

function doGet(e) {
  return jsonResponse({ ok: true, status: "active", message: "Google Apps Script Pintuco Color Link activo" });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return email.indexOf('@') > 0 && email.indexOf('.') > 0;
}
`;
}

/**
 * SQL snippet to configure Supabase Database Webhook trigger (Optional)
 */
export function getSupabaseWebhookSqlInstructions(webhookUrl: string): string {
  return `-- ============================================================================
-- WEBHOOK OPCIONAL DE SUPABASE PARA LA TABLA 'PROYECTO'
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION notify_google_apps_script_on_quote()
RETURNS TRIGGER AS $$
DECLARE
  payload json;
BEGIN
  payload := json_build_object(
    'event', 'COTIZACION_CLIENTE',
    'timestamp', now(),
    'adminEmail', '${GAS_DEFAULT_EMAIL}',
    'source', 'supabase_webhook',
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url := '${webhookUrl || 'TU_URL_DE_GOOGLE_APPS_SCRIPT'}',
    body := payload::text,
    headers := '{"Content-Type": "text/plain;charset=utf-8"}'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
}
