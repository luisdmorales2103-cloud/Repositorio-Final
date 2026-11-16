import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  dispatchWelcomeNotifications,
  dispatchQuoteNotifications,
  dispatchQuoteStatusNotification,
  dispatchOrderNotifications,
  dispatchOrderStatusNotification,
  dispatchTestEmail,
  getLogs,
  getProviderConfigStatus,
  getAdminEmail,
  updateRuntimeConfig,
  isValidEmail,
} from './server/emailService.js';
import dwRouter from './server/oracle/dwRouter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/**
 * Resolución inteligente y dual de puertos:
 * 1. Argumento de línea de comandos explícito (--port 3000).
 * 2. Arquitectura Nginx Reverse Proxy (AI Studio Preview & Cloud Run con start.sh):
 *    Nginx escucha en el puerto público NGINX_PORT (8080) y redirige las peticiones
 *    hacia DEFAULT_APP_PORT (3000). Express debe escuchar en el puerto 3000 para no colisionar con Nginx.
 * 3. Cloud Run Standalone Directo (sin proxy Nginx):
 *    Express recibe el tráfico directamente en el puerto inyectado por Cloud Run (process.env.PORT).
 */
function resolveServerPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }

  const hasNginxProxy = Boolean(process.env.NGINX_PORT || process.env.DEFAULT_APP_PORT);
  if (hasNginxProxy) {
    const appPort = parseInt(process.env.DEFAULT_APP_PORT || '3000', 10);
    return !isNaN(appPort) && appPort > 0 ? appPort : 3000;
  }

  if (process.env.PORT) {
    const portVal = parseInt(process.env.PORT, 10);
    if (!isNaN(portVal) && portVal > 0) return portVal;
  }

  return 3000;
}

const PORT = resolveServerPort();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------
// CONTROL DE ACCESO, VALIDACIÓN Y LÍMITE DE SOLICITUDES (RATE LIMITING)
// Requisito 11: Proteger los endpoints con autenticación, permisos y límites
// -------------------------------------------------------------
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests: number = 40, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// Middleware de límite de peticiones para todas las rutas de notificaciones
app.use('/api/notifications', (req: Request, res: Response, next) => {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString();
  if (!checkRateLimit(clientIp, 40, 60000)) {
    return res.status(429).json({
      success: false,
      ok: false,
      error: 'Límite de solicitudes de correo excedido. Por favor espera un momento antes de reintentar.',
    });
  }
  next();
});

// Middleware de protección para rutas exclusivas de administración
function requireAdminRole(req: Request, res: Response, next: () => void) {
  const role = req.headers['x-user-role'] || req.body?.userRole;
  const adminEmail = getAdminEmail().toLowerCase();
  const userEmail = (req.headers['x-user-email'] || req.body?.userEmail || '').toString().toLowerCase().trim();
  
  const isAdmin =
    role === 'admin' ||
    (Boolean(userEmail) && userEmail === adminEmail) ||
    req.ip === '127.0.0.1' ||
    req.ip === '::1' ||
    process.env.NODE_ENV !== 'production';

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      ok: false,
      error: 'Acceso restringido: se requieren permisos de administrador para esta operación',
    });
  }
  next();
}

/**
 * 1. REGISTRO DE USUARIOS
 * Enviar bienvenida al cliente y notificación al administrador sin contraseñas
 */
app.post('/api/notifications/welcome', async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    if (!user || !user.email || !user.name) {
      return res.status(400).json({ success: false, ok: false, error: 'Datos de usuario insuficientes (se requiere name y email)' });
    }

    if (!isValidEmail(user.email)) {
      return res.status(400).json({ success: false, ok: false, error: `Formato de correo inválido: ${user.email}` });
    }

    // Sanitize user: ensure passwords or sensitive fields are stripped
    const safeUser = {
      name: String(user.name).trim(),
      email: String(user.email).trim().toLowerCase(),
      phone: user.phone ? String(user.phone).trim() : undefined,
      city: user.city ? String(user.city).trim() : 'Bogotá D.C.',
      idNumber: user.idNumber ? String(user.idNumber).trim() : undefined,
      role: user.role ? String(user.role).trim() : 'Particular',
      createdAt: user.createdAt || new Date().toISOString(),
    };

    const result = await dispatchWelcomeNotifications(safeUser);
    res.json({
      success: result.success,
      ok: result.ok,
      message: result.success
        ? 'Correo de bienvenida enviado exitosamente al cliente (y copia al administrador)'
        : result.error || 'Fallo en entrega vía Google Apps Script',
      result,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/welcome:', err);
    res.status(500).json({ success: false, ok: false, error: err.message });
  }
});

/**
 * 2. SOLICITUDES DE COTIZACIÓN
 * Notificar al cliente y al administrador
 */
app.post('/api/notifications/quote', async (req: Request, res: Response) => {
  try {
    const { quote, pdfBase64, pdfName, imageBase64, imageName } = req.body;
    if (!quote || !quote.quoteNumber) {
      return res.status(400).json({ success: false, ok: false, error: 'Datos de cotización inválidos' });
    }

    const clientEmail = quote.customer?.email || quote.cliente_email;
    if (!clientEmail || !isValidEmail(clientEmail)) {
      return res.status(400).json({ success: false, ok: false, error: `Correo del cliente inválido o ausente: ${clientEmail}` });
    }

    const result = await dispatchQuoteNotifications(quote, {
      pdfBase64,
      pdfName,
      imageBase64,
      imageName,
    });
    const gasData = result.clientResult?.responseData;
    res.json({
      success: result.success,
      ok: result.ok,
      pdfAdjunto: Boolean(gasData?.pdfAdjunto),
      vistaPrevia: Boolean(gasData?.vistaPrevia || gasData?.vistaPreviaIncrustada),
      message: result.success
        ? 'Confirmación de cotización despachada exitosamente al cliente'
        : result.error || 'Fallo en entrega de cotización vía Google Apps Script',
      result,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/quote:', err);
    res.status(500).json({ success: false, ok: false, error: err.message });
  }
});

/**
 * CAMBIO DE ESTADO DE COTIZACIÓN
 * Notificar al cliente cuando el admin aprueba, rechaza o actualiza la cotización
 */
app.post('/api/notifications/quote-status', async (req: Request, res: Response) => {
  try {
    const { quote, oldStatus, newStatus, message } = req.body;
    if (!quote || !newStatus) {
      return res.status(400).json({ success: false, ok: false, error: 'Datos de cotización o nuevo estado faltantes' });
    }

    const clientEmail = quote.customer?.email || quote.cliente_email;
    if (!clientEmail || !isValidEmail(clientEmail)) {
      return res.status(400).json({ success: false, ok: false, error: `Correo del cliente inválido: ${clientEmail}` });
    }

    const result = await dispatchQuoteStatusNotification(
      quote,
      oldStatus || 'En preparación',
      newStatus,
      message
    );

    res.json({
      success: result.success,
      ok: result.ok,
      message: result.success
        ? `Cliente notificado sobre cambio de estado a [${newStatus}]`
        : result.error || 'Error notificando cambio de estado',
      result,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/quote-status:', err);
    res.status(500).json({ success: false, ok: false, error: err.message });
  }
});

/**
 * 3. COMPRAS DE CLIENTES (PEDIDOS)
 * Notificar al cliente y al admin.
 * La orden se procesa con estado "Pendiente de Confirmación de Pago"
 */
app.post('/api/notifications/order', async (req: Request, res: Response) => {
  try {
    const { order } = req.body;
    if (!order || !order.orderNumber) {
      return res.status(400).json({ success: false, ok: false, error: 'Datos de pedido inválidos' });
    }

    const clientEmail = order.cliente_email || order.customer?.email;
    if (!clientEmail || !isValidEmail(clientEmail)) {
      return res.status(400).json({ success: false, ok: false, error: `Correo del cliente inválido: ${clientEmail}` });
    }

    const result = await dispatchOrderNotifications(order);
    res.json({
      success: result.success,
      ok: result.ok,
      message: result.success
        ? 'Notificación de compra y pedido despachada exitosamente al cliente'
        : result.error || 'Error despachando pedido vía Google Apps Script',
      result,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/order:', err);
    res.status(500).json({ success: false, ok: false, error: err.message });
  }
});

/**
 * CAMBIO DE ESTADO DE PEDIDO / DESPACHO
 * Notificar al cliente con el nuevo estado ("Pago Confirmado", "En Preparación", "En Ruta", "Entregado")
 */
app.post('/api/notifications/order-status', async (req: Request, res: Response) => {
  try {
    const { order, newStatus } = req.body;
    if (!order || !newStatus) {
      return res.status(400).json({ success: false, ok: false, error: 'Faltan datos de pedido o nuevo estado' });
    }

    const clientEmail = order.cliente_email || order.customer?.email;
    if (!clientEmail || !isValidEmail(clientEmail)) {
      return res.status(400).json({ success: false, ok: false, error: `Correo del cliente inválido: ${clientEmail}` });
    }

    const result = await dispatchOrderStatusNotification(order, newStatus);
    res.json({
      success: result.success,
      ok: result.ok,
      message: result.success
        ? `Cliente notificado sobre el estado logístico [${newStatus}]`
        : result.error || 'Error notificando estado de pedido',
      result,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/order-status:', err);
    res.status(500).json({ success: false, ok: false, error: err.message });
  }
});

/**
 * 4. PRUEBA DE CONECTIVIDAD EN VIVO (A CUALQUIER CORREO AUTORIZADO)
 */
app.post('/api/notifications/test', async (req: Request, res: Response) => {
  try {
    const { targetEmail, nombre, numero, detalles, estado, tipo } = req.body;
    const recipient = targetEmail?.trim() || getAdminEmail();
    if (!isValidEmail(recipient)) {
      return res.status(400).json({ success: false, ok: false, error: `Correo de prueba inválido: "${recipient}"` });
    }

    const result = await dispatchTestEmail(recipient, { nombre, numero, detalles, estado, tipo });

    res.json({
      success: result.success,
      ok: result.ok,
      message: result.success
        ? `Correo de prueba despachado exitosamente a "${recipient}"`
        : result.error || 'Fallo al despachar correo de prueba',
      result,
    });
  } catch (err: any) {
    console.error('Error en /api/notifications/test:', err);
    res.status(500).json({ success: false, ok: false, error: err.message });
  }
});

/**
 * ESTADO DEL PROVEEDOR Y DIAGNÓSTICO
 * Nunca expone MAIL_SECRET al cliente/navegador
 */
app.get('/api/notifications/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getProviderConfigStatus(),
  });
});

/**
 * CONFIGURACIÓN SEGURA EN TIEMPO DE EJECUCIÓN (ADMINISTRADOR)
 * Permite guardar o actualizar la URL de Google Apps Script y MAIL_SECRET
 * en las variables privadas del servidor sin exponer secretos en respuestas.
 */
app.post('/api/notifications/config', requireAdminRole, (req: Request, res: Response) => {
  try {
    const { gasUrl, mailSecret, adminEmail } = req.body;

    updateRuntimeConfig({
      gasUrl: gasUrl !== undefined ? String(gasUrl) : undefined,
      mailSecret: mailSecret !== undefined ? String(mailSecret) : undefined,
      adminEmail: adminEmail !== undefined ? String(adminEmail) : undefined,
    });

    res.json({
      success: true,
      message: 'Configuración actualizada en el servidor',
      data: getProviderConfigStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * REGISTRO HISTÓRICO DE AUDITORÍA (LOGS DE ENVÍOS - PROTEGIDO)
 */
app.get('/api/notifications/logs', requireAdminRole, (_req: Request, res: Response) => {
  res.json({
    success: true,
    logs: getLogs(),
  });
});

// -------------------------------------------------------------
// RUTAS ORACLE DATA WAREHOUSE & BUSINESS INTELLIGENCE
// -------------------------------------------------------------
app.use('/api/dw', dwRouter);

// -------------------------------------------------------------
// VITE DEV SERVER O STATIC ASSETS
// -------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pintuco Server] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Error iniciando el servidor:', err);
  process.exit(1);
});
