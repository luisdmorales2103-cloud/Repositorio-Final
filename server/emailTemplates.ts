/**
 * Plantillas HTML profesionales, responsivas y con identidad visual Pintuco Color Link
 * para notificaciones automáticas por correo electrónico.
 */

const PINTUCO_COLORS = {
  primary: '#0F4C81',
  primaryDark: '#0A3258',
  secondary: '#F59E0B',
  success: '#059669',
  danger: '#DC2626',
  bgLight: '#F8FAFC',
  textDark: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
};

function formatMoney(amount: number): string {
  return `$ ${Number(amount || 0).toLocaleString('es-CO')} COP`;
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return new Date().toLocaleDateString('es-CO', { dateStyle: 'long' });
  try {
    return new Date(isoDate).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

function baseEmailWrapper(title: string, headerBadge: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    .wrapper { max-width: 640px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0F4C81 0%, #0A3258 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background: rgba(245, 158, 11, 0.25); border: 1px solid #F59E0B; color: #FDE68A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
    .body { padding: 32px 28px; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; }
    .btn { display: inline-block; background-color: #0F4C81; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; margin-top: 20px; }
    .box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px; }
    .box-amber { background-color: #fffbeb; border-left: 4px solid #F59E0B; }
    .box-blue { background-color: #eff6ff; border-left: 4px solid #0F4C81; }
    .box-green { background-color: #ecfdf5; border-left: 4px solid #059669; }
    .data-table { width: 100%; font-size: 13px; margin: 12px 0; }
    .data-table td { padding: 6px 0; vertical-align: top; }
    .data-label { width: 38%; color: #64748b; font-weight: 600; }
    .data-value { color: #0f172a; font-weight: 700; }
    .items-table { width: 100%; font-size: 12px; margin-top: 14px; }
    .items-table th { background: #0F4C81; color: #ffffff; padding: 10px 12px; text-align: left; font-weight: 700; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="badge">${headerBadge}</div>
      <h1>PINTUCO COLOR LINK</h1>
      <p>Catálogo y Cotizador Profesional de Pinturas y Construcción</p>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>Pintuco Color Link Colombia</strong> — Soluciones integrales para hogar, industria y construcción.</p>
      <p style="margin: 0;">Este es un mensaje generado automáticamente por el sistema de notificaciones. Por favor no respondas directamente a este correo.</p>
    </div>
  </div>
</body>
</html>`;
}

// 1. BIENVENIDA AL USUARIO
export function getWelcomeEmailHtml(user: {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  role?: string;
}): string {
  const content = `
    <h2 style="font-size: 20px; color: #0F4C81; margin-top: 0; margin-bottom: 8px;">¡Te damos la bienvenida, ${user.name}!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      Tu cuenta en <strong>Pintuco Color Link</strong> ha sido creada exitosamente. A partir de ahora podrás realizar cotizaciones técnicas precisas en pesos colombianos, calcular rendimientos por m², gestionar tus proyectos y acceder a nuestro catálogo completo de pinturas y materiales de construcción.
    </p>

    <div class="box box-blue">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #0F4C81;">Tus Datos de Registro</h3>
      <table class="data-table">
        <tr>
          <td class="data-label">Nombre o Razón Social:</td>
          <td class="data-value">${user.name}</td>
        </tr>
        <tr>
          <td class="data-label">Correo Electrónico:</td>
          <td class="data-value">${user.email}</td>
        </tr>
        <tr>
          <td class="data-label">Celular / WhatsApp:</td>
          <td class="data-value">${user.phone || 'No registrado'}</td>
        </tr>
        <tr>
          <td class="data-label">Ciudad:</td>
          <td class="data-value">${user.city || 'Bogotá D.C.'}</td>
        </tr>
        <tr>
          <td class="data-label">Tipo de Perfil:</td>
          <td class="data-value">${user.role || 'Particular / Contratista'}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #f1f5f9; padding: 14px 18px; border-radius: 8px; font-size: 12px; color: #475569; margin: 18px 0;">
      🔒 <strong>Seguridad garantizada:</strong> Tu contraseña está debidamente encriptada y protegida. Por directivas de seguridad, nunca se envía en el cuerpo de los correos electrónicos.
    </div>

    <h3 style="font-size: 15px; color: #0F4C81; margin: 24px 0 10px 0;">¿Qué puedes hacer en la plataforma?</h3>
    <ul style="font-size: 13px; color: #475569; line-height: 1.7; padding-left: 20px; margin: 0 0 20px 0;">
      <li><strong>Calculadora de Pintura:</strong> Calcula los galones exactos requeridos según los metros cuadrados (m²) de tu obra.</li>
      <li><strong>Cotizador Oficial:</strong> Genera propuestas comerciales con precios de lista y exportación instantánea en PDF.</li>
      <li><strong>Color Studio:</strong> Visualiza armonías cromáticas y paletas recomendadas para interiores y exteriores.</li>
      <li><strong>Compras y Despacho:</strong> Formaliza tus pedidos y realiza el seguimiento en tiempo real del estado de entrega.</li>
    </ul>

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://ais-dev-iqf6nclq5ea436iiyqkrdb-85129355227.us-west1.run.app" class="btn">Ingresar a Pintuco Color Link</a>
    </div>
  `;

  return baseEmailWrapper('Bienvenido a Pintuco Color Link', 'Cuenta Creada', content);
}

// 2. ALERTA AL ADMINISTRADOR: NUEVO REGISTRO
export function getNewUserAdminEmailHtml(user: {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  idNumber?: string;
  role?: string;
  createdAt?: string;
}): string {
  const content = `
    <h2 style="font-size: 19px; color: #0F4C81; margin-top: 0; margin-bottom: 6px;">🔔 Nuevo Usuario Registrado en la Plataforma</h2>
    <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
      Un nuevo cliente ha completado su registro en <strong>Pintuco Color Link</strong>. A continuación se detallan los datos básicos capturados (sin información confidencial):
    </p>

    <div class="box box-amber">
      <table class="data-table">
        <tr>
          <td class="data-label">Fecha y Hora:</td>
          <td class="data-value">${formatDate(user.createdAt)}</td>
        </tr>
        <tr>
          <td class="data-label">Nombre / Razón Social:</td>
          <td class="data-value">${user.name}</td>
        </tr>
        <tr>
          <td class="data-label">Correo Electrónico:</td>
          <td class="data-value"><a href="mailto:${user.email}" style="color: #0F4C81;">${user.email}</a></td>
        </tr>
        <tr>
          <td class="data-label">Teléfono / WhatsApp:</td>
          <td class="data-value">${user.phone || 'No especificado'}</td>
        </tr>
        <tr>
          <td class="data-label">Cédula / NIT:</td>
          <td class="data-value">${user.idNumber || 'No especificado'}</td>
        </tr>
        <tr>
          <td class="data-label">Ciudad:</td>
          <td class="data-value">${user.city || 'Bogotá D.C.'}</td>
        </tr>
        <tr>
          <td class="data-label">Tipo de Cliente:</td>
          <td class="data-value"><span style="background-color: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${user.role || 'Particular'}</span></td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="https://ais-dev-iqf6nclq5ea436iiyqkrdb-85129355227.us-west1.run.app" class="btn">Abrir Panel de Control</a>
    </div>
  `;

  return baseEmailWrapper('Alerta: Nuevo Registro', 'Panel Administrador', content);
}

// 3. CONFIRMACIÓN DE COTIZACIÓN AL CLIENTE
export function getQuoteCustomerEmailHtml(quote: any, options?: { hasPreviewImage?: boolean }): string {
  const items = quote.items || [];
  let itemsRows = '';

  items.forEach((it: any, index: number) => {
    const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    itemsRows += `
      <tr style="background-color: ${bg};">
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
          <strong>${it.productName}</strong>
          ${it.colorName ? `<div style="font-size: 11px; color: #64748b;">Color: ${it.colorName} ${it.surfaceTag ? `(${it.surfaceTag})` : ''}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${it.presentation || 'Estándar'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${it.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #0F4C81;">${formatMoney(it.subtotal)}</td>
      </tr>
    `;
  });

  const sanitizedNumber = (quote.quoteNumber || 'COT-2026').replace(/[^a-zA-Z0-9_-]/g, '_');
  const previewSection = options?.hasPreviewImage
    ? `
    <div style="margin: 22px 0 24px 0; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; text-align: center;">
      <div style="font-size: 13px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
        📄 Vista Previa Oficial — ${quote.quoteNumber || 'Cotización'}
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 0 0 12px 0;">
        El documento oficial completo con firma técnica y validez comercial se encuentra <strong>adjunto en este correo en formato PDF (Cotizacion_Pintuco_${sanitizedNumber}.pdf)</strong>.
      </p>
      <div style="background-color: #ffffff; padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block; width: 100%; box-sizing: border-box; max-width: 600px;">
        <img src="cid:previewImage" alt="Vista previa de cotización oficial ${quote.quoteNumber}" style="width: 100%; max-width: 580px; height: auto; display: block; margin: 0 auto; border-radius: 4px;" />
      </div>
    </div>
    `
    : `
    <div style="margin: 18px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #166534;">
      📎 <strong>Documento PDF adjunto:</strong> Se incluye el archivo oficial <strong>Cotizacion_Pintuco_${sanitizedNumber}.pdf</strong> con el desglose técnico y comercial completo.
    </div>
    `;

  const content = `
    <h2 style="font-size: 20px; color: #0F4C81; margin-top: 0; margin-bottom: 6px;">Hemos recibido tu solicitud de cotización</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
      Hola <strong>${quote.customer?.name || 'Apreciado Cliente'}</strong>, hemos radicado tu solicitud de cotización en nuestro sistema técnico. Nuestro equipo de asesores revisará los requerimientos para brindarte la mejor asesoría en pinturas y acabados.
    </p>

    <div class="box box-amber">
      <table class="data-table">
        <tr>
          <td class="data-label">Número de Radicado:</td>
          <td class="data-value" style="font-family: monospace; font-size: 15px; color: #0F4C81;">${quote.quoteNumber}</td>
        </tr>
        <tr>
          <td class="data-label">Fecha de Emisión:</td>
          <td class="data-value">${formatDate(quote.date)}</td>
        </tr>
        <tr>
          <td class="data-label">Estado Actual:</td>
          <td class="data-value"><span style="background-color: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${quote.status || 'En preparación'}</span></td>
        </tr>
        <tr>
          <td class="data-label">Vigencia Comercial:</td>
          <td class="data-value">${quote.validityDays || 15} días calendario</td>
        </tr>
      </table>
    </div>

    ${previewSection}

    <h3 style="font-size: 15px; color: #0F4C81; margin: 20px 0 8px 0;">Detalle de Pinturas y Materiales</h3>
    <table class="items-table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Producto / Acabado</th>
          <th>Presentación</th>
          <th style="text-align: center;">Cant.</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: right;">
      <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">Subtotal: <strong>${formatMoney(quote.subtotal)}</strong></div>
      ${quote.discountAmount ? `<div style="font-size: 13px; color: #059669; margin-bottom: 4px;">Descuento (${quote.discountPercent}%): <strong>-${formatMoney(quote.discountAmount)}</strong></div>` : ''}
      <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;">IVA (19%): <strong>${formatMoney(quote.ivaAmount)}</strong></div>
      <div style="font-size: 18px; color: #0F4C81; font-weight: 800;">Total Cotizado: ${formatMoney(quote.total)}</div>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://ais-dev-iqf6nclq5ea436iiyqkrdb-85129355227.us-west1.run.app" class="btn">Ver Cotización en Línea</a>
    </div>
  `;

  return baseEmailWrapper(`Cotización Radicada ${quote.quoteNumber}`, 'Cotización Recibida', content);
}

// 4. NOTIFICACIÓN DE COTIZACIÓN AL ADMINISTRADOR
export function getQuoteAdminEmailHtml(quote: any): string {
  const cliente = quote.customer || {};
  const items = quote.items || [];
  let itemsRows = '';

  items.forEach((it: any) => {
    itemsRows += `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;"><b>${it.productName}</b> (${it.presentation || '1 galón'})</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${it.quantity}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatMoney(it.subtotal)}</td>
      </tr>
    `;
  });

  const content = `
    <h2 style="font-size: 19px; color: #0F4C81; margin-top: 0;">📋 Nueva Cotización Radicada: ${quote.quoteNumber}</h2>
    <p style="font-size: 14px; color: #475569;">
      Se ha generado una nueva propuesta comercial en el sistema web.
    </p>

    <div class="box box-blue">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0F4C81;">Información del Solicitante</h3>
      <table class="data-table">
        <tr>
          <td class="data-label">Cliente / Razón Social:</td>
          <td class="data-value">${cliente.name || 'Cliente Particular'}</td>
        </tr>
        <tr>
          <td class="data-label">NIT o Cédula:</td>
          <td class="data-value">${cliente.idNumber || 'No especificado'}</td>
        </tr>
        <tr>
          <td class="data-label">Correo Electrónico:</td>
          <td class="data-value"><a href="mailto:${cliente.email}">${cliente.email}</a></td>
        </tr>
        <tr>
          <td class="data-label">Teléfono:</td>
          <td class="data-value">${cliente.phone || 'No especificado'}</td>
        </tr>
        <tr>
          <td class="data-label">Ciudad y Dirección:</td>
          <td class="data-value">${cliente.city || 'Bogotá D.C.'} ${cliente.address ? `(${cliente.address})` : ''}</td>
        </tr>
      </table>
    </div>

    <h3 style="font-size: 14px; color: #0F4C81; margin: 16px 0 6px 0;">Resumen de Materiales</h3>
    <table class="items-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align: center;">Cant.</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; text-align: right; margin-top: 14px; font-weight: 700; color: #0F4C81; font-size: 16px;">
      Valor Total: ${formatMoney(quote.total)}
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="https://ais-dev-iqf6nclq5ea436iiyqkrdb-85129355227.us-west1.run.app" class="btn">Gestionar en Panel</a>
    </div>
  `;

  return baseEmailWrapper(`Nueva Cotización: ${quote.quoteNumber}`, 'Alerta de Cotización', content);
}

// 5. CAMBIO DE ESTADO DE COTIZACIÓN (AL CLIENTE)
export function getQuoteStatusCustomerEmailHtml(
  quote: any,
  oldStatus: string,
  newStatus: string,
  customMessage?: string
): string {
  let badgeColor = '#dbeafe';
  let badgeTextColor = '#1e40af';
  let statusExplanation = 'Tu cotización ha sido actualizada por nuestro equipo técnico y comercial.';

  if (newStatus === 'Aprobada') {
    badgeColor = '#d1fae5';
    badgeTextColor = '#065f46';
    statusExplanation = '¡Excelente noticia! Tu propuesta técnica ha sido formalmente Aprobada. Ya puedes proceder a formalizar tu pedido y programar el despacho de materiales.';
  } else if (newStatus === 'Rechazada') {
    badgeColor = '#fee2e2';
    badgeTextColor = '#991b1b';
    statusExplanation = 'La cotización no fue aprobada bajo las condiciones actuales. Si deseas un ajuste de presupuesto, producto o volumen, contáctanos para renegociarla.';
  } else if (newStatus === 'Enviada') {
    badgeColor = '#e0e7ff';
    badgeTextColor = '#3730a3';
    statusExplanation = 'Tu cotización ha sido revisada por un asesor técnico especializado y se encuentra lista para tu revisión final.';
  }

  const content = `
    <h2 style="font-size: 20px; color: #0F4C81; margin-top: 0; margin-bottom: 6px;">Actualización de Estado de Cotización</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
      Hola <strong>${quote.customer?.name || 'Apreciado Cliente'}</strong>, te informamos que el estado de tu cotización número <strong style="font-family: monospace; color: #0F4C81;">${quote.quoteNumber}</strong> ha sido modificado.
    </p>

    <div class="box" style="background-color: #f8fafc; text-align: center; padding: 24px;">
      <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">NUEVO ESTADO OFICIAL:</div>
      <div style="display: inline-block; background-color: ${badgeColor}; color: ${badgeTextColor}; font-size: 18px; font-weight: 800; padding: 8px 24px; border-radius: 9999px; letter-spacing: 0.5px;">
        ${newStatus}
      </div>
      <p style="font-size: 13px; color: #475569; margin: 16px auto 0 auto; max-width: 480px; line-height: 1.5;">
        ${customMessage || statusExplanation}
      </p>
    </div>

    <div class="box box-blue">
      <table class="data-table">
        <tr>
          <td class="data-label">Radicado:</td>
          <td class="data-value" style="font-family: monospace;">${quote.quoteNumber}</td>
        </tr>
        <tr>
          <td class="data-label">Estado Anterior:</td>
          <td class="data-value" style="color: #64748b;">${oldStatus}</td>
        </tr>
        <tr>
          <td class="data-label">Total Cotizado:</td>
          <td class="data-value" style="color: #0F4C81;">${formatMoney(quote.total)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://ais-dev-iqf6nclq5ea436iiyqkrdb-85129355227.us-west1.run.app" class="btn">Abrir mi Cotización en el Portal</a>
    </div>
  `;

  return baseEmailWrapper(`Estado Actualizado: ${quote.quoteNumber} (${newStatus})`, 'Trazabilidad Comercial', content);
}

// 6. CONFIRMACIÓN DE PEDIDO / COMPRA (AL CLIENTE)
// Cumplimiento estricto: "No marcar una compra como pagada hasta recibir confirmación real del proveedor de pagos"
export function getOrderCustomerEmailHtml(order: any): string {
  const items = order.items || [];
  let itemsRows = '';

  items.forEach((it: any, index: number) => {
    const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    itemsRows += `
      <tr style="background-color: ${bg};">
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
          <b>${it.productName}</b>
          ${it.colorName ? `<div style="font-size: 11px; color: #64748b;">Color: ${it.colorName}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${it.presentation || 'Estándar'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700;">${it.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; color: #059669;">${formatMoney(it.subtotal)}</td>
      </tr>
    `;
  });

  const isConfirmed = order.status === 'Pago Confirmado';

  const content = `
    <h2 style="font-size: 20px; color: #0F4C81; margin-top: 0; margin-bottom: 6px;">¡Hemos recibido tu orden de compra!</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
      Hola <strong>${order.cliente_nombre || order.customer?.name || 'Apreciado Cliente'}</strong>, tu pedido ha sido registrado en el sistema. A continuación encuentras el resumen detallado de tu orden y las condiciones de despacho a obra.
    </p>

    <div class="box ${isConfirmed ? 'box-green' : 'box-amber'}">
      <table class="data-table">
        <tr>
          <td class="data-label">Número de Pedido:</td>
          <td class="data-value" style="font-family: monospace; font-size: 16px; color: #0F4C81;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td class="data-label">Cotización Asociada:</td>
          <td class="data-value" style="font-family: monospace;">${order.quoteNumber}</td>
        </tr>
        <tr>
          <td class="data-label">Estado de la Orden:</td>
          <td class="data-value">
            <span style="background-color: ${isConfirmed ? '#d1fae5' : '#fef3c7'}; color: ${isConfirmed ? '#065f46' : '#92400e'}; padding: 4px 10px; border-radius: 4px; font-weight: 700; font-size: 12px;">
              ${order.status || 'Pendiente de Confirmación de Pago'}
            </span>
          </td>
        </tr>
        <tr>
          <td class="data-label">Método de Pago:</td>
          <td class="data-value">${order.paymentMethod || 'Pasarela de Pagos'}</td>
        </tr>
        <tr>
          <td class="data-label">Referencia de Transacción:</td>
          <td class="data-value" style="font-family: monospace; font-size: 12px;">${order.paymentReference || 'N/A'}</td>
        </tr>
        <tr>
          <td class="data-label">Dirección de Despacho:</td>
          <td class="data-value">${order.deliveryAddress} (${order.deliveryCity})</td>
        </tr>
        <tr>
          <td class="data-label">Fecha Estimada de Entrega:</td>
          <td class="data-value">${formatDate(order.deliveryDate)}</td>
        </tr>
      </table>
    </div>

    ${!isConfirmed ? `
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #92400e; line-height: 1.5; margin: 16px 0;">
        ⚠️ <strong>Política de Verificación Bancaria:</strong> Conforme a las directivas de seguridad comercial, tu pedido permanecerá en <em>"Pendiente de Confirmación de Pago"</em> hasta que la pasarela de pagos o entidad bancaria valide de manera definitiva la transacción. Tan pronto como el pago sea acreditado, se liberará el despacho desde nuestra bodega.
      </div>
    ` : ''}

    <h3 style="font-size: 15px; color: #0F4C81; margin: 20px 0 8px 0;">Productos a Entregar</h3>
    <table class="items-table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Presentación</th>
          <th style="text-align: center;">Cant.</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: right;">
      <div style="font-size: 18px; color: #059669; font-weight: 800;">Total de la Compra: ${formatMoney(order.total)}</div>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://ais-dev-iqf6nclq5ea436iiyqkrdb-85129355227.us-west1.run.app" class="btn">Consultar Estado de Mi Pedido</a>
    </div>
  `;

  return baseEmailWrapper(`Confirmación de Pedido ${order.orderNumber}`, 'Orden de Compra', content);
}

// 7. NOTIFICACIÓN DE NUEVO PEDIDO AL ADMINISTRADOR
export function getOrderAdminEmailHtml(order: any): string {
  const content = `
    <h2 style="font-size: 19px; color: #059669; margin-top: 0;">🛍️ Nuevo Pedido Registrado: ${order.orderNumber}</h2>
    <p style="font-size: 14px; color: #475569;">
      Un cliente ha formalizado una orden de compra en la plataforma web.
    </p>

    <div class="box box-green">
      <table class="data-table">
        <tr>
          <td class="data-label">Número de Pedido:</td>
          <td class="data-value" style="font-family: monospace; color: #059669; font-size: 15px;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td class="data-label">Cotización Base:</td>
          <td class="data-value">${order.quoteNumber}</td>
        </tr>
        <tr>
          <td class="data-label">Cliente:</td>
          <td class="data-value">${order.cliente_nombre || order.customer?.name}</td>
        </tr>
        <tr>
          <td class="data-label">Correo:</td>
          <td class="data-value"><a href="mailto:${order.cliente_email || order.customer?.email}">${order.cliente_email || order.customer?.email}</a></td>
        </tr>
        <tr>
          <td class="data-label">Teléfono:</td>
          <td class="data-value">${order.customer?.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td class="data-label">Monto Total:</td>
          <td class="data-value" style="font-size: 16px; color: #059669;">${formatMoney(order.total)}</td>
        </tr>
        <tr>
          <td class="data-label">Estado Inicial:</td>
          <td class="data-value"><b style="color: #d97706;">${order.status || 'Pendiente de Confirmación de Pago'}</b></td>
        </tr>
        <tr>
          <td class="data-label">Método y Referencia:</td>
          <td class="data-value">${order.paymentMethod} (${order.paymentReference})</td>
        </tr>
        <tr>
          <td class="data-label">Dirección Entrega:</td>
          <td class="data-value">${order.deliveryAddress}, ${order.deliveryCity}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; font-size: 12px; color: #92400e;">
      ⚠️ <strong>Protocolo de Despacho:</strong> Verificar la acreditación real en la pasarela o extracto bancario antes de actualizar el estado a "Pago Confirmado" o iniciar el alistamiento en bodega.
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="https://ais-dev-iqf6nclq5ea436iiyqkrdb-85129355227.us-west1.run.app" class="btn">Gestionar Despacho</a>
    </div>
  `;

  return baseEmailWrapper(`Nuevo Pedido: ${order.orderNumber}`, 'Alerta de Compra', content);
}

// 8. CAMBIO DE ESTADO DE PEDIDO / DESPACHO (AL CLIENTE)
export function getOrderStatusCustomerEmailHtml(order: any, newStatus: string): string {
  let statusBadgeBg = '#eff6ff';
  let statusBadgeText = '#1d4ed8';
  let message = 'El estado logístico de tu pedido ha cambiado.';

  if (newStatus === 'Pago Confirmado') {
    statusBadgeBg = '#ecfdf5';
    statusBadgeText = '#065f46';
    message = '¡Tu pago ha sido validado exitosamente! Hemos acreditado tu transacción y tu orden ha pasado a fila de alistamiento en bodega.';
  } else if (newStatus === 'En Preparación / Bodega') {
    statusBadgeBg = '#fef3c7';
    statusBadgeText = '#92400e';
    message = 'Nuestro equipo técnico se encuentra mezclando y dosificando tus pinturas, preparando las cubetas y empacando tus materiales de construcción.';
  } else if (newStatus === 'En Ruta de Entrega') {
    statusBadgeBg = '#f3e8ff';
    statusBadgeText = '#6b21a8';
    message = '¡Tu pedido va en camino! El vehículo de reparto ha salido de nuestro centro de distribución hacia tu obra o domicilio.';
  } else if (newStatus === 'Entregado') {
    statusBadgeBg = '#dcfce7';
    statusBadgeText = '#15803d';
    message = 'Tu pedido ha sido entregado en la dirección indicada. ¡Agradecemos tu confianza en las soluciones de pintura Pintuco!';
  } else if (newStatus.includes('Rechazado') || newStatus.includes('Cancelado')) {
    statusBadgeBg = '#fee2e2';
    statusBadgeText = '#991b1b';
    message = 'Tu pedido no pudo ser procesado o fue cancelado. Por favor ponte en contacto con nuestro canal de atención.';
  }

  const content = `
    <h2 style="font-size: 20px; color: #0F4C81; margin-top: 0; margin-bottom: 6px;">Trazabilidad de tu Pedido: ${order.orderNumber}</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
      Hola <strong>${order.cliente_nombre || order.customer?.name || 'Apreciado Cliente'}</strong>, te notificamos una actualización en la etapa logística de tu orden de compra.
    </p>

    <div class="box" style="background-color: #f8fafc; text-align: center; padding: 24px;">
      <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">ESTADO DE TU PEDIDO:</div>
      <div style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeText}; font-size: 18px; font-weight: 800; padding: 8px 24px; border-radius: 9999px;">
        ${newStatus}
      </div>
      <p style="font-size: 13px; color: #475569; margin: 16px auto 0 auto; max-width: 480px; line-height: 1.5;">
        ${message}
      </p>
    </div>

    <div class="box box-blue">
      <table class="data-table">
        <tr>
          <td class="data-label">Número de Pedido:</td>
          <td class="data-value" style="font-family: monospace;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td class="data-label">Dirección de Entrega:</td>
          <td class="data-value">${order.deliveryAddress} (${order.deliveryCity})</td>
        </tr>
        <tr>
          <td class="data-label">Total Facturado:</td>
          <td class="data-value">${formatMoney(order.total)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="https://ais-dev-iqf6nclq5ea436iiyqkrdb-85129355227.us-west1.run.app" class="btn">Ver Seguimiento en Vivo</a>
    </div>
  `;

  return baseEmailWrapper(`Actualización de Pedido: ${order.orderNumber} (${newStatus})`, 'Trazabilidad de Despacho', content);
}

// 9. CORREO DE PRUEBA DE CONECTIVIDAD
export function getTestEmailHtml(targetEmail: string, providerInfo: string): string {
  const content = `
    <h2 style="font-size: 20px; color: #059669; margin-top: 0; margin-bottom: 6px;">✅ Prueba de Notificaciones Exitosa</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6;">
      Este es un correo de prueba generado desde el servidor backend de <strong>Pintuco Color Link</strong> para validar la integración de despacho de correos electrónicos.
    </p>

    <div class="box box-green">
      <table class="data-table">
        <tr>
          <td class="data-label">Destinatario:</td>
          <td class="data-value">${targetEmail}</td>
        </tr>
        <tr>
          <td class="data-label">Fecha y Hora:</td>
          <td class="data-value">${formatDate(new Date().toISOString())}</td>
        </tr>
        <tr>
          <td class="data-label">Proveedor / Mecanismo:</td>
          <td class="data-value">${providerInfo}</td>
        </tr>
        <tr>
          <td class="data-label">Estado de Conexión:</td>
          <td class="data-value" style="color: #059669;">Operacional y Conectado</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
      A partir de este momento, todos los eventos reales de registro de usuarios, solicitudes de cotización, confirmación de compras y actualizaciones de estado serán despachados automáticamente a sus destinatarios.
    </p>
  `;

  return baseEmailWrapper('Prueba de Conexión Exitosa', 'Diagnóstico de Notificaciones', content);
}
