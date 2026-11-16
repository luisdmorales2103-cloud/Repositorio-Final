import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, ProductPresentation } from '../types';
import { CATEGORIES_WITH_SUBCATEGORIES } from '../data/products';
import { ProductCard } from './ProductCard';
import { Search, Filter, RotateCcw, SlidersHorizontal, ShieldAlert, Sparkles } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

interface CatalogViewProps {
  products: Product[];
  initialSearch?: string;
  initialCategory?: ProductCategory | 'TODAS';
  onViewProductDetails: (product: Product) => void;
  onAddToQuote: (product: Product, presentation: ProductPresentation, quantity: number) => void;
  onNavigateToCalculator: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  initialSearch = '',
  initialCategory = 'TODAS',
  onViewProductDetails,
  onAddToQuote,
  onNavigateToCalculator,
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'TODAS'>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('TODAS');
  const [selectedUsage, setSelectedUsage] = useState<string>('TODOS');
  const [selectedSurface, setSelectedSurface] = useState<string>('TODAS');
  const [selectedPresentation, setSelectedPresentation] = useState<string>('TODAS');
  const [maxPrice, setMaxPrice] = useState<number>(1500000);
  const [selectedColor, setSelectedColor] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('name-asc');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Derived lists for filter options
  const subcategoriesForSelectedCategory = useMemo(() => {
    if (selectedCategory === 'TODAS') {
      return Array.from(new Set(products.map((p) => p.subcategory)));
    }
    return CATEGORIES_WITH_SUBCATEGORIES[selectedCategory] || [];
  }, [selectedCategory, products]);

  const uniqueSurfaces = useMemo(() => {
    const list = ['Concreto / Mampostería', 'Drywall / Yeso', 'Metal / Acero', 'Madera', 'Fachada exterior', 'Pisos'];
    return list;
  }, []);

  const uniquePresentations = useMemo(() => {
    return ['1/4 galón', '1 galón', '2.5 galones', '5 galones', '6 kg', '15 kg', '30 kg'];
  }, []);

  const uniqueColors = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.colorName))).slice(0, 12);
  }, [products]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('TODAS');
    setSelectedSubcategory('TODAS');
    setSelectedUsage('TODOS');
    setSelectedSurface('TODAS');
    setSelectedPresentation('TODAS');
    setMaxPrice(1500000);
    setSelectedColor('TODOS');
    setSortBy('name-asc');
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search term
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchQuery =
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.colorName.toLowerCase().includes(query) ||
            p.subcategory.toLowerCase().includes(query);
          if (!matchQuery) return false;
        }

        // Category
        if (selectedCategory !== 'TODAS' && p.category !== selectedCategory) {
          return false;
        }

        // Subcategory
        if (selectedSubcategory !== 'TODAS' && p.subcategory !== selectedSubcategory) {
          return false;
        }

        // Usage (Interior / Exterior)
        if (selectedUsage !== 'TODOS') {
          if (selectedUsage === 'Interior' && p.usage === 'Exterior') return false;
          if (selectedUsage === 'Exterior' && p.usage === 'Interior') return false;
        }

        // Surface keyword
        if (selectedSurface !== 'TODAS') {
          const surfaceKeywords: Record<string, string[]> = {
            'Concreto / Mampostería': ['concreto', 'mampostería', 'revoque', 'pañete'],
            'Drywall / Yeso': ['drywall', 'yeso', 'placa'],
            'Metal / Acero': ['metal', 'hierro', 'acero', 'galvanizad'],
            'Madera': ['madera', 'mdf'],
            'Fachada exterior': ['fachada', 'exterior'],
            'Pisos': ['piso', 'cancha', 'pavimento'],
          };
          const words = surfaceKeywords[selectedSurface] || [selectedSurface.toLowerCase()];
          const hasMatch = words.some((w) => p.surface.toLowerCase().includes(w));
          if (!hasMatch) return false;
        }

        // Presentation
        if (selectedPresentation !== 'TODAS') {
          const hasPres = p.presentations.some((pres) =>
            pres.name.toLowerCase().includes(selectedPresentation.toLowerCase())
          );
          if (!hasPres) return false;
        }

        // Color
        if (selectedColor !== 'TODOS' && p.colorName !== selectedColor) {
          return false;
        }

        // Max price
        const minProductPrice = Math.min(...p.presentations.map((pr) => pr.price));
        if (minProductPrice > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const minA = Math.min(...a.presentations.map((pr) => pr.price));
        const minB = Math.min(...b.presentations.map((pr) => pr.price));

        switch (sortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name, 'es');
          case 'name-desc':
            return b.name.localeCompare(a.name, 'es');
          case 'price-asc':
            return minA - minB;
          case 'price-desc':
            return minB - minA;
          default:
            return 0;
        }
      });
  }, [
    products,
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    selectedUsage,
    selectedSurface,
    selectedPresentation,
    selectedColor,
    maxPrice,
    sortBy,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Disclaimer */}
      <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-blue-900 font-medium">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong className="font-semibold">Precios demostrativos para ejercicio académico.</strong> Todos los cálculos se efectúan en Pesos Colombianos (COP).
          </span>
        </div>
        <button
          type="button"
          onClick={onNavigateToCalculator}
          className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 hover:underline shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>¿No sabes cuántos galones comprar? Usa la Calculadora →</span>
        </button>
      </div>

      {/* Main Search and Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Real-time search bar */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="¿Qué producto estás buscando? (ej: vinilo, estuco, epóxico, sellador...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort & Mobile Filters Toggle */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filtros</span>
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs cursor-pointer"
            >
              <option value="name-asc">Nombre (A - Z)</option>
              <option value="name-desc">Nombre (Z - A)</option>
              <option value="price-asc">Precio menor a mayor</option>
              <option value="price-desc">Precio mayor a menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Categories Tab Bar (Segmented clean buttons) */}
      <div className="flex items-center gap-2 pb-4 overflow-x-auto border-b border-slate-200/80 mb-6 scrollbar-none">
        {(['TODAS', 'HOGAR', 'CONSTRUCCIÓN', 'INDUSTRIAL', 'AUTOMOTRIZ'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedSubcategory('TODAS');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {cat === 'TODAS' ? 'Todos los Productos' : cat}
          </button>
        ))}
      </div>

      {/* Grid Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Filter Sidebar */}
        <aside
          className={`lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Filtros de Búsqueda</span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>

          {/* Subcategoría */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Subcategoría
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="TODAS">Todas las subcategorías</option>
              {subcategoriesForSelectedCategory.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Uso (Interior / Exterior) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Ambiente / Uso
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              {['TODOS', 'Interior', 'Exterior'].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setSelectedUsage(u)}
                  className={`py-1.5 rounded-md transition-colors ${
                    selectedUsage === u
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Superficie recomendada */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Superficie
            </label>
            <select
              value={selectedSurface}
              onChange={(e) => setSelectedSurface(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="TODAS">Todas las superficies</option>
              {uniqueSurfaces.map((surf) => (
                <option key={surf} value={surf}>
                  {surf}
                </option>
              ))}
            </select>
          </div>

          {/* Presentación */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Presentación
            </label>
            <select
              value={selectedPresentation}
              onChange={(e) => setSelectedPresentation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            >
              <option value="TODAS">Cualquier presentación</option>
              {uniquePresentations.map((pres) => (
                <option key={pres} value={pres}>
                  {pres}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de Precio Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Precio Máximo
              </label>
              <span className="text-xs font-bold text-blue-700 tabular-nums">
                {formatCOP(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={25000}
              max={1500000}
              step={25000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>$ 25.000</span>
              <span>$ 1.500.000</span>
            </div>
          </div>

          {/* Color Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
              Tono de Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedColor('TODOS')}
                className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                  selectedColor === 'TODOS'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Todos
              </button>
              {uniqueColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`px-2 py-1 text-[11px] rounded border transition-colors truncate max-w-[120px] ${
                    selectedColor === c
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                  title={c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Column: Products Grid */}
        <main className="lg:col-span-9">
          {/* Active Filter Summary Bar */}
          <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
            <span>
              Mostrando <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> productos
              {selectedCategory !== 'TODAS' && ` en ${selectedCategory}`}
              {searchTerm && ` para "${searchTerm}"`}
            </span>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display">
                No se encontraron productos coincidentes
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                No hay resultados para los filtros seleccionados o el término de búsqueda actual.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewDetails={onViewProductDetails}
                  onAddToQuote={onAddToQuote}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
