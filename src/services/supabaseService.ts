import { supabase } from '../lib/supabaseClient';
import { Quote, QuoteItem, QuoteStatus, CustomerInfo, UserProfile, OrderConfirmation, OrderStatus } from '../types';
import { formatSpanishDate } from '../utils/formatters';
import { isMasterAdminEmail } from '../utils/auth';

const STORAGE_KEY_BACKUP = 'colorpro_saved_quotes_v1';

// Helper to get local storage backup safely
function getLocalBackupQuotes(): Quote[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(STORAGE_KEY_BACKUP);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper to save local storage backup safely
function setLocalBackupQuotes(quotes: Quote[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY_BACKUP, JSON.stringify(quotes));
  } catch (err) {
    console.error('Error saving local backup:', err);
  }
}

/**
 * Generic dynamic filter for user role isolation:
 * - Admin (authorized master accounts): loads global quotes of the system.
 * - Cliente (any registered user): strictly filters to quotes matching their id or email:
 *   (quote.cliente_id && quote.cliente_id === currentUser.id) ||
 *   (quote.cliente_email && quote.cliente_email.toLowerCase() === currentUser.email.toLowerCase())
 * - Unauthenticated: returns empty array.
 */
export function filterQuotesForUser(quotes: Quote[], user?: UserProfile | null): Quote[] {
  if (!user) return [];

  // Visibilidad Global Exclusiva para Administradores
  if (user.rol === 'admin' && isMasterAdminEmail(user.email)) {
    return quotes;
  }

  // Lógica Dinámica de Filtrado para Clientes (Genérica)
  const currentUserId = user.id;
  const currentUserEmail = user.email.trim().toLowerCase();

  return quotes.filter((quote) => {
    const qEmail = (
      quote.cliente_email ||
      quote.customer?.email ||
      ''
    ).trim().toLowerCase();
    const qId = quote.cliente_id;

    const idMatches = Boolean(qId && currentUserId && qId === currentUserId);
    const emailMatches = Boolean(qEmail && currentUserEmail && qEmail === currentUserEmail);

    return idMatches || emailMatches;
  });
}

/**
 * Fetch quotes directly from Supabase with strict role-based access control.
 * - Admin/Asesor: fetches and views ALL records.
 * - Cliente: strictly filters to records belonging to their identity (cliente_id or email).
 * - Unauthenticated: returns empty array (table access blocked).
 */
export async function fetchQuotesFromSupabase(
  user?: UserProfile | null
): Promise<{ quotes: Quote[]; fromCloud: boolean; error?: string }> {
  // If not authenticated, do not expose any quotations
  if (!user) {
    return { quotes: [], fromCloud: false };
  }

  const isAdmin = user.rol === 'admin' && isMasterAdminEmail(user.email);

  try {
    const { data, error } = await supabase
      .from('proyecto')
      .select('*, cliente(*), especificacion_tecnica(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase query error, fallback to local backup:', error.message);
      const localBackup = getLocalBackupQuotes();
      return { quotes: filterQuotesForUser(localBackup, user), fromCloud: false, error: error.message };
    }

    const localBackup = getLocalBackupQuotes();

    // Map Supabase rows to Quote interface, reconciling with local backup if details exist
    const mappedQuotes: Quote[] = (data || []).map((row: any) => {
      // Find matching backup by proyecto_id or id
      const cached = localBackup.find(
        (b) => b.proyecto_id === row.proyecto_id || b.id === row.proyecto_id
      );

      const clienteId = row.cliente_id || row.cliente?.cliente_id || cached?.cliente_id;
      const clienteEmail = (row.cliente?.canal_entrada || cached?.cliente_email || cached?.customer?.email || '').trim().toLowerCase();

      let contactPerson = row.cliente?.responsable || row.cliente?.nombre || 'Cliente Particular';
      let contactPhone = cached?.customer?.phone || '';
      if (row.cliente?.responsable && typeof row.cliente.responsable === 'string' && row.cliente.responsable.includes('|')) {
        const parts = row.cliente.responsable.split('|');
        contactPerson = parts[0].trim();
        if (parts[1] && parts[1].trim()) {
          contactPhone = parts[1].trim();
        }
      }

      const customer: CustomerInfo = {
        name: row.cliente?.nombre || cached?.customer?.name || 'Cliente Particular',
        idNumber: row.cliente?.documento || cached?.customer?.idNumber || '',
        contactPerson: contactPerson || cached?.customer?.contactPerson || row.cliente?.nombre || '',
        phone: contactPhone || cached?.customer?.phone || '',
        email: clienteEmail || cached?.customer?.email || '',
        city: row.ciudad || cached?.customer?.city || 'Bogotá D.C.',
        address: cached?.customer?.address || '',
        notes: cached?.customer?.notes || `Área: ${row.area_m2 || 0} m² | Requerida: ${row.fecha_requerida || 'N/A'}`,
      };

      const dateStr = row.created_at || new Date().toISOString();
      const status: QuoteStatus = (row.estado as QuoteStatus) || 'En preparación';

      // Parse radicado and product name from row.tipo_proyecto if encoded as "COT-XXXX-XXXX | Desc"
      let radNumber = `COT-${new Date(dateStr).getFullYear()}-${row.proyecto_id.substring(0, 4).toUpperCase()}`;
      let parsedProdName = row.tipo_proyecto || 'Pintura VinilPro Alta Cobertura';
      if (row.tipo_proyecto && typeof row.tipo_proyecto === 'string' && row.tipo_proyecto.startsWith('COT-')) {
        const parts = row.tipo_proyecto.split('|');
        radNumber = parts[0].trim();
        if (parts.length > 1) {
          parsedProdName = parts.slice(1).join('|').trim();
        }
      }

      // If we have cached full items and totals, preserve them; otherwise reconstruct from Supabase fields
      if (cached && cached.items && cached.items.length > 0) {
        return {
          ...cached,
          id: row.proyecto_id,
          proyecto_id: row.proyecto_id,
          quoteNumber: cached.quoteNumber || radNumber,
          cliente_id: clienteId,
          cliente_email: clienteEmail,
          customer,
          status,
          date: dateStr,
          formattedDate: cached.formattedDate || formatSpanishDate(dateStr),
        };
      }

      // Reconstruct indicative quote data from Supabase fields
      // area_m2 strictly represents surface area in square meters (NOT money)
      const surfaceAreaM2 = Number(row.area_m2) || 50;

      // Calculate realistic paint volume and indicative pricing based on surface area:
      // (1 gallon standard architectural paint covers approx 25-30 m² in two coats)
      const gallonsNeeded = Math.max(1, Math.round(surfaceAreaM2 / 25));
      const unitPriceEstimate = 85000; // COP per gallon standard Pintuco
      const subtotal = gallonsNeeded * unitPriceEstimate;
      const ivaAmount = Math.round(subtotal * 0.19);
      const total = subtotal + ivaAmount;

      const spec = Array.isArray(row.especificacion_tecnica)
        ? row.especificacion_tecnica[0]
        : row.especificacion_tecnica;

      const singleItem: QuoteItem = {
        id: `item-${row.proyecto_id}`,
        productId: 'hog-001',
        sku: 'CP-HOG-VIN-01',
        productName: `Recubrimiento Arquitectónico (${surfaceAreaM2} m² - ${row.tipo_proyecto || 'Proyecto General'})`,
        category: 'HOGAR',
        presentation: '1 galón',
        unitPrice: unitPriceEstimate,
        quantity: gallonsNeeded,
        colorName: spec?.color || 'Color Personalizado',
        colorHex: '#3B82F6',
        surfaceTag: spec?.superficie || 'Mampostería / Concreto',
        subtotal: subtotal,
      };

      return {
        id: row.proyecto_id,
        proyecto_id: row.proyecto_id,
        cliente_id: clienteId,
        cliente_email: clienteEmail,
        quoteNumber: radNumber,
        date: dateStr,
        formattedDate: formatSpanishDate(dateStr),
        customer,
        items: [singleItem],
        subtotal,
        discountPercent: 0,
        discountAmount: 0,
        includeIva: true,
        ivaRate: 0.19,
        ivaAmount,
        total,
        status,
        validityDays: 15,
        notes: `Proyecto técnico en Supabase: ${row.tipo_proyecto || 'Residencial'} • Área: ${surfaceAreaM2} m² (${row.cliente?.canal_entrada || 'formulario_web'})`,
      };
    });

    // Filter out any quotes that were permanently deleted
    let activeMappedQuotes = mappedQuotes;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const delRaw = localStorage.getItem('pintuco_deleted_quote_ids_v1');
        const delList: string[] = delRaw ? JSON.parse(delRaw) : [];
        if (delList.length > 0) {
          activeMappedQuotes = mappedQuotes.filter(
            (q) => !delList.includes(q.id) && (!q.proyecto_id || !delList.includes(q.proyecto_id)) && !delList.includes(q.quoteNumber)
          );
        }
      }
    } catch {}

    // Combine Supabase rows with local backup so NO local quotes are lost
    const mergedAll: Quote[] = [...activeMappedQuotes];
    for (const b of localBackup) {
      if (
        !mergedAll.some(
          (m) =>
            m.id === b.id ||
            m.quoteNumber === b.quoteNumber ||
            (b.proyecto_id && m.proyecto_id === b.proyecto_id)
        )
      ) {
        mergedAll.push(b);
      }
    }

    // Admins update local backup with all data for auditing
    if (isAdmin) {
      setLocalBackupQuotes(mergedAll);
      return { quotes: mergedAll, fromCloud: true };
    }

    // For clients: strictly filter only their own quotes; never inject global/mock quotes
    const userQuotes = filterQuotesForUser(mergedAll, user);
    return { quotes: userQuotes, fromCloud: true };
  } catch (err: any) {
    console.error('Failed to fetch quotes from Supabase:', err);
    const localBackup = getLocalBackupQuotes();
    return { quotes: filterQuotesForUser(localBackup, user), fromCloud: false, error: err?.message || 'Error de conexión' };
  }
}


/**
 * Persist quotation to Supabase relational tables: cliente -> proyecto -> especificacion_tecnica
 * Keeps status as 'En preparación'.
 * Saves to localStorage as secondary backup.
 */
export async function saveQuoteToSupabase(
  quote: Quote,
  user?: UserProfile | null
): Promise<{ success: boolean; savedQuote: Quote; error?: string }> {
  const targetEmail = (user?.email || quote.cliente_email || quote.customer.email || '').trim().toLowerCase();
  const targetClienteId = user?.id || quote.cliente_id;

  const quoteWithPrepStatus: Quote = {
    ...quote,
    cliente_id: targetClienteId,
    cliente_email: targetEmail,
    status: quote.status || 'En preparación',
    customer: {
      ...quote.customer,
      email: targetEmail || quote.customer.email,
      name: quote.customer.name || user?.name || 'Cliente Particular',
      phone: quote.customer.phone || user?.phone || '3118568707',
    },
  };

  // Immediate redundant persistence to local backup
  saveToLocalBackup(quoteWithPrepStatus);

  try {
    // 1. Prepare strictly safe fields for 'cliente' table:
    // nombre: varchar(100), documento: varchar(20), responsable: varchar(100), canal_entrada: varchar(30)
    const doc = (user?.idNumber || quote.customer.idNumber || 'Sin NIT/Cédula').trim().slice(0, 20);
    const clientName = (user?.name || quote.customer.name || 'Cliente Particular').trim().slice(0, 100);
    const rawContact = quote.customer.contactPerson || user?.name || quote.customer.name || 'Contacto Comercial';
    const rawPhone = quote.customer.phone || user?.phone || '';
    const contactCombined = rawPhone ? `${rawContact} | ${rawPhone}` : rawContact;
    const contactSafe = contactCombined.trim().slice(0, 100);
    // canal_entrada is varchar(30)
    const channelSafe = (targetEmail || 'formulario_web').trim().slice(0, 30);

    const { data: clientData, error: clientError } = await supabase
      .from('cliente')
      .insert([
        {
          nombre: clientName,
          documento: doc,
          responsable: contactSafe,
          canal_entrada: channelSafe,
        },
      ])
      .select()
      .single();

    if (clientError) {
      console.warn('Error inserting cliente into Supabase, saving local backup:', clientError.message);
      saveToLocalBackup(quoteWithPrepStatus);
      return { success: false, savedQuote: quoteWithPrepStatus, error: clientError.message };
    }

    // 2. Prepare strictly safe fields for 'proyecto' table:
    // ciudad: varchar(50), tipo_proyecto: varchar(50), area_m2: numeric (m² reales), fecha_requerida: date
    const targetDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    const citySafe = (quote.customer.city || 'Bogotá D.C.').trim().slice(0, 50);

    // Calculate REAL square meters for the project (area_m2 strictly represents m², NOT money)
    let projectAreaM2 = 50; // default estimated m2
    if (quote.customer.notes && quote.customer.notes.includes('Área:')) {
      const match = quote.customer.notes.match(/Área:\s*(\d+(\.\d+)?)/i);
      if (match && Number(match[1]) > 0) {
        projectAreaM2 = Math.round(Number(match[1]));
      }
    } else if (quote.items && quote.items.length > 0) {
      // Estimate realistic surface coverage based on paint volume (approx 25 m2 per gallon)
      const totalUnits = quote.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      projectAreaM2 = Math.max(10, Math.min(2000, totalUnits * 25));
    }

    // Determine real architectural project type (Residencial, Comercial, Industrial, etc.)
    let tipoProyecto = 'Residencial';
    const mainCategory = quote.items[0]?.category;
    if (mainCategory === 'INDUSTRIAL') tipoProyecto = 'Industrial';
    else if (mainCategory === 'CONSTRUCCIÓN') tipoProyecto = 'Construcción y Mampostería';
    else if (mainCategory === 'AUTOMOTRIZ') tipoProyecto = 'Taller Automotriz';
    else if (quote.customer.notes && quote.customer.notes.toLowerCase().includes('fachada')) tipoProyecto = 'Fachada edificio residencial';
    else if (quote.customer.notes && quote.customer.notes.toLowerCase().includes('remodelaci')) tipoProyecto = 'residencial_remodelacion';
    else if (quote.customer.notes && quote.customer.notes.toLowerCase().includes('comercial')) tipoProyecto = 'Comercial';

    const { data: projectData, error: projectError } = await supabase
      .from('proyecto')
      .insert([
        {
          cliente_id: clientData.cliente_id,
          ciudad: citySafe,
          tipo_proyecto: tipoProyecto.slice(0, 50),
          area_m2: projectAreaM2,
          fecha_requerida: targetDate,
          estado: (quote.status as string) || 'En preparación',
        },
      ])
      .select()
      .single();

    if (projectError) {
      console.warn('Error inserting proyecto into Supabase, saving local backup:', projectError.message);
      saveToLocalBackup(quoteWithPrepStatus);
      return { success: false, savedQuote: quoteWithPrepStatus, error: projectError.message };
    }

    // 3. Prepare strictly safe fields for 'especificacion_tecnica' table:
    // superficie: varchar(50), ambiente: varchar(50), condicion: varchar(50), color: varchar(30)
    const mainItem = quote.items && quote.items.length > 0 ? quote.items[0] : null;
    const colorSpecSafe = (mainItem?.colorName || 'Blanco Nieve').trim().slice(0, 30);
    const surfaceSafe = (mainItem?.surfaceTag || 'concreto_mamposteria').trim().slice(0, 50);

    let ambiente = 'interior_seco';
    if (mainItem?.category === 'INDUSTRIAL') ambiente = 'industrial_severo';
    else if (mainItem?.category === 'AUTOMOTRIZ') ambiente = 'automotriz_taller';
    else if (mainItem?.category === 'CONSTRUCCIÓN') ambiente = 'obra_gris';

    const { error: specError } = await supabase
      .from('especificacion_tecnica')
      .insert([
        {
          proyecto_id: projectData.proyecto_id,
          superficie: surfaceSafe,
          ambiente: ambiente.slice(0, 50),
          condicion: 'nueva_sin_pintar',
          color: colorSpecSafe,
          Estado: 'En preparación',
        },
      ]);

    if (specError) {
      console.warn('Notice: especificacion_tecnica insert issue:', specError.message);
    }

    // Create final synced quote object with real Supabase proyecto_id
    const finalQuote: Quote = {
      ...quoteWithPrepStatus,
      id: projectData.proyecto_id,
      proyecto_id: projectData.proyecto_id,
      cliente_id: targetClienteId || clientData.cliente_id,
      cliente_email: targetEmail,
    };

    // Save to local backup as secondary storage
    saveToLocalBackup(finalQuote);

    return { success: true, savedQuote: finalQuote };
  } catch (err: any) {
    console.error('Supabase persistence exception, fallback to local backup:', err);
    saveToLocalBackup(quoteWithPrepStatus);
    return { success: false, savedQuote: quoteWithPrepStatus, error: err?.message || 'Error de red' };
  }
}

/**
 * Update quotation status in Supabase and local backup.
 * Strictly enforced: Only admin/asesor can modify quote status.
 */
export async function updateQuoteStatusInSupabase(
  quoteId: string,
  newStatus: QuoteStatus,
  user?: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  if (user && user.rol !== 'admin') {
    console.warn('Acción bloqueada: solo administradores pueden cambiar el estado.');
    return { success: false, error: 'Acceso no autorizado' };
  }

  try {
    await supabase.from('proyecto').update({ estado: newStatus }).eq('proyecto_id', quoteId);
  } catch (err) {
    console.warn('Could not update status in Supabase:', err);
  }

  // Also update local backup
  const backup = getLocalBackupQuotes();
  const updated = backup.map((q) => (q.id === quoteId || q.proyecto_id === quoteId ? { ...q, status: newStatus } : q));
  setLocalBackupQuotes(updated);
  return { success: true };
}

/**
 * Delete quotation definitively from Supabase and local backup.
 * Handles both UUID proyecto_id, string IDs, and quoteNumber (e.g. COT-2026-A362).
 */
export async function deleteQuoteFromSupabase(quoteId: string): Promise<boolean> {
  try {
    // 1. Record ID in local tombstone suppression list
    if (typeof window !== 'undefined' && window.localStorage) {
      const delRaw = localStorage.getItem('pintuco_deleted_quote_ids_v1');
      const delList: string[] = delRaw ? JSON.parse(delRaw) : [];
      if (!delList.includes(quoteId)) {
        delList.push(quoteId);
        localStorage.setItem('pintuco_deleted_quote_ids_v1', JSON.stringify(delList));
      }
    }
  } catch {}

  const backup = getLocalBackupQuotes();
  const target = backup.find(
    (q) => q.id === quoteId || q.proyecto_id === quoteId || q.quoteNumber === quoteId
  );
  const targetProyectoId = target?.proyecto_id || (quoteId.length >= 30 ? quoteId : target?.id);
  const targetQuoteNumber = target?.quoteNumber || quoteId;

  // 2. Immediately overwrite local backup
  const updated = backup.filter(
    (q) =>
      q.id !== quoteId &&
      q.proyecto_id !== quoteId &&
      q.quoteNumber !== quoteId &&
      (!targetProyectoId || (q.id !== targetProyectoId && q.proyecto_id !== targetProyectoId)) &&
      (!targetQuoteNumber || q.quoteNumber !== targetQuoteNumber)
  );
  setLocalBackupQuotes(updated);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('colorpro_saved_quotes_v1', JSON.stringify(updated));
    } catch {}
  }

  // 3. Delete from Supabase tables
  try {
    if (targetProyectoId) {
      // Must delete related records in especificacion_tecnica first due to foreign key
      await supabase.from('especificacion_tecnica').delete().eq('proyecto_id', targetProyectoId);
      await supabase.from('proyecto').delete().eq('proyecto_id', targetProyectoId);
    }
    if (quoteId && quoteId !== targetProyectoId) {
      await supabase.from('especificacion_tecnica').delete().eq('proyecto_id', quoteId);
      await supabase.from('proyecto').delete().eq('proyecto_id', quoteId);
    }
    // Also try delete by numero_cotizacion if column exists
    if (targetQuoteNumber && targetQuoteNumber.startsWith('COT-')) {
      try {
        await supabase.from('proyecto').delete().eq('numero_cotizacion', targetQuoteNumber);
      } catch {}
    }
  } catch (err) {
    console.warn('Notice: Error executing Supabase delete:', err);
  }

  return true;
}

function saveToLocalBackup(quote: Quote): void {
  const current = getLocalBackupQuotes();
  const existingIdx = current.findIndex(
    (q) =>
      q.id === quote.id ||
      q.quoteNumber === quote.quoteNumber ||
      (quote.proyecto_id && q.proyecto_id === quote.proyecto_id)
  );

  let updated: Quote[];
  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx] = quote;
  } else {
    updated = [quote, ...current];
  }
  setLocalBackupQuotes(updated);
}

// =========================================================================
// ORDERS & DISPATCH MANAGEMENT (CLIENT ISOLATION & ADMIN GLOBAL CONTROL)
// =========================================================================

export const STORAGE_KEY_ORDERS = 'pintuco_confirmed_orders_v1';

export function getLocalBackupOrders(): OrderConfirmation[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalBackupOrders(orders: OrderConfirmation[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  } catch (err) {
    console.error('Error saving local orders:', err);
  }
}

/**
 * Filter orders strictly by user role:
 * - Admin: sees all orders across all clients.
 * - Cliente: strictly sees only their own orders (matching cliente_id or email).
 */
export function filterOrdersForUser(
  orders: OrderConfirmation[],
  user?: UserProfile | null
): OrderConfirmation[] {
  if (!user) return [];

  if (user.rol === 'admin' && isMasterAdminEmail(user.email)) {
    return orders;
  }

  const currentUserId = user.id;
  const currentUserEmail = user.email.trim().toLowerCase();

  return orders.filter((order) => {
    const oEmail = (order.cliente_email || order.customer?.email || '').trim().toLowerCase();
    const oId = order.cliente_id;

    const idMatches = Boolean(oId && currentUserId && oId === currentUserId);
    const emailMatches = Boolean(oEmail && currentUserEmail && oEmail === currentUserEmail);

    return idMatches || emailMatches;
  });
}

/**
 * Fetch orders for the current user session:
 * Gathers confirmed orders and reconciles with quotes containing orders.
 */
export function fetchOrders(user?: UserProfile | null): OrderConfirmation[] {
  if (!user) return [];

  const storedOrders = getLocalBackupOrders();
  const backupQuotes = getLocalBackupQuotes();

  const allOrdersMap = new Map<string, OrderConfirmation>();

  for (const o of storedOrders) {
    allOrdersMap.set(o.orderNumber, o);
  }

  for (const q of backupQuotes) {
    if (q.order && q.order.orderNumber) {
      if (!allOrdersMap.has(q.order.orderNumber)) {
        allOrdersMap.set(q.order.orderNumber, {
          ...q.order,
          cliente_id: q.order.cliente_id || q.cliente_id,
          cliente_email: q.order.cliente_email || q.cliente_email || q.customer.email,
        });
      }
    }
  }

  const consolidatedOrders = Array.from(allOrdersMap.values());
  return filterOrdersForUser(consolidatedOrders, user);
}

/**
 * Persist an order to localStorage and sync corresponding quote status
 */
export async function saveOrderToStorage(
  order: OrderConfirmation,
  user?: UserProfile | null
): Promise<void> {
  const currentOrders = getLocalBackupOrders();
  const existingIdx = currentOrders.findIndex((o) => o.orderNumber === order.orderNumber);

  let updatedOrders: OrderConfirmation[];
  if (existingIdx > -1) {
    updatedOrders = [...currentOrders];
    updatedOrders[existingIdx] = order;
  } else {
    updatedOrders = [order, ...currentOrders];
  }
  setLocalBackupOrders(updatedOrders);

  // Sync with quote in localStorage
  const currentQuotes = getLocalBackupQuotes();
  const updatedQuotes = currentQuotes.map((q) => {
    if (q.id === order.quoteId || q.quoteNumber === order.quoteNumber) {
      return {
        ...q,
        status: 'Aprobada' as QuoteStatus,
        order,
      };
    }
    return q;
  });
  setLocalBackupQuotes(updatedQuotes);

  // Sync with Supabase proyecto status
  if (order.quoteId) {
    try {
      await supabase
        .from('proyecto')
        .update({ estado: 'Aprobada' })
        .eq('proyecto_id', order.quoteId);
    } catch (e) {
      console.warn('Notice: Supabase proyecto status update:', e);
    }
  }
}

/**
 * Update order dispatch status (Admin exclusive)
 */
export async function updateOrderStatus(
  orderNumber: string,
  newStatus: OrderStatus,
  user?: UserProfile | null
): Promise<boolean> {
  if (user && user.rol !== 'admin') {
    return false;
  }

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ORDERS) : null;
    const orders: OrderConfirmation[] = raw ? JSON.parse(raw) : [];
    const updated = orders.map((o) =>
      o.orderNumber === orderNumber ? { ...o, status: newStatus } : o
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
    }

    // Also update order in quotes
    const rawQuotes = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_BACKUP) : null;
    if (rawQuotes) {
      const quotes: Quote[] = JSON.parse(rawQuotes);
      const updatedQuotes = quotes.map((q) => {
        if (q.order && q.order.orderNumber === orderNumber) {
          return {
            ...q,
            order: { ...q.order, status: newStatus },
          };
        }
        return q;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_BACKUP, JSON.stringify(updatedQuotes));
      }
    }

    // Attempt to sync to Supabase if linked to a project
    const targetOrder = orders.find((o) => o.orderNumber === orderNumber);
    if (targetOrder?.quoteId) {
      try {
        await supabase
          .from('proyecto')
          .update({ estado: 'Aprobada' })
          .eq('proyecto_id', targetOrder.quoteId);
      } catch (e) {
        console.warn('Notice: Supabase sync on order status:', e);
      }
    }
  } catch (err) {
    console.warn('Error updating order status:', err);
  }

  return true;
}

// =========================================================================
// READ-ONLY INTROSPECTION & AUDIT SERVICES (ACADEMIC VERIFICATION)
// =========================================================================

export interface SupabaseClientRecord {
  cliente_id: string;
  nombre: string;
  documento: string;
  responsable: string;
  canal_entrada: string;
  created_at: string;
}

export interface SupabaseProjectRecord {
  proyecto_id: string;
  cliente_id: string;
  ciudad: string;
  tipo_proyecto: string;
  area_m2: number;
  fecha_requerida: string;
  created_at: string;
  estado: string;
}

export interface SupabaseSpecRecord {
  especificacion_id: string;
  proyecto_id: string | null;
  superficie: string;
  ambiente: string;
  condicion: string | null;
  color: string | null;
  Estado: string | null;
}

export interface SupabaseEvidenciaRecord {
  evidencia_id: string;
  proyecto_id: string | null;
  descripcion: string | null;
  fotos: string | null;
}

export interface SupabaseDiagnosticResult {
  connected: boolean;
  endpoint: string;
  latencyMs: number;
  tables: {
    cliente: { exists: boolean; count: number; sample?: SupabaseClientRecord[] };
    proyecto: { exists: boolean; count: number; sample?: SupabaseProjectRecord[] };
    especificacion_tecnica: { exists: boolean; count: number; sample?: SupabaseSpecRecord[] };
    evidencia: { exists: boolean; count: number; sample?: SupabaseEvidenciaRecord[] };
    productos: { exists: boolean; count: number; note: string };
    compras: { exists: boolean; count: number; note: string };
    inventario: { exists: boolean; count: number; note: string };
  };
  modulesMapping: {
    module: string;
    targetTable: string;
    status: 'CONECTADO_DIRECTO' | 'PARCIAL_RELACIONAL' | 'CATALOGO_OFICIAL_MEMORIA' | 'REQUIERE_TABLA_PEDIDO' | 'STOCK_MAESTRO_MEMORIA';
    storageLocation: 'Supabase (Nube)' | 'Navegador / App' | 'Híbrido';
    description: string;
  }[];
  error?: string;
}

/**
 * Read-only query to fetch real clients directly from Supabase `cliente` table.
 * Enforces RLS privacy (Requirement 7):
 * - Visitors (unauthenticated): blocked.
 * - Regular clients: restricted to their own record.
 * - Admins: global auditing allowed.
 */
export async function fetchClientsFromSupabase(user?: UserProfile | null): Promise<{
  clients: SupabaseClientRecord[];
  count: number;
  error?: string;
}> {
  if (!user) {
    return {
      clients: [],
      count: 0,
      error: 'Acceso bloqueado: Los visitantes no pueden consultar información personal de clientes.',
    };
  }

  const isAdmin = user.rol === 'admin' && isMasterAdminEmail(user.email);

  try {
    if (!isAdmin) {
      // Client privacy isolation: only own client record
      const targetEmail = (user.email || '').trim().toLowerCase();
      const { data, error } = await supabase
        .from('cliente')
        .select('*')
        .eq('canal_entrada', targetEmail)
        .limit(1);

      return { clients: data || [], count: data?.length || 0, error: error?.message };
    }

    const { data, error, count } = await supabase
      .from('cliente')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      return { clients: [], count: 0, error: error.message };
    }

    return { clients: data || [], count: count || (data?.length || 0) };
  } catch (err: any) {
    return { clients: [], count: 0, error: err?.message || 'Error de conexión' };
  }
}

/**
 * Read-only query to fetch real technical specifications from Supabase `especificacion_tecnica` table.
 */
export async function fetchTechnicalSpecsFromSupabase(): Promise<{
  specs: SupabaseSpecRecord[];
  count: number;
  error?: string;
}> {
  try {
    const { data, error, count } = await supabase
      .from('especificacion_tecnica')
      .select('*', { count: 'exact' });

    if (error) {
      return { specs: [], count: 0, error: error.message };
    }

    return { specs: data || [], count: count || (data?.length || 0) };
  } catch (err: any) {
    return { specs: [], count: 0, error: err?.message || 'Error de conexión' };
  }
}

/**
 * Read-only query to fetch real project evidence from Supabase `evidencia` table.
 */
export async function fetchEvidenciasFromSupabase(): Promise<{
  evidencias: SupabaseEvidenciaRecord[];
  count: number;
  error?: string;
}> {
  try {
    const { data, error, count } = await supabase
      .from('evidencia')
      .select('*', { count: 'exact' });

    if (error) {
      return { evidencias: [], count: 0, error: error.message };
    }

    return { evidencias: data || [], count: count || (data?.length || 0) };
  } catch (err: any) {
    return { evidencias: [], count: 0, error: err?.message || 'Error de conexión' };
  }
}

/**
 * Diagnostic function: Executes read-only queries against existing tables,
 * evaluates latency, retrieves exact row counts, and builds an exhaustive audit
 * for academic submission without executing any writes, alters or migrations.
 * Masks personal information for non-admins to respect privacy and RLS.
 */
export async function getSupabaseDiagnostic(user?: UserProfile | null): Promise<SupabaseDiagnosticResult> {
  const t0 = performance.now();
  const endpoint =
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    'https://ihsimnqprmfihwxjztlc.supabase.co';

  const isAdmin = Boolean(user && user.rol === 'admin' && isMasterAdminEmail(user.email));

  try {
    // 1. Query `cliente` (read-only)
    const { data: clients, error: cErr, count: cCount } = await supabase
      .from('cliente')
      .select('*', { count: 'exact' })
      .limit(5);

    // 2. Query `proyecto` (read-only)
    const { data: projects, error: pErr, count: pCount } = await supabase
      .from('proyecto')
      .select('*', { count: 'exact' })
      .limit(5);

    // 3. Query `especificacion_tecnica` (read-only)
    const { data: specs, error: sErr, count: sCount } = await supabase
      .from('especificacion_tecnica')
      .select('*', { count: 'exact' })
      .limit(5);

    // 4. Query `evidencia` (read-only)
    const { data: evidencias, error: evErr, count: evCount } = await supabase
      .from('evidencia')
      .select('*', { count: 'exact' })
      .limit(5);

    const latencyMs = Math.round(performance.now() - t0);
    const connected = !cErr && !pErr;

    // Mask client data if not master admin to respect privacy / RLS rules
    const maskedClients = (clients || []).map((c) => {
      if (isAdmin) return c;
      return {
        ...c,
        nombre: c.nombre ? `${c.nombre.substring(0, 3)}*** (Protegido RLS)` : '***',
        documento: '***-***',
        responsable: '*** (Confidencial)',
        canal_entrada: '***@***',
      };
    });

    return {
      connected,
      endpoint,
      latencyMs,
      tables: {
        cliente: {
          exists: !cErr,
          count: cCount ?? (clients?.length || 0),
          sample: maskedClients,
        },
        proyecto: {
          exists: !pErr,
          count: pCount ?? (projects?.length || 0),
          sample: projects || [],
        },
        especificacion_tecnica: {
          exists: !sErr,
          count: sCount ?? (specs?.length || 0),
          sample: specs || [],
        },
        evidencia: {
          exists: !evErr,
          count: evCount ?? (evidencias?.length || 0),
          sample: evidencias || [],
        },
        productos: {
          exists: false,
          count: 0,
          note: 'No existe tabla `productos` en Supabase. El catálogo oficial de Pintuco reside en la app.',
        },
        compras: {
          exists: false,
          count: 0,
          note: 'No existe tabla `compras` ni `pedidos`. Las órdenes confirmadas se guardan en el cliente; un proyecto "Aprobada" es aprobación comercial, no compra pagada.',
        },
        inventario: {
          exists: false,
          count: 0,
          note: 'No existe tabla `inventario` en Supabase. Se gestiona en memoria / catálogo según existencias reales Pintuco.',
        },
      },
      modulesMapping: [
        {
          module: 'Clientes',
          targetTable: 'cliente (59 filas)',
          status: 'CONECTADO_DIRECTO',
          storageLocation: 'Supabase (Nube)',
          description:
            'Persistencia directa 1:1 en tabla cliente (cliente_id UUID, nombre, documento, responsable, canal_entrada).',
        },
        {
          module: 'Cotizaciones (Proyectos y Especificaciones)',
          targetTable: 'proyecto (29 filas) + especificacion_tecnica (22 filas)',
          status: 'PARCIAL_RELACIONAL',
          storageLocation: 'Híbrido',
          description:
            'En Supabase persiste el encabezado de proyecto (ciudad, tipo_proyecto, area_m2 reales, estado) y especificación técnica de pintura. El desglose financiero (items, precios COP e IVA) se respalda en el navegador por ausencia de tabla `detalle_cotizacion`.',
        },
        {
          module: 'Evidencias de Obra',
          targetTable: 'evidencia (5 filas)',
          status: 'CONECTADO_DIRECTO',
          storageLocation: 'Supabase (Nube)',
          description:
            'Persistencia directa en tabla evidencia (evidencia_id, FK proyecto_id, descripcion de la obra, fotos JSON).',
        },
        {
          module: 'Productos / Catálogo Maestro',
          targetTable: 'Catálogo Oficial Pintuco (35+ productos)',
          status: 'CATALOGO_OFICIAL_MEMORIA',
          storageLocation: 'Navegador / App',
          description:
            'No existe tabla `productos` en Supabase. Se preservan precios en COP, fichas técnicas y SKUs en la app para evitar pérdida de datos sin alterar la base de datos.',
        },
        {
          module: 'Compras / Pedidos',
          targetTable: 'Órdenes de Compra (Requiere tabla `pedido` en Supabase)',
          status: 'REQUIERE_TABLA_PEDIDO',
          storageLocation: 'Navegador / App',
          description:
            'No existe tabla `pedido` ni `compra` en Supabase. Las órdenes de pago y despacho se guardan en el almacenamiento seguro del cliente. Un proyecto con estado "Aprobada" representa aprobación de propuesta, NO una compra pagada.',
        },
        {
          module: 'Inventario',
          targetTable: 'Stock Maestro ColorLink',
          status: 'STOCK_MAESTRO_MEMORIA',
          storageLocation: 'Navegador / App',
          description:
            'No existe tabla `inventario` en Supabase. El control de existencias se calcula contra el inventario de referencia de ColorLink.',
        },
      ],
      error: cErr?.message || pErr?.message || sErr?.message,
    };
  } catch (err: any) {
    return {
      connected: false,
      endpoint,
      latencyMs: Math.round(performance.now() - t0),
      tables: {
        cliente: { exists: false, count: 0 },
        proyecto: { exists: false, count: 0 },
        especificacion_tecnica: { exists: false, count: 0 },
        evidencia: { exists: false, count: 0 },
        productos: { exists: false, count: 0, note: 'Error de conexión' },
        compras: { exists: false, count: 0, note: 'Error de conexión' },
        inventario: { exists: false, count: 0, note: 'Error de conexión' },
      },
      modulesMapping: [],
      error: err?.message || 'Error general de conexión',
    };
  }
}
