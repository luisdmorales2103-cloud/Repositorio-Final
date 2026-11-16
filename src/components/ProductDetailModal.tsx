import React, { useState } from 'react';
import { Product, ProductPresentation } from '../types';
import { formatCOP } from '../utils/formatters';
import { PaintVisualizer } from './PaintVisualizer';
import { X, CheckCircle2, ShieldCheck, Sparkles, Layers, Clock, Plus, Minus, ShoppingBag } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToQuote: (product: Product, presentation: ProductPresentation, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToQuote,
}) => {
  if (!product) return null;

  const [selectedPresIndex, setSelectedPresIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const selectedPresentation = product.presentations[selectedPresIndex] || product.presentations[0];
  const totalPrice = selectedPresentation.price * quantity;

  const handleAdd = () => {
    onAddToQuote(product, selectedPresentation, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-blue-700">{product.category}</span>
            <span>·</span>
            <span>{product.subcategory}</span>
            <span>·</span>
            <span className="font-mono text-slate-400">SKU: {product.sku}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Visual & Color Spec */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
              <PaintVisualizer product={product} size="lg" />
            </div>

            {/* Color Spec Box */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Especificación del Acabado
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Color:</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: product.colorHex }}
                    />
                    {product.colorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Acabado:</span>
                  <span className="font-medium text-slate-800">{product.finish}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uso:</span>
                  <span className="font-medium text-slate-800">{product.usage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rendimiento:</span>
                  <span className="font-medium text-slate-800">{product.rendimientoText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Disponibilidad:</span>
                  <span className="font-medium text-emerald-700">{product.stock} unidades en bodega</span>
                </div>
              </div>
            </div>

            {/* Academic Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] text-amber-900 leading-relaxed">
              <span className="font-semibold block mb-0.5">Aviso Académico:</span>
              Precios y especificaciones demostrativos para ejercicio académico de Pintuco Color Link.
            </div>
          </div>

          {/* Right Column: Descriptions, Modes, Presentations, Purchase Module */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 font-display">
                  {product.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Surface & Application */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                  <span className="font-semibold text-blue-900 block mb-1">Superficie recomendada:</span>
                  <span className="text-slate-700">{product.surface}</span>
                </div>
                <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-900 block mb-1">Herramientas de aplicación:</span>
                  <span className="text-slate-700">{product.application}</span>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Beneficios Principales
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {product.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Modo de Uso */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Modo de Uso y Aplicación
                </h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-800">1. Preparación: </span>
                    {product.usageMode.preparation}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">2. Aplicación: </span>
                    {product.usageMode.application}
                  </div>
                  <div className="flex items-center gap-1 text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-semibold">Secado: </span>
                    <span>{product.usageMode.drying}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase & Quote Selection Module */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              {/* Presentation Choices */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Selecciona la presentación:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {product.presentations.map((pres, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPresIndex(idx)}
                      className={`p-2 rounded-lg text-left border transition-all text-xs ${
                        selectedPresIndex === idx
                          ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-semibold ring-1 ring-blue-600'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate font-medium">{pres.name}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                        {formatCOP(pres.price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity and Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Total estimado:</span>
                    <span className="text-xl font-bold text-slate-900 tabular-nums">
                      {formatCOP(totalPrice)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Disminuir"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 text-sm font-semibold text-slate-900 tabular-nums min-w-[2.5rem] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Aumentar"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={addedSuccess}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold shadow-xs transition-all ${
                    addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Agregado a la cotización!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Agregar a Cotización</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
