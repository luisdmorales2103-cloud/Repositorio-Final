import React, { useState } from 'react';
import { Product, Quote, UserProfile, ProductPresentation } from '../types';
import { formatCOP } from '../utils/formatters';
import { isMasterAdminEmail } from '../utils/auth';
import {
  Boxes,
  FileCheck2,
  TrendingUp,
  AlertTriangle,
  Search,
  Edit3,
  X,
  Check,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  quotes: Quote[];
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onViewProductDetails: (product: Product) => void;
  onUpdateProduct?: (
    productId: string,
    newStock: number,
    updatedPresentations: ProductPresentation[]
  ) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  quotes,
  currentUser,
  onOpenAuth,
  onViewProductDetails,
  onUpdateProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'VERDE' | 'AMARILLO' | 'ROJO'>('TODOS');

  // Admin edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editPresentations, setEditPresentations] = useState<ProductPresentation[]>([]);

  // Strict Access Control: Exclusive to authenticated master administrators
  const isAuthorizedAdmin =
    currentUser?.rol === 'admin' &&
    Boolean(currentUser?.email && isMasterAdminEmail(currentUser.email));

  if (!isAuthorizedAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-6 shadow-xs">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight">
            Acceso Restringido
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            El módulo de control de existencias, semáforo de stock y precios de bodega está reservado exclusivamente para el personal técnico y comercial autorizado.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth?.('login')}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth?.('register')}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-colors"
            >
              Crear Cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = true;

  // Metrics
  const totalProducts = products.length;
  const quotesCount = quotes.length;
  const totalQuotedValue = quotes.reduce((acc, q) => acc + q.total, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 20).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Agotado', type: 'ROJO', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (stock <= 20) return { label: 'Stock Bajo', type: 'AMARILLO', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    return { label: 'Suficiente', type: 'VERDE', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const status = getStockStatus(p.stock);
    const matchesStatus = statusFilter === 'TODOS' || status.type === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (p: Product) => {
    if (!isAdmin) return;
    setEditingProduct(p);
    setEditStock(p.stock);
    setEditPresentations(p.presentations.map((pres) => ({ ...pres })));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !onUpdateProduct) return;
    onUpdateProduct(editingProduct.id, editStock, editPresentations);
    setEditingProduct(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dashboard Top Cards */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              Panel de Control e Inventario
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Métricas comerciales y estado de existencias en tiempo real de Pintuco Color Link.
            </p>
          </div>
          {isAdmin && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-semibold w-fit">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Modo Administrador: Edición Comercial Habilitada</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Total Productos */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Total Productos</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {totalProducts}
              </span>
              <span className="text-[11px] text-slate-400 block">4 Categorías</span>
            </div>
          </div>

          {/* Card 2: Cotizaciones Realizadas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Cotizaciones Guardadas</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {quotesCount}
              </span>
              <span className="text-[11px] text-emerald-600 block">Registradas localmente</span>
            </div>
          </div>

          {/* Card 3: Valor Total Cotizado */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Total Cotizado</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums truncate block max-w-[170px]">
                {formatCOP(totalQuotedValue)}
              </span>
              <span className="text-[11px] text-slate-400 block">Pesos COP</span>
            </div>
          </div>

          {/* Card 4: Productos con Stock Bajo */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Stock Bajo / Crítico</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {lowStockCount + outOfStockCount}
              </span>
              <span className="text-[11px] text-amber-700 block">
                {lowStockCount} bajos · {outOfStockCount} agotados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Semáforo de Existencias
            </h2>
            <p className="text-xs text-slate-500">
              Verde (&gt; 20 unidades), Amarillo (1 a 20 unidades), Rojo (Agotado)
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('TODOS')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'TODOS' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('VERDE')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'VERDE' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Suficiente
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('AMARILLO')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'AMARILLO' ? 'bg-white text-amber-800 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Bajo
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ROJO')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'ROJO' ? 'bg-white text-rose-800 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Agotado
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-3 px-4 font-semibold">Código SKU</th>
                <th className="py-3 px-4 font-semibold">Nombre del Producto</th>
                <th className="py-3 px-4 font-semibold">Categoría</th>
                <th className="py-3 px-4 font-semibold text-center">Unidad Ref.</th>
                <th className="py-3 px-4 font-semibold text-center">Stock Actual</th>
                <th className="py-3 px-4 font-semibold text-center">Precio Lista Base</th>
                <th className="py-3 px-4 font-semibold text-center">Estado Semáforo</th>
                <th className="py-3 px-4 font-semibold text-right">
                  {isAdmin ? 'Gestión' : 'Detalle'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const status = getStockStatus(p.stock);
                const primaryPrice = p.presentations[0]?.price || 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {p.sku}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 max-w-[280px]">
                        {p.name}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {p.subcategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.category}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {p.unit}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 tabular-nums">
                      {p.stock}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800 tabular-nums">
                      {formatCOP(primaryPrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${status.color}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status.type === 'VERDE'
                              ? 'bg-emerald-500'
                              : status.type === 'AMARILLO'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                            title="Editar Stock y Precios (Exclusivo Administrador)"
                          >
                            <Edit3 className="w-3 h-3 text-amber-700" />
                            <span>Editar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewProductDetails(p)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Ficha Técnica
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Edit Modal */}
      {editingProduct && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block">
                  Edición Comercial de Bodega (Exclusivo Administrador)
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {editingProduct.name}
                </h3>
                <span className="text-xs text-amber-100 font-mono">
                  SKU: {editingProduct.sku}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Cantidad en Bodega (Stock de Unidades)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none tabular-nums"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  El semáforo se actualizará automáticamente según la existencia.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Precios de Lista por Presentación (COP)
                </label>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {editPresentations.map((pres, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <span className="text-xs font-medium text-slate-700 flex-1">
                        {pres.name}
                      </span>
                      <div className="w-36">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          required
                          value={pres.price}
                          onChange={(e) => {
                            const newPrice = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = [...editPresentations];
                            updated[idx] = { ...updated[idx], price: newPrice };
                            setEditPresentations(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none text-right tabular-nums bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Modificaciones</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
