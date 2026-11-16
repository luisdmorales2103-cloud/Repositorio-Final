import { jsPDF } from 'jspdf';
import { Quote } from '../types';
import { formatCOP, formatSpanishDate } from './formatters';

/**
 * Generates a formal, monochrome (grayscale) commercial and technical quotation PDF.
 * Uses jsPDF for direct vector generation, keeping only the corporate logo in its original colors.
 * Resizes final price to 17pt bold, and includes the technical contact Luis Morales.
 */
/**
 * Builds the jsPDF instance for a formal, monochrome (grayscale) commercial and technical quotation PDF.
 * Conserves the corporate logo in deep blue #1E3A8A and amber #FBBF24, 17pt bold final total, and contact Luis Morales.
 */
export function buildQuotePdfDoc(quote: Quote): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const rightX = pageWidth - margin;
  let y = 14;

  // 1. Corporate Header
  // Corporate Logo Badge (conserves original brand colors: deep blue #1E3A8A and amber #FBBF24)
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(margin, y, 12, 12, 2.5, 2.5, 'F');
  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PCL', margin + 6, y + 7.8, { align: 'center' });

  // Header Text in grayscale
  doc.setTextColor(17, 24, 39); // #111827
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PINTUCO COLOR LINK', margin + 16, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81); // #374151
  doc.text('Ficha Técnica y Comercial de Pinturas y Recubrimientos', margin + 16, y + 9.5);
  doc.text('NIT: 901.845.220-4 · Línea / WhatsApp: 311 856 8707 · Bogotá D.C., Colombia', margin + 16, y + 13.5);

  // Right Header Box (Radicado oficial & Fecha)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  doc.text('RADICADO OFICIAL', rightX, y + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(quote.quoteNumber || 'COT-2026', rightX, y + 9.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Fecha de Emisión: ${formatSpanishDate(quote.date)}`, rightX, y + 13.5, { align: 'right' });

  y += 18;

  // Thin separator line
  doc.setDrawColor(209, 213, 219); // #D1D5DB
  doc.setLineWidth(0.4);
  doc.line(margin, y, rightX, y);

  y += 5;

  // 2. Tabla de Datos del Cliente y Obra
  doc.setFillColor(243, 244, 246); // #F3F4F6
  doc.rect(margin, y, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  doc.text('DATOS DEL CLIENTE Y OBRA', margin + 3, y + 4.2);

  y += 6;

  const rowHeight = 6.2;
  const colHalf = contentWidth / 2;

  const clientRows = [
    [
      { label: 'Razón Social / Cliente:', val: quote.customer.name || 'Cliente Particular' },
      { label: 'Documento (NIT/CC):', val: quote.customer.idNumber || 'Sin registrar' },
    ],
    [
      { label: 'Contacto Responsable:', val: quote.customer.contactPerson || quote.customer.name || 'No especificado' },
      { label: 'Ciudad / Municipio:', val: quote.customer.city || 'Bogotá D.C.' },
    ],
    [
      { label: 'Celular / Teléfono:', val: quote.customer.phone || 'No especificado' },
      {
        label: 'Tipo de Proyecto:',
        val: quote.items[0]?.category
          ? `${quote.items[0].category} · Proyecto de Recubrimiento`
          : 'Mantenimiento / Obra Arquitectónica',
      },
    ],
  ];

  doc.setFontSize(7.5);
  clientRows.forEach((r, idx) => {
    doc.setDrawColor(209, 213, 219);
    doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 251);
    doc.rect(margin, y, contentWidth, rowHeight, 'FD');

    // Col 1
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(r[0].label, margin + 3, y + 4.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    const val1 = doc.splitTextToSize(r[0].val, colHalf - 42);
    doc.text(val1[0] || '', margin + 40, y + 4.2);

    // Col 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(r[1].label, margin + colHalf + 3, y + 4.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    const val2 = doc.splitTextToSize(r[1].val, colHalf - 42);
    doc.text(val2[0] || '', margin + colHalf + 40, y + 4.2);

    y += rowHeight;
  });

  y += 5;

  // 3. Tabla de Especificación y Dosificación
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.rect(margin, y, contentWidth, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(17, 24, 39);

  doc.text('Ítem', margin + 3, y + 4.8);
  doc.text('Producto / Sistema Sugerido', margin + 14, y + 4.8);
  doc.text('Superficie', margin + 78, y + 4.8);
  doc.text('Área (m²)', margin + 116, y + 4.8, { align: 'right' });
  doc.text('Galones Calc.', margin + 144, y + 4.8, { align: 'right' });
  doc.text('Presentación Comercial Sugerida', rightX - 2, y + 4.8, { align: 'right' });

  y += 7;

  // Table Item Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  quote.items.forEach((item, index) => {
    let galPerUnit = 1;
    const presLower = (item.presentation || '').toLowerCase();
    if (presLower.includes('5 gal') || presLower.includes('cuñete')) {
      galPerUnit = 5;
    } else if (presLower.includes('caneca')) {
      galPerUnit = 4;
    } else if (presLower.includes('cuarto')) {
      galPerUnit = 0.25;
    }

    const totalGal = Number((item.quantity * galPerUnit).toFixed(1));
    const estimatedM2 = Math.round(totalGal * 25);
    const superficie = item.surfaceTag || (item.category === 'INDUSTRIAL' ? 'Metálica / Epóxica' : 'Mampostería / Concreto');
    const itemRowHeight = 9.5;

    doc.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 250);
    doc.setDrawColor(209, 213, 219);
    doc.rect(margin, y, contentWidth, itemRowHeight, 'FD');

    // Ítem #
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(String(index + 1), margin + 4, y + 4.2);

    // Producto y Color
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    const prodTitle = doc.splitTextToSize(item.productName, 60);
    doc.text(prodTitle[0] || item.productName, margin + 14, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(75, 85, 99);
    const colorText = item.colorName ? `Color: ${item.colorName} (${item.colorHex})` : `Código: ${item.sku}`;
    doc.text(colorText, margin + 14, y + 7.5);

    // Superficie
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    const surfText = doc.splitTextToSize(superficie, 24);
    doc.text(surfText[0] || superficie, margin + 78, y + 5);

    // Área (m2)
    doc.setFont('helvetica', 'normal');
    doc.text(`${estimatedM2} m²`, margin + 116, y + 5, { align: 'right' });

    // Galones
    doc.text(`${totalGal} gal`, margin + 144, y + 5, { align: 'right' });

    // Presentación comercial
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`${item.presentation} x ${item.quantity}`, rightX - 2, y + 5, { align: 'right' });

    y += itemRowHeight;
  });

  y += 5;

  // 4. Totalización y Subtotales (Monocromático, elegante)
  const totalsWidth = 90;
  const totalsX = rightX - totalsWidth;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.text('Subtotal Estimado:', totalsX, y + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(formatCOP(quote.subtotal), rightX, y + 3.5, { align: 'right' });

  y += 5;

  if (quote.discountPercent > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(`Descuento (${quote.discountPercent}%):`, totalsX, y + 3.5);
    doc.text(`- ${formatCOP(quote.discountAmount)}`, rightX, y + 3.5, { align: 'right' });
    y += 5;
  }

  // IVA
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text(`IVA (${quote.includeIva ? '19%' : 'No Aplica'}):`, totalsX, y + 3.5);
  doc.text(quote.includeIva ? formatCOP(quote.ivaAmount) : '$ 0', rightX, y + 3.5, { align: 'right' });

  y += 6.5;

  // VALOR ESTIMADO REFERENCIAL / PRECIO FINAL (17pt negrita)
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.rect(margin, y, contentWidth, 13, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('VALOR ESTIMADO REFERENCIAL / PRECIO FINAL:', margin + 4, y + 8.2);

  doc.setFontSize(17);
  doc.setTextColor(17, 24, 39);
  doc.text(`${formatCOP(quote.total)} COP`, rightX - 4, y + 8.8, { align: 'right' });

  y += 17;

  // 5. Pie Técnico de Contacto y Validez
  doc.setDrawColor(209, 213, 219);
  doc.rect(margin, y, contentWidth, 16, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  doc.text('CONTACTO TÉCNICO Y CONDICIONES COMERCIALES', margin + 3, y + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);
  doc.text('Asesor Técnico Asignado: ', margin + 3, y + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Luis Morales', margin + 35, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text('Línea / Celular: ', margin + 68, y + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('311 856 8707', margin + 89, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text('Validez de la oferta: ', margin + 124, y + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('30 días calendario', margin + 150, y + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(107, 114, 128);
  doc.text(
    'Documento de especificación técnica y comercial referencial emitido por Pintuco Color Link Colombia.',
    margin + 3,
    y + 13
  );

  return doc;
}

/**
 * Extracts raw base64 data and standard filename for a quote PDF.
 * Uses exact Cotizacion_Pintuco_[RADICADO].pdf naming standard.
 */
export function getQuotePdfBase64(quote: Quote): { base64: string; filename: string } {
  const doc = buildQuotePdfDoc(quote);
  const sanitizedNumber = (quote.quoteNumber || 'COT-2026').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Cotizacion_Pintuco_${sanitizedNumber}.pdf`;
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
  return { base64, filename };
}

/**
 * Downloads or prints the formal commercial and technical quotation PDF.
 */
export function generateQuotePdf(quote: Quote): void {
  try {
    const doc = buildQuotePdfDoc(quote);
    const sanitizedNumber = (quote.quoteNumber || 'COT-2026').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Cotizacion_Pintuco_${sanitizedNumber}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error('Error generating PDF with jsPDF, falling back to window.print():', err);
    window.print();
  }
}
