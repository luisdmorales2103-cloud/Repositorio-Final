import React, { useState } from 'react';
import { Quote, QuoteStatus, UserProfile } from '../types';
import { formatCOP, formatSpanishDate } from '../utils/formatters';
import { isMasterAdminEmail } from '../utils/auth';
import { Search, Eye, Copy, Trash2, Printer, FileText, ArrowRight, Lock, ShoppingBag, RefreshCw, Mail } from 'lucide-react';


interface QuotesHistoryProps {
  quotes: Quote[];
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onViewQuote: (quote: Quote) => void;
  onDuplicateQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
  onUpdateStatus: (quoteId: string, newStatus: QuoteStatus) => void;
  onGoToCatalog: () => void;
  onRefreshQuotes?: () => void;
  isRefreshing?: boolean;
  onOpenGasConfig?: () => void;
}

export const QuotesHistory: React.FC<QuotesHistoryProps> = ({
  quotes,
  currentUser,
  onOpenAuth,
  onViewQuote,
  onDuplicateQuote,
  onDeleteQuote,
  onUpdateStatus,
  onGoToCatalog,
  onRefreshQuotes,
  isRefreshing = false,
  onOpenGasConfig,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // If user is not authenticated, block table access and show elegant lock screen
  if (!currentUser) {
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
            Para consultar tus radicados, proyectos y trazabilidad técnica en tiempo real, inicia sesión o regístrate como cliente nuevo.
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

  const isAdmin = currentUser.rol === 'admin' && isMasterAdminEmail(currentUser.email);

  // Strict dynamic filtering by user role:
  // Admins: see all quotes for auditing and commercial management.
  // Clients: strictly see only their own quotes (matching cliente_id or cliente_email).
  const userQuotes = isAdmin
    ? quotes
    : quotes.filter(
        (quote) =>
          Boolean(quote.cliente_id && quote.cliente_id === currentUser.id) ||
          Boolean(quote.cliente_email && quote.cliente_email.toLowerCase() === currentUser.email.toLowerCase()) ||
          Boolean(quote.customer?.email && quote.customer.email.toLowerCase() === currentUser.email.toLowerCase())
      );

  // Filter quotes by search and status
  const filteredQuotes = userQuotes.filter((q) => {
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.formattedDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customer.phone && q.customer.phone.includes(searchTerm));

    const matchesStatus = statusFilter === 'TODOS' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyle = (status: QuoteStatus) => {
    switch (status) {
      case 'En preparación':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Aprobada':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Enviada':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Rechazada':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Borrador':
      default:
        return 'text-slate-700 bg-slate-100 border-slate-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
            Mis Cotizaciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Historial de propuestas comerciales sincronizadas con Supabase (tabla <span className="font-mono text-slate-700">proyecto</span>) y respaldo seguro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefreshQuotes && (
            <button
              type="button"
              onClick={onRefreshQuotes}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Sincronizar y consultar cotizaciones recientes desde la nube"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isRefreshing ? 'Sincronizando...' : 'Actualizar'}</span>
            </button>
          )}
          {isAdmin && onOpenGasConfig && (
            <button
              type="button"
              onClick={onOpenGasConfig}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Configurar recepción automática de cotizaciones por correo (Google Apps Script)"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notificaciones Correo</span>
            </button>
          )}
          <button
            type="button"
            onClick={onGoToCatalog}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors w-fit"
          >
            <span>Nueva Cotización</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número (COT-2026-...), cliente o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs shrink-0">
          {['TODOS', 'En preparación', 'Borrador', 'Enviada', 'Aprobada', 'Rechazada'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchTerm || statusFilter !== 'TODOS'
              ? 'No se encontraron cotizaciones con ese criterio'
              : 'Aún no tienes cotizaciones guardadas'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'TODOS'
              ? 'Prueba modificando los términos de búsqueda o el filtro de estado.'
              : 'Selecciona productos en el catálogo y presiona "Guardar Cotización" en el documento final.'}
          </p>
          {!searchTerm && statusFilter === 'TODOS' && (
            <button
              type="button"
              onClick={onGoToCatalog}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              <span>Explorar Catálogo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-3 px-4 font-semibold">Número</th>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Cliente</th>
                  <th className="py-3 px-4 font-semibold text-center">Items</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                  <th className="py-3 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                      {q.quoteNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatSpanishDate(q.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {q.customer.name || 'Cliente Particular'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {q.customer.phone || q.customer.city}
                      </div>
                      {(q.customer.email || q.cliente_email) && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                            {q.customer.email || q.cliente_email}
                          </span>
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                              q.emailStatus === 'Enviado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.emailStatus === 'Error'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {q.emailStatus === 'Enviado' ? '✓ Enviado' : q.emailStatus === 'Error' ? '⚠️ Error' : 'Pendiente'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-medium text-slate-700">
                        {q.items.reduce((sum, item) => sum + item.quantity, 0)} unid.
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        ({q.items.length} prod.)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap text-sm">
                      {formatCOP(q.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isAdmin ? (
                        <select
                          value={q.status}
                          onChange={(e) => onUpdateStatus(q.id, e.target.value as QuoteStatus)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-md border outline-none cursor-pointer ${getStatusBadgeStyle(
                            q.status
                          )}`}
                          title="Cambiar estado como Administrador / Asesor"
                        >
                          <option value="En preparación">En preparación</option>
                          <option value="Borrador">Borrador</option>
                          <option value="Enviada">Enviada</option>
                          <option value="Aprobada">Aprobada</option>
                          <option value="Rechazada">Rechazada</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md border ${getStatusBadgeStyle(
                            q.status
                          )}`}
                          title="Estado oficial asignado por Pintuco"
                        >
                          {q.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Comprar / Checkout */}
                        <button
                          type="button"
                          onClick={() => onViewQuote(q)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Proceder a la Compra / Checkout Sandbox"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>


                        {/* Ver Documento */}
                        <button
                          type="button"
                          onClick={() => onViewQuote(q)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver Documento"
                        >
                          <Eye className="w-4 h-4" />
                        </button>


                        {/* Duplicar */}
                        <button
                          type="button"
                          onClick={() => onDuplicateQuote(q)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Duplicar hacia el cotizador"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Imprimir */}
                        <button
                          type="button"
                          onClick={() => {
                            onViewQuote(q);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Eliminar con confirmación */}
                        {deleteConfirmId === q.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                            <span className="text-[10px] text-red-700 font-semibold px-1">
                              ¿Borrar?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteQuote(q.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] hover:bg-slate-300"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(q.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar de historial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
