import React, { useState } from 'react';
import { Product, ProductPresentation } from '../types';
import { formatCOP } from '../utils/formatters';
import { PaintVisualizer } from './PaintVisualizer';
import { Eye, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToQuote: (product: Product, presentation: ProductPresentation, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onAddToQuote,
}) => {
  const [selectedPresIndex, setSelectedPresIndex] = useState(0);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const selectedPresentation = product.presentations[selectedPresIndex] || product.presentations[0];
  const minPrice = Math.min(...product.presentations.map((p) => p.price));

  const handleQuickAdd = () => {
    onAddToQuote(product, selectedPresentation, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  return (
    <div className="group flex flex-col justify-between bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden">
      {/* Visual Product Showcase */}
      <div className="p-3 pb-0">
        <div
          onClick={() => onViewDetails(product)}
          className="cursor-pointer"
          title="Clic para ver ficha técnica detallada"
        >
          <PaintVisualizer product={product} size="md" />
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Unboxed Metadata (Zero-pill discipline) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-blue-700 tracking-wide">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.subcategory}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">{product.usage}</span>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onViewDetails(product)}
            className="text-base font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 cursor-pointer leading-snug min-h-[2.75rem]"
          >
            {product.name}
          </h3>

          {/* Rendimiento */}
          <p className="mt-2 text-xs text-slate-500 line-clamp-1">
            <span className="font-medium text-slate-700">Rendimiento:</span> {product.rendimientoText}
          </p>

          {/* Presentation Selector */}
          <div className="mt-3">
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Presentación:
            </label>
            <div className="grid grid-cols-2 gap-1">
              {product.presentations.map((pres, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPresIndex(idx)}
                  className={`px-2 py-1 text-xs rounded text-left transition-colors truncate border ${
                    selectedPresIndex === idx
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title={`${pres.name} - ${formatCOP(pres.price)}`}
                >
                  {pres.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing and Action Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[11px] text-slate-400 block">Precio presentación:</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {formatCOP(selectedPresentation.price)}
              </span>
            </div>
            {product.presentations.length > 1 && (
              <span className="text-[11px] text-slate-400">
                Desde {formatCOP(minPrice)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver Ficha</span>
            </button>

            <button
              type="button"
              onClick={handleQuickAdd}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cotizar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
