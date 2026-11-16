export type ProductCategory = 'HOGAR' | 'INDUSTRIAL' | 'CONSTRUCCIÓN' | 'AUTOMOTRIZ';

export interface ProductPresentation {
  name: string;
  price: number;
  volumeInGallons?: number;
  weightKg?: number;
}

export interface ProductUsageMode {
  preparation: string;
  application: string;
  drying: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  application: string;
  surface: string;
  colorName: string;
  colorHex: string;
  surfaceTag?: string;
  finish: string;
  usage: 'Interior' | 'Exterior' | 'Interior / Exterior';
  presentations: ProductPresentation[];
  rendimiento: number; // m² por galón o kg a 2 manos
  rendimientoText: string;
  unit: string;
  stock: number;
  image?: string;
  benefits: string[];
  usageMode: ProductUsageMode;
  featured?: boolean;
}

export interface QuoteItem {
  id: string; // unique item id in quote
  productId: string;
  sku: string;
  productName: string;
  category: ProductCategory;
  presentation: string;
  unitPrice: number;
  quantity: number;
  colorName: string;
  colorHex: string;
  surfaceTag?: string; // e.g. 'Pared Principal', 'Pared de Acento', 'Techo', 'Zócalos'
  subtotal: number;
}

export type ClientRole = 'Particular' | 'Pintor / Contratista' | 'Empresa / Constructora' | 'Asesor Pintuco';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber?: string;
  city: string;
  address?: string;
  role: ClientRole;
  rol: 'admin' | 'cliente';
  createdAt: string;
}

export interface CustomerInfo {
  name: string;
  idNumber: string; // NIT o Cédula
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
}

export type QuoteStatus = 'Borrador' | 'Enviada' | 'Aprobada' | 'Rechazada' | 'En preparación';

export type OrderStatus =
  | 'Pendiente de Confirmación de Pago'
  | 'Pago Confirmado'
  | 'En Preparación / Bodega'
  | 'En Ruta de Entrega'
  | 'Entregado'
  | 'Cancelado / Rechazado';

export interface OrderConfirmation {
  orderNumber: string;
  quoteNumber: string;
  quoteId: string;
  cliente_id?: string;
  cliente_email?: string;
  cliente_nombre?: string;
  total: number;
  paymentMethod: string;
  paymentReference: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryDate: string;
  deliveryNotes?: string;
  items: QuoteItem[];
  customer: CustomerInfo;
  createdAt: string;
  status: OrderStatus;
}

export interface Quote {
  id: string;
  proyecto_id?: string;
  cliente_id?: string;
  cliente_email?: string;
  quoteNumber: string;
  date: string; // ISO
  formattedDate: string;
  customer: CustomerInfo;
  items: QuoteItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  includeIva: boolean;
  ivaRate: number;
  ivaAmount: number;
  total: number;
  status: QuoteStatus;
  validityDays: number;
  notes?: string;
  order?: OrderConfirmation;
  emailStatus?: 'Pendiente' | 'Enviando' | 'Enviado' | 'Error';
  emailStatusMessage?: string;
  pdfUrl?: string;
}


export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  category: 'Neutro' | 'Cálido' | 'Frío' | 'Tierra' | 'Acento' | 'Pastel';
  description?: string;
}

export interface ColorPalette {
  id: string;
  title: string;
  category: string;
  description: string;
  roomType: 'living' | 'bedroom' | 'facade' | 'office';
  colors: {
    mainWall: ColorSwatch;
    accentWall: ColorSwatch;
    ceiling: ColorSwatch;
    trim: ColorSwatch;
  };
}

export interface EmailNotificationLog {
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
  recipient: string;
  subject: string;
  status: 'EXITOSO' | 'FALLIDO';
  provider: 'GOOGLE_APPS_SCRIPT';
  referenceId?: string;
  errorMessage?: string;
  previewUrl?: string;
  responsePayload?: any;
  gasTipo?: 'prueba' | 'registro' | 'cotizacion' | 'compra' | 'estado';
}

export interface EmailProviderStatus {
  activeProvider: string;
  adminEmail: string;
  googleAppsScriptConfigured: boolean;
  mailSecretConfigured?: boolean;
  gasUrlMasked?: string;
  totalSent: number;
}
