import { Quote } from '../types';

/**
 * Formats numeric values to Colombian Peso (COP) string.
 * Example: 85000 -> "$ 85.000"
 */
export function formatCOP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date into Spanish readable format.
 */
export function formatSpanishDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Generates an automatic sequential quote number like "COT-2026-0002", "COT-2026-0003",
 * guaranteeing uniqueness without repeating numbers even if state was reset.
 */
export function generateQuoteNumber(existingQuotes: Quote[] = []): string {
  const year = new Date().getFullYear();
  const yearPrefix = `COT-${year}-`;
  
  // Collect all known quotes from memory and persistent storage
  let allQuotes: { quoteNumber?: string }[] = [...(existingQuotes || [])];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem('colorpro_saved_quotes_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          allQuotes = [...allQuotes, ...parsed];
        }
      }
    }
  } catch {}

  let maxSeq = 0;
  for (const q of allQuotes) {
    const qNum = q?.quoteNumber;
    if (qNum && qNum.startsWith(yearPrefix)) {
      const parts = qNum.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }

  // Read the highest issued sequence counter
  let storedSeq = 0;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rawSeq = localStorage.getItem('pintuco_last_quote_seq');
      if (rawSeq) {
        storedSeq = parseInt(rawSeq, 10) || 0;
      }
    }
  } catch {}

  // Determine next unique sequential number
  let nextSeq = Math.max(maxSeq, storedSeq) + 1;
  
  // Persist the updated sequence counter immediately
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('pintuco_last_quote_seq', String(nextSeq));
    }
  } catch {}

  return `${yearPrefix}${String(nextSeq).padStart(4, '0')}`;
}


/**
 * Encodes a quote into a WhatsApp shareable URL according to the exact brief:
 * Hola, comparto la cotización [número].
 * 
 * Cliente:
 * [nombre]
 * 
 * Productos:
 * [listado]
 * 
 * Total:
 * [$ total]
 * 
 * Gracias.
 */
export function generateWhatsAppUrl(quote: Quote): string {
  const itemsList = quote.items
    .map((item, idx) => `${idx + 1}. ${item.productName} (${item.presentation}) x ${item.quantity} = ${formatCOP(item.subtotal)}`)
    .join('\n');

  const message = `Hola, comparto la cotización ${quote.quoteNumber}.

Cliente:
${quote.customer.name || 'Cliente'}

Productos:
${itemsList || 'Sin productos'}

Total:
${formatCOP(quote.total)}

Gracias.`;

  const phone = quote.customer.phone ? quote.customer.phone.replace(/[^0-9]/g, '') : '';
  const baseUrl = phone ? `https://wa.me/57${phone}` : `https://wa.me/573118568707`;

  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}
