import React, { useState } from 'react';
import { QuoteItem, CustomerInfo, UserProfile } from '../types';
import { formatCOP } from '../utils/formatters';
import { Trash2, Plus, Minus, FileText, ArrowRight, ShoppingCart, Percent, AlertCircle, UserCheck, RotateCcw } from 'lucide-react';

interface QuoteBuilderProps {
  items: QuoteItem[];
  customer: CustomerInfo;
  discountPercent: number;
  includeIva: boolean;
  currentUser?: UserProfile | null;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateCustomer: (field: keyof CustomerInfo, value: string) => void;
  onUpdateDiscount: (percent: number) => void;
  onToggleIva: (include: boolean) => void;
  onGenerateQuote: () => void;
  onGoToCatalog: () => void;
  onClearQuote?: () => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  items,
  customer,
  discountPercent,
  includeIva,
  currentUser,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateCustomer,
  onUpdateDiscount,
  onToggleIva,
  onGenerateQuote,
  onGoToCatalog,
  onClearQuote,
}) => {
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const handleAutofillProfile = () => {
    if (!currentUser) return;
    onUpdateCustomer('name', currentUser.name);
    onUpdateCustomer('phone', currentUser.phone);
    onUpdateCustomer('email', currentUser.email);
    if (currentUser.idNumber) onUpdateCustomer('idNumber', currentUser.idNumber);
    if (currentUser.city) onUpdateCustomer('city', currentUser.city);
    if (currentUser.address) onUpdateCustomer('address', currentUser.address);
  };

  // Financial calculations
  const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const ivaRate = 0.19;
  const ivaAmount = includeIva ? Math.round(subtotalAfterDiscount * ivaRate) : 0;
  const total = subtotalAfterDiscount + ivaAmount;

  const validateAndGenerate = () => {
    const errors: { name?: string; phone?: string; email?: string } = {};

    if (!customer.name.trim()) {
      errors.name = 'El nombre o razón social es obligatorio';
    }

    if (!customer.phone.trim()) {
      errors.phone = 'El teléfono o celular de contacto es obligatorio';
    }

    if (!customer.email.trim()) {
      errors.email = 'El correo electrónico es obligatorio para registrar y enviarte la cotización';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer.email.trim())) {
        errors.email = 'Ingrese un formato de correo electrónico válido (ej: cliente@correo.com)';
      }
    }

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      onGenerateQuote();
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">
          Tu cotización está vacía
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Explora nuestro catálogo de pinturas, estucos, impermeabilizantes y recubrimientos para agregar productos.
        </p>
        <button
          type="button"
          onClick={onGoToCatalog}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
        >
          <span>Ir al Catálogo de Productos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
            Módulo de Cotización
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Revisa productos, ajusta cantidades y diligencia los datos del cliente para generar la cotización.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && onClearQuote && (
            <button
              type="button"
              onClick={onClearQuote}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Vaciar todos los productos y datos para empezar una cotización limpia"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Cotización</span>
            </button>
          )}
          <button
            type="button"
            onClick={onGoToCatalog}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors w-fit cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Más Productos</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items Table + Customer Form */}
        <div className="lg:col-span-8 space-y-8">
          {/* Items Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Productos a Cotizar ({items.length})
              </h2>
              <span className="text-xs text-slate-500">
                Moneda: Pesos Colombianos (COP)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                    <th className="py-3 px-4 font-semibold">Código</th>
                    <th className="py-3 px-4 font-semibold">Producto</th>
                    <th className="py-3 px-4 font-semibold">Presentación</th>
                    <th className="py-3 px-4 font-semibold text-right">Precio Unit.</th>
                    <th className="py-3 px-4 font-semibold text-center">Cantidad</th>
                    <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
                    <th className="py-3 px-4 font-semibold text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 max-w-[260px]">
                          {item.productName}
                        </div>
                        {item.colorName && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700 mt-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80 w-fit">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span className="font-bold text-slate-900">{item.colorName}</span>
                            <span className="font-mono text-slate-400 text-[10px]">({item.colorHex})</span>
                            {item.surfaceTag && (
                              <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[9px] font-bold rounded">
                                {item.surfaceTag}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {item.presentation}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700 tabular-nums">
                        {formatCOP(item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1 border border-slate-300 rounded-lg p-0.5 bg-white w-fit mx-auto">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Disminuir"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              onUpdateQuantity(item.id, isNaN(val) || val < 1 ? 1 : val);
                            }}
                            className="w-9 text-center text-xs font-semibold tabular-nums outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Aumentar"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatCOP(item.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Data Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Datos del Cliente / Empresa</span>
              <span className="text-xs text-slate-500 font-normal">
                * Campos obligatorios
              </span>
            </h2>

            {/* Autofill from active user session */}
            {currentUser && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="text-blue-900">
                    Sesión activa como <strong>{currentUser.name}</strong> ({currentUser.email})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillProfile}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  Usar mis datos
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Nombre o Razón Social */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Constructora Andina S.A.S o Carlos Gómez"
                  value={customer.name}
                  onChange={(e) => onUpdateCustomer('name', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm outline-none transition-all ${
                    formErrors.name
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* NIT o Cédula */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIT / Cédula
                </label>
                <input
                  type="text"
                  placeholder="Ej: 900123456-7"
                  maxLength={12}
                  value={customer.idNumber}
                  onChange={(e) => onUpdateCustomer('idNumber', e.target.value.replace(/[^0-9-]/g, '').slice(0, 12))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                />
              </div>

              {/* Nombre de Contacto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de Contacto
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ing. Laura Mendoza"
                  value={customer.contactPerson}
                  onChange={(e) => onUpdateCustomer('contactPerson', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono / Celular *
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 3104567890"
                  maxLength={10}
                  value={customer.phone}
                  onChange={(e) => onUpdateCustomer('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm outline-none transition-all ${
                    formErrors.phone
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
                  }`}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.phone}
                  </p>
                )}
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico * <span className="font-normal text-slate-500">(Para envío automático)</span>
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={customer.email}
                  onChange={(e) => onUpdateCustomer('email', e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm outline-none transition-all ${
                    formErrors.email
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ciudad
                </label>
                <select
                  value={customer.city}
                  onChange={(e) => onUpdateCustomer('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white"
                >
                  <option value="">Seleccionar ciudad...</option>
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Bucaramanga">Bucaramanga</option>
                  <option value="Cartagena">Cartagena</option>
                  <option value="Pereira">Pereira</option>
                  <option value="Manizales">Manizales</option>
                  <option value="Ibagué">Ibagué</option>
                  <option value="Santa Marta">Santa Marta</option>
                  <option value="Cúcuta">Cúcuta</option>
                  <option value="Otra ciudad">Otra ciudad</option>
                </select>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección de Entrega / Obra
                </label>
                <input
                  type="text"
                  placeholder="Ej: Calle 100 # 15-20 Obra Torre 2"
                  value={customer.address}
                  onChange={(e) => onUpdateCustomer('address', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                />
              </div>

              {/* Observaciones */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones o Condiciones Especiales
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de entrega, tono exacto de color, requerimiento de certificado de calidad, etc."
                  value={customer.notes}
                  onChange={(e) => onUpdateCustomer('notes', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Summary & Big Action */}
        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Resumen Financiero</span>
              <span className="text-xs text-slate-400">COP</span>
            </h3>

            <div className="space-y-4 mt-4 text-xs">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal general:</span>
                <span className="font-semibold text-slate-900 tabular-nums text-sm">
                  {formatCOP(subtotal)}
                </span>
              </div>

              {/* Descuento % */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-blue-600" />
                    Descuento comercial:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={discountPercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateDiscount(isNaN(val) ? 0 : Math.min(50, Math.max(0, val)));
                      }}
                      className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center font-bold text-slate-900 tabular-nums outline-none"
                    />
                    <span className="font-bold text-slate-500">%</span>
                  </div>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium pt-1 border-t border-slate-200/60">
                    <span>Ahorro en descuento:</span>
                    <span className="tabular-nums">- {formatCOP(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* IVA Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    Aplicar IVA (19%)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Configurable para el ejercicio
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeIva}
                    onChange={(e) => onToggleIva(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {includeIva && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Monto IVA (19%):</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatCOP(ivaAmount)}
                  </span>
                </div>
              )}

              {/* Final Total */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-bold text-slate-900">Total a Pagar:</span>
                  <span className="text-2xl font-black text-blue-900 tabular-nums font-display">
                    {formatCOP(total)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block text-right">
                  Pesos Colombianos (COP)
                </span>
              </div>
            </div>

            {/* Big Generate Quote Button */}
            <button
              type="button"
              onClick={validateAndGenerate}
              className="w-full mt-6 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <FileText className="w-5 h-5 text-amber-300" />
              <span>GENERAR COTIZACIÓN</span>
            </button>

            <p className="text-[11px] text-slate-400 text-center mt-3">
              Generará la hoja oficial para impresión, PDF o compartir por WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
