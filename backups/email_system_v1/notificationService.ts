import { Quote, OrderConfirmation, UserProfile, EmailNotificationLog, EmailProviderStatus } from '../types';

export const DEFAULT_ADMIN_EMAIL = 'salgadoarevaloleidy@gmail.com';
const ADMIN_EMAIL_STORAGE_KEY = 'colorpro_admin_email_override';

export function getClientConfiguredAdminEmail(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);
      if (stored && stored.trim().length > 0) {
        return stored.trim();
      }
    }
  } catch {}
  return DEFAULT_ADMIN_EMAIL;
}

export function setClientConfiguredAdminEmail(email: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (email.trim()) {
        localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, email.trim());
      } else {
        localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
      }
    }
  } catch {}
}

/**
 * 1. REGISTRO DE USUARIOS:
 * Dispara el correo de bienvenida al cliente y la notificación al administrador
 */
export async function sendWelcomeNotificationApi(user: {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  idNumber?: string;
  role?: string;
  createdAt?: string;
}): Promise<{ success: boolean; message: string; results?: any }> {
  try {
    const res = await fetch('/api/notifications/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || (res.ok ? 'Notificaciones de bienvenida despachadas' : 'Error en servidor'),
      results: data.results,
    };
  } catch (err: any) {
    console.warn('[NotificationService] Error enviando bienvenida:', err);
    return {
      success: false,
      message: err.message || 'Error de conexión con el servicio de correo',
    };
  }
}

/**
 * 2. SOLICITUDES DE COTIZACIÓN:
 * Dispara confirmación al cliente y notificación detallada al administrador
 */
export async function sendQuoteNotificationApi(
  quote: Quote
): Promise<{ success: boolean; message: string; results?: any }> {
  try {
    const res = await fetch('/api/notifications/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || 'Notificaciones de cotización despachadas',
      results: data.results,
    };
  } catch (err: any) {
    console.warn('[NotificationService] Error enviando cotización:', err);
    return {
      success: false,
      message: err.message || 'Error de conexión con el servicio de correo',
    };
  }
}

/**
 * ACTUALIZACIÓN DE ESTADO DE COTIZACIÓN (ADMIN -> CLIENTE):
 * Notifica al cliente cuando su radicado cambia de estado
 */
export async function sendQuoteStatusNotificationApi(
  quote: Quote,
  oldStatus: string,
  newStatus: string,
  message?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/notifications/quote-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote, oldStatus, newStatus, message }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || `Notificación de cambio de estado enviada al cliente (${newStatus})`,
    };
  } catch (err: any) {
    console.warn('[NotificationService] Error enviando actualización de estado:', err);
    return {
      success: false,
      message: err.message || 'Error de conexión con el servicio de correo',
    };
  }
}

/**
 * 3. COMPRAS DE CLIENTES (PEDIDOS):
 * Notifica confirmación de compra al cliente y alerta al administrador
 * Con estado inicial "Pendiente de Confirmación de Pago"
 */
export async function sendOrderNotificationApi(
  order: OrderConfirmation
): Promise<{ success: boolean; message: string; results?: any }> {
  try {
    const res = await fetch('/api/notifications/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || 'Notificaciones de pedido despachadas',
      results: data.results,
    };
  } catch (err: any) {
    console.warn('[NotificationService] Error enviando orden:', err);
    return {
      success: false,
      message: err.message || 'Error de conexión con el servicio de correo',
    };
  }
}

/**
 * ACTUALIZACIÓN DE ESTADO DE PEDIDO / LOGÍSTICA:
 * Notifica al cliente cuando el administrador actualiza la etapa logística
 */
export async function sendOrderStatusNotificationApi(
  order: OrderConfirmation,
  newStatus: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/notifications/order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, newStatus }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || `Cliente notificado sobre el estado logístico (${newStatus})`,
    };
  } catch (err: any) {
    console.warn('[NotificationService] Error enviando estado de orden:', err);
    return {
      success: false,
      message: err.message || 'Error de conexión con el servicio de correo',
    };
  }
}

/**
 * 4. PRUEBA DE CONECTIVIDAD EN VIVO:
 */
export async function sendTestNotificationApi(
  targetEmail?: string,
  customData?: { nombre?: string; numero?: string; detalles?: string; estado?: string; tipo?: string }
): Promise<{ success: boolean; message: string; result?: any }> {
  try {
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
      },
      body: JSON.stringify({
        targetEmail: targetEmail || getClientConfiguredAdminEmail(),
        tipo: 'prueba',
        ...customData,
      }),
    });

    const data = await res.json();
    return {
      success: data.success ?? res.ok,
      message: data.message || 'Correo de prueba enviado exitosamente',
      result: data.result,
    };
  } catch (err: any) {
    console.warn('[NotificationService] Error en prueba:', err);
    return {
      success: false,
      message: err.message || 'Error de conexión con el servicio de correo',
    };
  }
}

/**
 * CONSULTAR LOGS HISTÓRICOS DE NOTIFICACIONES (AUDITORÍA)
 */
export async function fetchNotificationLogsApi(): Promise<EmailNotificationLog[]> {
  try {
    const res = await fetch('/api/notifications/logs', {
      headers: { 'x-user-role': 'admin' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.warn('[NotificationService] Error consultando logs:', err);
    return [];
  }
}

/**
 * CONSULTAR ESTADO Y PROVEEDOR ACTIVO
 */
export async function fetchProviderStatusApi(): Promise<EmailProviderStatus | null> {
  try {
    const res = await fetch('/api/notifications/status');
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (err) {
    console.warn('[NotificationService] Error consultando estado del proveedor:', err);
    return null;
  }
}

/**
 * ACTUALIZAR CONFIGURACIÓN DEL SERVIDOR EN TIEMPO DE EJECUCIÓN
 */
export async function updateServerConfigApi(config: {
  gasUrl?: string;
  mailSecret?: string;
  adminEmail?: string;
}): Promise<{ success: boolean; message: string; data?: EmailProviderStatus }> {
  try {
    const res = await fetch('/api/notifications/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
      },
      body: JSON.stringify(config),
    });
    const json = await res.json();
    return {
      success: json.success ?? res.ok,
      message: json.message || 'Configuración actualizada',
      data: json.data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Error al actualizar configuración en el servidor',
    };
  }
}
