import React, { useState } from 'react';
import { Product, ProductPresentation } from '../types';
import { SOLUTION_MODULES, ProjectSolution, SolutionModule } from '../data/solutions';
import { formatCOP } from '../utils/formatters';
import { ArrowRight, Check, Plus, Minus, Layers, Sparkles, ShoppingBag, Eye } from 'lucide-react';

interface SolutionsModuleViewProps {
  products: Product[];
  onAddToQuote: (product: Product, presentation: ProductPresentation, quantity: number) => void;
  onNavigateToQuote: () => void;
  onViewProductDetails: (product: Product) => void;
  initialModuleId?: string;
}

export const SolutionsModuleView: React.FC<SolutionsModuleViewProps> = ({
  products,
  onAddToQuote,
  onNavigateToQuote,
  onViewProductDetails,
  initialModuleId = 'mod-construccion',
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(initialModuleId);
  const [customizingSolutionId, setCustomizingSolutionId] = useState<string | null>(null);
  const [customQuantities, setCustomQuantities] = useState<Record<string, Record<string, number>>>({});
  const [addedSolutionId, setAddedSolutionId] = useState<string | null>(null);

  const activeModule = SOLUTION_MODULES.find((m) => m.id === selectedModuleId) || SOLUTION_MODULES[0];

  // Helper to find product and its presentation
  const getProductAndPres = (productId: string, presName: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return null;
    const presentation = product.presentations.find(
      (pr) => pr.name.toLowerCase() === presName.toLowerCase()
    ) || product.presentations[0];
    return { product, presentation };
  };

  // Calculate solution cost
  const getSolutionCost = (solution: ProjectSolution) => {
    return solution.items.reduce((total, item) => {
      const match = getProductAndPres(item.productId, item.presentationName);
      if (!match) return total;
      const solCustom = customQuantities[solution.id] || {};
      const qty = solCustom[item.productId] !== undefined ? solCustom[item.productId] : item.defaultQty;
      return total + match.presentation.price * qty;
    }, 0);
  };

  const handleUpdateItemQty = (solutionId: string, productId: string, delta: number) => {
    setCustomQuantities((prev) => {
      const solPrev = prev[solutionId] || {};
      const current = solPrev[productId] !== undefined
        ? solPrev[productId]
        : (activeModule.solutions.find((s) => s.id === solutionId)?.items.find((i) => i.productId === productId)?.defaultQty || 1);
      const newQty = Math.max(1, current + delta);
      return {
        ...prev,
        [solutionId]: {
          ...solPrev,
          [productId]: newQty,
        },
      };
    });
  };

  const handleAddEntireSolution = (solution: ProjectSolution) => {
    const solCustom = customQuantities[solution.id] || {};
    let addedCount = 0;

    solution.items.forEach((item) => {
      const match = getProductAndPres(item.productId, item.presentationName);
      if (match) {
        const qty = solCustom[item.productId] !== undefined ? solCustom[item.productId] : item.defaultQty;
        if (qty > 0) {
          onAddToQuote(match.product, match.presentation, qty);
          addedCount += qty;
        }
      }
    });

    if (addedCount > 0) {
      setAddedSolutionId(solution.id);
      setTimeout(() => setAddedSolutionId(null), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-600 mb-3 uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Módulos de Solución & Cotización Integral</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
          Soluciones por Tipo de Proyecto
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Selecciona tu segmento para descubrir combos y soluciones de obra completas.
          Cotiza el paquete completo con un solo clic o ajusta las cantidades a la medida de tu proyecto.
        </p>
      </div>

      {/* Visual Module Cards (Exact visual style inspired by user's screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SOLUTION_MODULES.map((module) => {
          const isSelected = selectedModuleId === module.id;
          return (
            <div
              key={module.id}
              onClick={() => setSelectedModuleId(module.id)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 ring-2 ring-amber-500 shadow-xl shadow-slate-900/20 translate-y-[-2px]'
                  : 'bg-slate-900/95 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              {/* Image banner with dark pill tag on top-left */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
                <img
                  src={module.image}
                  alt={module.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Tag pill in top left */}
                <div className="absolute top-3.5 left-3.5 bg-black/65 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-bold tracking-wider text-white uppercase shadow-sm">
                  {module.tag}
                </div>
              </div>

              {/* Bottom content bar inside card */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-slate-900">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white text-base sm:text-lg font-bold tracking-tight truncate group-hover:text-amber-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {module.subtitle}
                  </p>
                </div>

                {/* Round arrow button on the right */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 shadow-md ${
                    isSelected
                      ? 'bg-orange-500 text-white scale-105'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-orange-500 group-hover:text-white'
                  }`}
                >
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Module Detail & Solution Packages */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Module Subtitle & Description */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 tracking-wider uppercase mb-1">
              <span>MÓDULO ACTIVO</span>
              <span>·</span>
              <span>{activeModule.tag}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-display">
              {activeModule.title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
              {activeModule.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium">
              Mostrando {activeModule.solutions.length} soluciones listas para cotizar
            </span>
          </div>
        </div>

        {/* 4 Solutions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {activeModule.solutions.map((solution, idx) => {
            const cost = getSolutionCost(solution);
            const isCustomizing = customizingSolutionId === solution.id;
            const isAdded = addedSolutionId === solution.id;
            const solCustom = customQuantities[solution.id] || {};

            return (
              <div
                key={solution.id}
                className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-600 transition-colors shadow-lg"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                        {solution.level}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-900/60 px-2.5 py-0.5 rounded-full border border-slate-700">
                      {solution.targetArea}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-white leading-snug">
                    {solution.name}
                  </h4>
                  <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                    {solution.tagline}
                  </p>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {solution.description}
                  </p>

                  {/* Solution Benefits */}
                  <ul className="mt-3.5 space-y-1 text-xs text-slate-400 border-t border-slate-700/60 pt-3">
                    {solution.benefits.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold text-xs">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Included Products List */}
                  <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                      <span>Productos incluidos en la solución:</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomizingSolutionId(isCustomizing ? null : solution.id)
                        }
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline"
                      >
                        {isCustomizing ? 'Cerrar ajuste' : 'Personalizar cantidades'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {solution.items.map((item) => {
                        const match = getProductAndPres(item.productId, item.presentationName);
                        if (!match) return null;
                        const qty = solCustom[item.productId] !== undefined
                          ? solCustom[item.productId]
                          : item.defaultQty;

                        return (
                          <div
                            key={item.productId}
                            className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-3 h-3 rounded-full border border-slate-500 shrink-0"
                                style={{ backgroundColor: match.product.colorHex }}
                              />
                              <div className="truncate">
                                <span className="font-semibold text-white truncate block">
                                  {match.product.name}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {item.presentationName} · {formatCOP(match.presentation.price)} c/u
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls (Default or Customizable) */}
                            {isCustomizing ? (
                              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-600 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(solution.id, item.productId, -1)}
                                  className="p-1 text-slate-400 hover:text-white"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-1.5 font-bold tabular-nums text-white text-xs">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(solution.id, item.productId, 1)}
                                  className="p-1 text-slate-400 hover:text-white"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-right shrink-0">
                                <span className="font-bold text-white tabular-nums">
                                  x {qty}
                                </span>
                                <span className="text-[11px] text-slate-400 block tabular-nums">
                                  {formatCOP(match.presentation.price * qty)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer with Total Cost and Add to Quote Button */}
                <div className="mt-5 pt-4 border-t border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      Total Solución Estimada:
                    </span>
                    <span className="text-xl font-bold text-amber-400 tabular-nums">
                      {formatCOP(cost)} COP
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddEntireSolution(solution)}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-orange-500 hover:bg-orange-400 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>¡Agregado a Cotización!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Cotizar esta Solución</span>
                        </>
                      )}
                    </button>

                    {isAdded && (
                      <button
                        type="button"
                        onClick={onNavigateToQuote}
                        className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                        title="Ir a cotizar"
                      >
                        Ver Cotización
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
