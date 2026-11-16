import React, { useState } from 'react';
import { Product, ProductPresentation } from '../types';
import { Calculator, Check, ShoppingBag, Sparkles, HelpCircle } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

interface PaintCalculatorProps {
  products: Product[];
  onAddToQuote: (product: Product, presentation: ProductPresentation, quantity: number) => void;
  onNavigateToQuote: () => void;
}

export const PaintCalculator: React.FC<PaintCalculatorProps> = ({
  products,
  onAddToQuote,
  onNavigateToQuote,
}) => {
  // Paintable products (Hogar / Industrial paints)
  const paintProducts = products.filter((p) => p.category === 'HOGAR' || p.category === 'INDUSTRIAL');
  const defaultProduct = paintProducts[0] || products[0];

  // Form Inputs
  const [selectedProductId, setSelectedProductId] = useState<string>(defaultProduct?.id || '');
  const [wallWidth, setWallWidth] = useState<number>(4);
  const [wallHeight, setWallHeight] = useState<number>(2.5);
  const [wallsCount, setWallsCount] = useState<number>(4);
  const [doorsCount, setDoorsCount] = useState<number>(1);
  const [windowsCount, setWindowsCount] = useState<number>(2);
  const [coatsCount, setCoatsCount] = useState<number>(2);
  const [customYield, setCustomYield] = useState<number>(defaultProduct?.rendimiento || 40);
  const [addedToast, setAddedToast] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || defaultProduct;

  // Handle product change
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod && prod.rendimiento > 0) {
      setCustomYield(prod.rendimiento);
    }
  };

  // Standard constants:
  // Standard interior door: 0.9m x 2.0m = 1.8 m²
  // Standard window: 1.2m x 1.25m = 1.5 m²
  const DOOR_AREA = 1.8;
  const WINDOW_AREA = 1.5;
  const LITERS_PER_GALLON = 3.785;

  // Calculations
  const grossArea = Math.max(0, wallWidth * wallHeight * wallsCount);
  const doorsArea = doorsCount * DOOR_AREA;
  const windowsArea = windowsCount * WINDOW_AREA;
  const openingsArea = doorsArea + windowsArea;
  const netArea = Math.max(0, grossArea - openingsArea);

  // Yield calculation:
  // Yield in products is defined in m²/gallon at 2 coats.
  // If product yield is Y m²/gal for 2 coats, then 1 gal does (Y * 2 / coats) m² at `coatsCount`.
  // Yield per liter at 1 coat = (yield / LITERS_PER_GALLON) * (2 coats reference)
  // Formula given in brief:
  // Litros necesarios = (Área neta × número de manos) / rendimiento_en_m2_por_litro_a_1_mano
  // Here customYield is given in m²/gal for 2 hands (standard Colombian commercial spec),
  // which equals (customYield / 2) m²/gal for 1 hand = (customYield / (2 * 3.785)) m²/liter per hand.
  // Therefore:
  const yieldPerLiterPerCoat = Math.max(0.1, (customYield * 2) / (2 * LITERS_PER_GALLON)); 
  const totalLitersRequired = (netArea * coatsCount) / yieldPerLiterPerCoat;
  const gallonsFloat = totalLitersRequired / LITERS_PER_GALLON;
  const gallonsRecommended = Math.ceil(gallonsFloat);

  // Find 1 gal presentation of the selected product
  const gallonPresentation =
    selectedProduct.presentations.find(
      (p) => p.name.toLowerCase().includes('1 gal') || p.volumeInGallons === 1
    ) || selectedProduct.presentations[0];

  const estimatedCost = gallonPresentation ? gallonPresentation.price * gallonsRecommended : 0;

  const handleAddRecommendedToQuote = () => {
    if (!selectedProduct || !gallonPresentation) return;
    onAddToQuote(selectedProduct, gallonPresentation, gallonsRecommended);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/70 border border-amber-200/80 rounded-full text-xs font-semibold text-amber-900 mb-3">
          <Calculator className="w-3.5 h-3.5 text-amber-600" />
          <span>Herramienta Profesional de Estimación</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
          ¿Cuánta pintura necesitas?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Calcula la cantidad exacta de pintura para tu proyecto en metros cuadrados,
          descontando puertas y ventanas para optimizar tu presupuesto sin desperdicios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Calculation Inputs */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>1. Dimensiones y Aberturas</span>
            <span className="text-xs font-normal text-slate-500">Unidades en metros (m)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wall Width */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ancho de la pared (metros)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step="0.1"
                  value={wallWidth}
                  onChange={(e) => setWallWidth(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none tabular-nums"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">m</span>
              </div>
            </div>

            {/* Wall Height */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alto de la pared (metros)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step="0.1"
                  value={wallHeight}
                  onChange={(e) => setWallHeight(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none tabular-nums"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">m</span>
              </div>
            </div>

            {/* Walls Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Número de paredes similares
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={wallsCount}
                onChange={(e) => setWallsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none tabular-nums"
              />
            </div>

            {/* Coats Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Número de manos de pintura
              </label>
              <select
                value={coatsCount}
                onChange={(e) => setCoatsCount(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white font-medium"
              >
                <option value={1}>1 mano (Retoque ligero)</option>
                <option value={2}>2 manos (Recomendado estándar)</option>
                <option value={3}>3 manos (Cambio drástico de tono)</option>
              </select>
            </div>

            {/* Doors Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Número de puertas (resta 1.8 m² c/u)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={doorsCount}
                onChange={(e) => setDoorsCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none tabular-nums"
              />
            </div>

            {/* Windows Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Número de ventanas (resta 1.5 m² c/u)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={windowsCount}
                onChange={(e) => setWindowsCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none tabular-nums"
              />
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 mt-6 mb-4 pb-3 border-b border-slate-100">
            2. Selección de Producto y Rendimiento
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pintura o recubrimiento a calcular:
              </label>
              <select
                value={selectedProductId}
                onChange={handleProductChange}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white font-medium"
              >
                {paintProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ({p.rendimientoText})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Rendimiento de ficha técnica:
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {customYield} m² / galón a 2 manos
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Calculated Results & Direct Action */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg border border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Resultado del Cálculo
              </div>
              <span className="text-[11px] text-slate-400">Algoritmo Pintuco Color Link</span>
            </div>

            {/* Primary Metrics */}
            <div className="mt-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300">Área bruta total:</span>
                <span className="text-sm font-semibold tabular-nums text-slate-200">
                  {grossArea.toFixed(1)} m²
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs text-slate-400">
                <span>Descuento aberturas ({doorsCount} puertas + {windowsCount} ventanas):</span>
                <span className="tabular-nums">- {openingsArea.toFixed(1)} m²</span>
              </div>

              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">Área real a pintar:</span>
                  <span className="text-2xl font-black text-white tabular-nums">
                    {netArea.toFixed(1)} m²
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-300 block">Pintura requerida:</span>
                  <span className="text-2xl font-black text-amber-400 tabular-nums">
                    {totalLitersRequired.toFixed(1)} L
                  </span>
                </div>
              </div>

              {/* Gallons Recommendation Box */}
              <div className="p-4 bg-blue-900/50 rounded-xl border border-blue-600/40 text-center">
                <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold block mb-1">
                  Recomendación comercial en galones:
                </span>
                <div className="text-4xl font-extrabold text-white tabular-nums tracking-tight">
                  {gallonsRecommended} <span className="text-lg font-normal text-blue-200">{gallonsRecommended === 1 ? 'galón' : 'galones'}</span>
                </div>
                <div className="mt-2 text-xs text-blue-200/80">
                  Calculado para {coatsCount} {coatsCount === 1 ? 'mano' : 'manos'} de acabado uniforme.
                </div>
              </div>

              {/* Product and Cost Preview */}
              <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block truncate max-w-[200px]">
                    {selectedProduct.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {gallonsRecommended} x {formatCOP(gallonPresentation.price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Inversión estimada:</span>
                  <span className="text-base font-bold text-amber-300 tabular-nums">
                    {formatCOP(estimatedCost)}
                  </span>
                </div>
              </div>

              {/* Action Button: Add Recommended To Quote */}
              <button
                type="button"
                onClick={handleAddRecommendedToQuote}
                className="w-full mt-4 py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {addedToast ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-800" />
                    <span className="text-emerald-950">¡Agregado a la Cotización!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Agregar Producto Recomendado a la Cotización</span>
                  </>
                )}
              </button>

              {/* Shortcut to view quote if items added */}
              {addedToast && (
                <button
                  type="button"
                  onClick={onNavigateToQuote}
                  className="w-full text-center text-xs text-blue-300 hover:text-white underline transition-colors pt-1"
                >
                  Ir al Cotizador para revisar y generar documento →
                </button>
              )}
            </div>
          </div>

          {/* Quick Academic Footnote */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-normal flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              El rendimiento práctico puede variar ligeramente según la rugosidad, absorción de la superficie y método de aplicación empleado.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
