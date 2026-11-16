import React, { useState } from 'react';
import { Product, ProductCategory, ProductPresentation } from '../types';
import { CATEGORY_IMAGES, CATEGORIES_WITH_SUBCATEGORIES } from '../data/products';
import { ProductCard } from './ProductCard';
import { Search, ArrowRight, Calculator, ShieldCheck, Truck, Clock, Palette } from 'lucide-react';

interface HomeViewProps {
  products: Product[];
  onSelectCategory: (category: ProductCategory) => void;
  onNavigateToCatalog: (searchQuery?: string) => void;
  onNavigateToCalculator: () => void;
  onNavigateToQuote: () => void;
  onNavigateToSolutions: (moduleId?: string) => void;
  onNavigateToPalettes?: () => void;
  onViewProductDetails: (product: Product) => void;
  onAddToQuote: (product: Product, presentation: ProductPresentation, quantity: number) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  onSelectCategory,
  onNavigateToCatalog,
  onNavigateToCalculator,
  onNavigateToQuote,
  onNavigateToSolutions,
  onNavigateToPalettes,
  onViewProductDetails,
  onAddToQuote,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const featuredProducts = products.filter((p) => p.featured).slice(0, 6);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onNavigateToCatalog(searchInput.trim());
    }
  };

  const moduleCards = [
    {
      moduleId: 'mod-construccion',
      tag: 'PROYECTOS / CONSTRUCCIÓN',
      title: 'Construcción y mantenim...',
      subtitle: '4 Soluciones Pintuco',
      image: CATEGORY_IMAGES.CONSTRUCCIÓN,
      isActive: true, // orange button like in user screenshot
    },
    {
      moduleId: 'mod-automotriz',
      tag: 'AUTOMOTRIZ',
      title: 'Automotriz',
      subtitle: '4 Soluciones Pintuco',
      image: CATEGORY_IMAGES.AUTOMOTRIZ,
      isActive: false,
    },
    {
      moduleId: 'mod-industrial',
      tag: 'INDUSTRIAL',
      title: 'Industrial',
      subtitle: '4 Soluciones Pintuco',
      image: CATEGORY_IMAGES.INDUSTRIAL,
      isActive: false,
    },
    {
      moduleId: 'mod-hogar',
      tag: 'HOGAR / RESIDENCIAL',
      title: 'Hogar y Decoración',
      subtitle: '4 Soluciones Pintuco',
      image: CATEGORY_IMAGES.HOGAR,
      isActive: false,
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 sm:py-24">
        {/* Architectural Background Image with dark gradient scrim for 4.5:1 text contrast */}
        <div className="absolute inset-0 z-0">
          <img
            src={CATEGORY_IMAGES.HERO}
            alt="Pintuco Color Link instalaciones y acabados"
            className="w-full h-full object-cover object-center opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Header kicker */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 mb-4 tracking-wide uppercase">
              <span>PINTUCO COLOR LINK</span>
              <span aria-hidden="true">·</span>
              <span>CALIDAD PROFESIONAL PARA TU PROYECTO</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display text-white text-balance leading-tight">
              Encuentra la solución ideal para cada espacio
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Explora pinturas, recubrimientos, impermeabilizantes y productos para construcción.
              Calcula cuánto necesitas y genera tu cotización al instante.
            </p>

            {/* Quick Search Form */}
            <form onSubmit={handleSearchSubmit} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="¿Qué producto estás buscando?"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 rounded-xl text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-400 shadow-lg font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Buscar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Hero CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateToCatalog()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
              >
                VER PRODUCTOS
              </button>
              <button
                type="button"
                onClick={onNavigateToQuote}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm rounded-xl transition-all backdrop-blur-xs cursor-pointer"
              >
                COTIZAR AHORA
              </button>
              {onNavigateToPalettes && (
                <button
                  type="button"
                  onClick={onNavigateToPalettes}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                  <span>COMBINAR COLORES</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Garantía de Calidad</div>
              <div className="text-[11px] text-slate-500">Resinas y pigmentos de máxima pureza</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Cálculo de Pintura Preciso</div>
              <div className="text-[11px] text-slate-500">Optimiza galones según tus m² reales</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Despachos Nacionales</div>
              <div className="text-[11px] text-slate-500">Envíos a obra en principales ciudades</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Cotización Inmediata</div>
              <div className="text-[11px] text-slate-500">Descarga PDF o envía por WhatsApp</div>
            </div>
          </div>
        </div>
      </section>

      {/* Segment / Solutions Modules Grid (Design inspired by reference) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
              Soluciones & Paquetes de Cotización
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 font-display">
              Módulos de Solución por Proyecto
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSolutions()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Ver todos los módulos y combos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {moduleCards.map((card) => (
            <div
              key={card.moduleId}
              onClick={() => onNavigateToSolutions(card.moduleId)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-md hover:shadow-xl hover:translate-y-[-2px] flex flex-col justify-between"
            >
              {/* Image banner with dark pill tag on top-left */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-85"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

                {/* Tag pill in top left */}
                <div className="absolute top-3.5 left-3.5 bg-black/65 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-bold tracking-wider text-white uppercase shadow-sm">
                  {card.tag}
                </div>
              </div>

              {/* Bottom bar */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-slate-900">
                <div className="min-w-0 flex-1">
                  <h3 className="text-white text-base sm:text-lg font-bold tracking-tight truncate group-hover:text-amber-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {card.subtitle}
                  </p>
                </div>

                {/* Round arrow button on the right */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 shadow-md ${
                    card.isActive
                      ? 'bg-orange-500 text-white scale-105'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-orange-500 group-hover:text-white'
                  }`}
                >
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
              Recomendados para Obra y Hogar
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 font-display">
              Productos Destacados
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToCatalog()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Ver los 32+ productos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewProductDetails}
              onAddToQuote={onAddToQuote}
            />
          ))}
        </div>
      </section>

      {/* Interactive Paint Calculator Promotion Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-bold mb-4">
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculadora Inteligente de Pintura</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">
              ¿No sabes cuántos galones necesitas para tu pared?
            </h2>

            <p className="mt-4 text-sm sm:text-base text-blue-100 leading-relaxed">
              Ingresa el ancho y alto de tus paredes, descuenta puertas y ventanas,
              y nuestro algoritmo calculará exactamente los litros y galones necesarios según el rendimiento oficial de cada pintura.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={onNavigateToCalculator}
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
              >
                Abrir Calculadora de Pintura
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
