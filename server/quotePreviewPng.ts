import zlib from 'zlib';

/**
 * Pure TypeScript PNG Generator for Quotation Previews in Node.js
 * Generates a crisp, elegant preview image of the Pintuco ColorLink quotation.
 */

// 5x7 Font data for ASCII 32 to 126
const FONT_MAP: Record<string, number[]> = {
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '!': [0x00, 0x00, 0x5F, 0x00, 0x00],
  '"': [0x00, 0x07, 0x00, 0x07, 0x00],
  '#': [0x14, 0x7F, 0x14, 0x7F, 0x14],
  '$': [0x24, 0x2A, 0x7F, 0x2A, 0x12],
  '%': [0x23, 0x13, 0x08, 0x64, 0x62],
  '&': [0x36, 0x49, 0x55, 0x22, 0x50],
  "'": [0x00, 0x05, 0x03, 0x00, 0x00],
  '(': [0x00, 0x1C, 0x22, 0x41, 0x00],
  ')': [0x00, 0x41, 0x22, 0x1C, 0x00],
  '*': [0x08, 0x2A, 0x1C, 0x2A, 0x08],
  '+': [0x08, 0x08, 0x3E, 0x08, 0x08],
  ',': [0x00, 0x50, 0x30, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  '/': [0x20, 0x10, 0x08, 0x04, 0x02],
  '0': [0x3E, 0x51, 0x49, 0x45, 0x3E],
  '1': [0x00, 0x42, 0x7F, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4B, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7F, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3C, 0x4A, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1E],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  ';': [0x00, 0x56, 0x36, 0x00, 0x00],
  '<': [0x08, 0x14, 0x22, 0x41, 0x00],
  '=': [0x14, 0x14, 0x14, 0x14, 0x14],
  '>': [0x00, 0x41, 0x22, 0x14, 0x08],
  '?': [0x02, 0x01, 0x51, 0x09, 0x06],
  '@': [0x32, 0x49, 0x79, 0x41, 0x3E],
  'A': [0x7E, 0x11, 0x11, 0x11, 0x7E],
  'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
  'C': [0x3E, 0x41, 0x41, 0x41, 0x22],
  'D': [0x7F, 0x41, 0x41, 0x22, 0x1C],
  'E': [0x7F, 0x49, 0x49, 0x49, 0x41],
  'F': [0x7F, 0x09, 0x09, 0x09, 0x01],
  'G': [0x3E, 0x41, 0x49, 0x49, 0x7A],
  'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
  'I': [0x00, 0x41, 0x7F, 0x41, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3F, 0x01],
  'K': [0x7F, 0x08, 0x14, 0x22, 0x41],
  'L': [0x7F, 0x40, 0x40, 0x40, 0x40],
  'M': [0x7F, 0x02, 0x04, 0x02, 0x7F],
  'N': [0x7F, 0x04, 0x08, 0x10, 0x7F],
  'O': [0x3E, 0x41, 0x41, 0x41, 0x3E],
  'P': [0x7F, 0x09, 0x09, 0x09, 0x06],
  'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E],
  'R': [0x7F, 0x09, 0x19, 0x29, 0x46],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31],
  'T': [0x01, 0x01, 0x7F, 0x01, 0x01],
  'U': [0x3F, 0x40, 0x40, 0x40, 0x3F],
  'V': [0x1F, 0x20, 0x40, 0x20, 0x1F],
  'W': [0x7F, 0x20, 0x18, 0x20, 0x7F],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63],
  'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
  '[': [0x00, 0x7F, 0x41, 0x41, 0x00],
  '\\': [0x02, 0x04, 0x08, 0x10, 0x20],
  ']': [0x00, 0x41, 0x41, 0x7F, 0x00],
  '^': [0x04, 0x02, 0x01, 0x02, 0x04],
  '_': [0x40, 0x40, 0x40, 0x40, 0x40],
  'a': [0x20, 0x54, 0x54, 0x54, 0x78],
  'b': [0x7F, 0x48, 0x44, 0x44, 0x38],
  'c': [0x38, 0x44, 0x44, 0x44, 0x20],
  'd': [0x38, 0x44, 0x44, 0x48, 0x7F],
  'e': [0x38, 0x54, 0x54, 0x54, 0x18],
  'f': [0x08, 0x7E, 0x09, 0x01, 0x02],
  'g': [0x0C, 0x52, 0x52, 0x52, 0x3E],
  'h': [0x7F, 0x08, 0x04, 0x04, 0x78],
  'i': [0x00, 0x44, 0x7D, 0x40, 0x00],
  'j': [0x20, 0x40, 0x44, 0x3D, 0x00],
  'k': [0x7F, 0x10, 0x28, 0x44, 0x00],
  'l': [0x00, 0x41, 0x7F, 0x40, 0x00],
  'm': [0x7C, 0x04, 0x18, 0x04, 0x78],
  'n': [0x7C, 0x08, 0x04, 0x04, 0x78],
  'o': [0x38, 0x44, 0x44, 0x44, 0x38],
  'p': [0x7C, 0x14, 0x14, 0x14, 0x08],
  'q': [0x08, 0x14, 0x14, 0x18, 0x7C],
  'r': [0x7C, 0x08, 0x04, 0x04, 0x08],
  's': [0x48, 0x54, 0x54, 0x54, 0x20],
  't': [0x04, 0x3F, 0x44, 0x40, 0x20],
  'u': [0x3C, 0x40, 0x40, 0x20, 0x7C],
  'v': [0x1C, 0x20, 0x40, 0x20, 0x1C],
  'w': [0x3C, 0x40, 0x30, 0x40, 0x3C],
  'x': [0x44, 0x28, 0x10, 0x28, 0x44],
  'y': [0x0C, 0x50, 0x50, 0x50, 0x3C],
  'z': [0x44, 0x64, 0x54, 0x4C, 0x44],
};

// CRC32 Lookup Table
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function calculateCrc32(buf: Buffer): number {
  let c = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

function makePngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCrc32(combined), 0);
  return Buffer.concat([len, combined, crc]);
}

class SimpleCanvas {
  width: number;
  height: number;
  buffer: Buffer;

  constructor(width: number, height: number, bg: [number, number, number] = [255, 255, 255]) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      this.buffer[i * 3] = bg[0];
      this.buffer[i * 3 + 1] = bg[1];
      this.buffer[i * 3 + 2] = bg[2];
    }
  }

  setPixel(x: number, y: number, r: number, g: number, b: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 3;
    this.buffer[idx] = r;
    this.buffer[idx + 1] = g;
    this.buffer[idx + 2] = b;
  }

  fillRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number) {
    const x0 = Math.max(0, x);
    const y0 = Math.max(0, y);
    const x1 = Math.min(this.width, x + w);
    const y1 = Math.min(this.height, y + h);
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.setPixel(px, py, r, g, b);
      }
    }
  }

  strokeRect(x: number, y: number, w: number, h: number, r: number, g: number, b: number, lineWidth: number = 1) {
    this.fillRect(x, y, w, lineWidth, r, g, b); // Top
    this.fillRect(x, y + h - lineWidth, w, lineWidth, r, g, b); // Bottom
    this.fillRect(x, y, lineWidth, h, r, g, b); // Left
    this.fillRect(x + w - lineWidth, y, lineWidth, h, r, g, b); // Right
  }

  drawText(text: string, x: number, y: number, color: [number, number, number], scale: number = 1) {
    let curX = x;
    const clean = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip accents for bitmap font
    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      const fontChar = FONT_MAP[ch] || FONT_MAP['?'] || [0, 0, 0, 0, 0];
      for (let col = 0; col < 5; col++) {
        const colBits = fontChar[col];
        for (let row = 0; row < 7; row++) {
          if ((colBits >> row) & 1) {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                this.setPixel(curX + col * scale + sx, y + row * scale + sy, color[0], color[1], color[2]);
              }
            }
          }
        }
      }
      curX += 6 * scale;
    }
  }

  toPngBuffer(): Buffer {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // RGB
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const scanlineSize = 1 + this.width * 3;
    const rawData = Buffer.alloc(scanlineSize * this.height);
    for (let y = 0; y < this.height; y++) {
      const rowOffset = y * scanlineSize;
      rawData[rowOffset] = 0; // Filter 0 (None)
      const srcOffset = y * this.width * 3;
      this.buffer.copy(rawData, rowOffset + 1, srcOffset, srcOffset + this.width * 3);
    }

    const compressed = zlib.deflateSync(rawData);
    return Buffer.concat([
      signature,
      makePngChunk('IHDR', ihdr),
      makePngChunk('IDAT', compressed),
      makePngChunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

/**
 * Generates an official, beautiful PNG preview of a quotation for Gmail inline embedding.
 */
export function generateQuotePreviewPng(quote: any): Buffer {
  const width = 640;
  const height = 820;
  const canvas = new SimpleCanvas(width, height, [255, 255, 255]);

  // Card Outer Border & Shadow
  canvas.strokeRect(10, 10, width - 20, height - 20, 203, 213, 225, 2);

  // Top Corporate Banner Header
  canvas.fillRect(12, 12, width - 24, 76, 248, 250, 252);
  canvas.fillRect(12, 86, width - 24, 2, 226, 232, 240);

  // Corporate Logo Badge: PCL in #1E3A8A deep blue and #FBBF24 amber
  canvas.fillRect(28, 24, 52, 52, 30, 58, 138);
  canvas.drawText('PCL', 38, 40, [251, 191, 36], 2);

  // Brand Titles
  canvas.drawText('PINTUCO COLOR LINK COLOMBIA', 92, 28, [15, 23, 42], 2);
  canvas.drawText('Ficha Tecnica y Comercial de Pinturas y Recubrimientos', 92, 48, [71, 85, 105], 1);
  canvas.drawText('NIT: 901.845.220-4  |  WhatsApp: 311 856 8707  |  Bogota D.C.', 92, 62, [100, 116, 139], 1);

  // Right Header: Radicado Oficial
  const rad = String(quote.quoteNumber || 'COT-2026').toUpperCase();
  canvas.fillRect(width - 200, 22, 172, 56, 241, 245, 249);
  canvas.strokeRect(width - 200, 22, 172, 56, 203, 213, 225, 1);
  canvas.drawText('RADICADO OFICIAL', width - 188, 30, [100, 116, 139], 1);
  canvas.drawText(rad, width - 188, 44, [30, 58, 138], 2);
  canvas.drawText('Validez: 30 dias', width - 188, 64, [71, 85, 105], 1);

  // Client Data Box
  canvas.fillRect(28, 100, width - 56, 88, 248, 250, 252);
  canvas.strokeRect(28, 100, width - 56, 88, 203, 213, 225, 1);
  canvas.fillRect(28, 100, width - 56, 22, 226, 232, 240);
  canvas.drawText('DATOS DEL CLIENTE Y PROYECTO', 38, 106, [30, 41, 59], 1);

  const clientName = (quote.customer?.name || quote.cliente_nombre || 'Cliente Particular').slice(0, 38);
  const clientDoc = quote.customer?.idNumber || 'Sin registrar';
  const clientCity = quote.customer?.city || 'Bogota D.C.';
  const clientPhone = quote.customer?.phone || '311 856 8707';

  canvas.drawText(`Razon Social / Cliente: ${clientName}`, 38, 130, [51, 65, 85], 1);
  canvas.drawText(`Documento (NIT/CC):     ${clientDoc}`, 38, 145, [51, 65, 85], 1);
  canvas.drawText(`Ciudad / Municipio:     ${clientCity}`, 38, 160, [51, 65, 85], 1);
  canvas.drawText(`Contacto / Telefono:    ${clientPhone}`, 360, 145, [51, 65, 85], 1);
  canvas.drawText(`Estado:                 ${quote.status || 'En preparacion'}`, 360, 160, [15, 23, 42], 1);

  // Table Header
  const tableY = 200;
  canvas.fillRect(28, tableY, width - 56, 26, 241, 245, 249);
  canvas.strokeRect(28, tableY, width - 56, 26, 203, 213, 225, 1);
  canvas.drawText('#', 38, tableY + 8, [71, 85, 105], 1);
  canvas.drawText('PRODUCTO / ACABADO SUGERIDO', 64, tableY + 8, [71, 85, 105], 1);
  canvas.drawText('PRESENTACION', 340, tableY + 8, [71, 85, 105], 1);
  canvas.drawText('CANT', 460, tableY + 8, [71, 85, 105], 1);
  canvas.drawText('SUBTOTAL COP', 510, tableY + 8, [71, 85, 105], 1);

  // Table Items Rows (up to 7 items displayed on preview)
  const items = Array.isArray(quote.items) ? quote.items : [];
  let curY = tableY + 26;
  items.slice(0, 7).forEach((it: any, idx: number) => {
    const bgRow: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    canvas.fillRect(28, curY, width - 56, 32, bgRow[0], bgRow[1], bgRow[2]);
    canvas.strokeRect(28, curY, width - 56, 32, 226, 232, 240, 1);

    canvas.drawText(String(idx + 1), 38, curY + 11, [100, 116, 139], 1);

    const prodName = String(it.productName || 'Producto Pintuco').slice(0, 36);
    canvas.drawText(prodName, 64, curY + 6, [15, 23, 42], 1);

    const colorDesc = it.colorName ? `Color: ${it.colorName}` : (it.category || 'Pinturas');
    canvas.drawText(colorDesc.slice(0, 36), 64, curY + 18, [100, 116, 139], 1);

    const pres = String(it.presentation || '1 Galon').slice(0, 16);
    canvas.drawText(pres, 340, curY + 11, [71, 85, 105], 1);

    const qty = String(it.quantity || 1);
    canvas.drawText(qty, 470, curY + 11, [15, 23, 42], 1);

    const sub = `$ ${Number(it.subtotal || 0).toLocaleString('es-CO')}`;
    canvas.drawText(sub, 510, curY + 11, [30, 58, 138], 1);

    curY += 32;
  });

  // Financial Summary Box
  const totalsY = Math.max(curY + 14, 520);
  canvas.fillRect(28, totalsY, width - 56, 150, 248, 250, 252);
  canvas.strokeRect(28, totalsY, width - 56, 150, 203, 213, 225, 1);

  canvas.drawText('RESUMEN DE LIQUIDACION COMERCIAL', 40, totalsY + 14, [71, 85, 105], 1);
  canvas.drawText(`Subtotal Estimado:            $ ${Number(quote.subtotal || 0).toLocaleString('es-CO')}`, 40, totalsY + 36, [51, 65, 85], 1);

  if (quote.discountAmount) {
    canvas.drawText(`Descuento Comercial:          - $ ${Number(quote.discountAmount).toLocaleString('es-CO')}`, 40, totalsY + 52, [5, 150, 105], 1);
  }

  const ivaText = quote.includeIva ? `$ ${Number(quote.ivaAmount || 0).toLocaleString('es-CO')}` : '$ 0';
  canvas.drawText(`IVA (19% Legal):               ${ivaText}`, 40, totalsY + 68, [51, 65, 85], 1);

  // Final Total Highlight Box
  canvas.fillRect(36, totalsY + 86, width - 72, 48, 241, 245, 249);
  canvas.strokeRect(36, totalsY + 86, width - 72, 48, 30, 58, 138, 2);
  canvas.drawText('VALOR TOTAL FINAL:', 48, totalsY + 96, [71, 85, 105], 1);
  const totalFormatted = `$ ${Number(quote.total || 0).toLocaleString('es-CO')} COP`;
  canvas.drawText(totalFormatted, 48, totalsY + 110, [15, 23, 42], 2);

  // Technical Footer Contact & Validity
  const footerY = totalsY + 160;
  canvas.fillRect(28, footerY, width - 56, 68, 255, 255, 255);
  canvas.strokeRect(28, footerY, width - 56, 68, 226, 232, 240, 1);
  canvas.drawText('CONTACTO TECNICO Y CONDICIONES COMERCIALES', 40, footerY + 12, [30, 41, 59], 1);
  canvas.drawText('Asesor Asignado: Luis Morales   |   Cel / WhatsApp: 311 856 8707', 40, footerY + 28, [71, 85, 105], 1);
  canvas.drawText('Validez de la Oferta: 30 dias calendario desde su expedicion.', 40, footerY + 42, [71, 85, 105], 1);
  canvas.drawText('Documento oficial emitido por Pintuco ColorLink Colombia.', 40, footerY + 55, [148, 163, 184], 1);

  return canvas.toPngBuffer();
}
