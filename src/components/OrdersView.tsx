import React, { useState } from 'react';
import { OrderConfirmation, OrderStatus, UserProfile } from '../types';
import { formatCOP, formatSpanishDate } from '../utils/formatters';
import { isMasterAdminEmail } from '../utils/auth';
import {
  Search,
  Eye,
  Printer,
  PackageCheck,
  Truck,
  ArrowRight,
  Lock,
  X,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Receipt,
  ShoppingBag,
} from 'lucide-react';

interface OrdersViewProps {
  orders: OrderConfirmation[];
  currentUser?: UserProfile | null;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onUpdateOrderStatus: (orderNumber: string, newStatus: OrderStatus) => void;
  onGoToCatalog: () => void;
  onGoToQuote: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  currentUser,
  onOpenAuth,
  onUpdateOrderStatus,
  onGoToCatalog,
  onGoToQuote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<OrderConfirmation | null>(null);

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
            Para consultar tus compras, órdenes y despacho técnico en tiempo real, inicia sesión o regístrate como cliente nuevo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth?.('login')}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth?.('register')}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
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
  // Admins: see all purchases for global monitoring and dispatch management.
  // Clients: strictly see only their own personal purchases.
  const userOrders = isAdmin
    ? orders
    : orders.filter((order) => {
        const oEmail = (order.cliente_email || order.customer?.email || '').trim().toLowerCase();
        const userEmail = (currentUser.email || '').trim().toLowerCase();
        const oId = order.cliente_id;
        const userId = currentUser.id;

        return (
          Boolean(oId && userId && oId === userId) ||
          Boolean(oEmail && userEmail && oEmail === userEmail)
        );
      });

  // Filter orders by search term and status tab
  const filteredOrders = userOrders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.deliveryCity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getOrderStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Pendiente de Confirmación de Pago':
        return 'text-amber-800 bg-amber-50 border-amber-300';
      case 'Pago Confirmado':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'En Preparación / Bodega':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'En Ruta de Entrega':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'Entregado':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Cancelado / Rechazado':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-300';
    }
  };

  const handlePrintReceipt = (order: OrderConfirmation) => {
    setSelectedReceiptOrder(order);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              {isAdmin ? 'Gestión Global de Pedidos & Despachos' : 'Mis Compras & Pedidos'}
            </h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                Panel Administrador
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Control comercial y actualización de trazabilidad logística en tiempo real para todos los clientes.'
              : 'Historial de compras formalizadas, recibos de pago y trazabilidad de entrega a obra.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoToQuote}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Ver Cotizador</span>
          </button>
          <button
            type="button"
            onClick={onGoToCatalog}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <span>Explorar Catálogo</span>
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
            placeholder="Buscar por N° de pedido (PED-2026-...), cotización, dirección o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Status Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs shrink-0">
          {[
            'TODOS',
            'Pago Confirmado',
            'En Preparación / Bodega',
            'En Ruta de Entrega',
            'Entregado',
          ].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
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
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <PackageCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchTerm || statusFilter !== 'TODOS'
              ? 'No se encontraron compras con ese criterio'
              : 'Aún no tienes compras realizadas'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'TODOS'
              ? 'Prueba modificando los términos de búsqueda o el filtro de estado logístico.'
              : 'Selecciona productos en el catálogo, genera tu cotización y formaliza el pedido en el botón de Comprar.'}
          </p>
          {!searchTerm && statusFilter === 'TODOS' && (
            <button
              type="button"
              onClick={onGoToCatalog}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ir al Catálogo de Productos</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-3 px-4 font-semibold">N° de Pedido</th>
                  <th className="py-3 px-4 font-semibold">Fecha de Compra</th>
                  {isAdmin && <th className="py-3 px-4 font-semibold">Cliente</th>}
                  <th className="py-3 px-4 font-semibold">Productos / Galones</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Pagado</th>
                  <th className="py-3 px-4 font-semibold">Dirección de Entrega</th>
                  <th className="py-3 px-4 font-semibold">Fecha Estimada</th>
                  <th className="py-3 px-4 font-semibold text-center">Estado del Pedido</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => (
                  <tr key={o.orderNumber} className="hover:bg-slate-50/60 transition-colors">
                    {/* N° de Pedido */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-blue-900 text-sm">
                        {o.orderNumber}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 block">
                        Ref: {o.quoteNumber}
                      </span>
                    </td>

                    {/* Fecha de Compra */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formatSpanishDate(o.createdAt)}
                    </td>

                    {/* Cliente (Admin Only) */}
                    {isAdmin && (
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs truncate max-w-[170px]">
                          {o.cliente_nombre || o.customer?.name || 'Cliente Particular'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {o.cliente_email || o.customer?.email || 'Sin correo'}
                        </div>
                      </td>
                    )}

                    {/* Productos / Galones */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">
                        {o.items.reduce((sum, item) => sum + item.quantity, 0)} unidades
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                        {o.items[0]?.productName || 'Materiales Pintuco'}
                        {o.items.length > 1 && ` +${o.items.length - 1} más`}
                      </span>
                    </td>

                    {/* Total Pagado */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-950 tabular-nums whitespace-nowrap text-sm">
                      {formatCOP(o.total)}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {o.paymentMethod.split('(')[0].trim()}
                      </span>
                    </td>

                    {/* Dirección de Entrega */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 truncate max-w-[180px]">
                        {o.deliveryAddress}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {o.deliveryCity}
                      </div>
                    </td>

                    {/* Fecha Estimada de Despacho */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-700 font-medium flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        {o.deliveryDate ? formatSpanishDate(o.deliveryDate) : '3 días hábiles'}
                      </span>
                    </td>

                    {/* Estado del Pedido (Admin interactivo vs Cliente badge) */}
                    <td className="py-3.5 px-4 text-center">
                      {isAdmin ? (
                        <select
                          value={o.status}
                          onChange={(e) =>
                            onUpdateOrderStatus(o.orderNumber, e.target.value as OrderStatus)
                          }
                          className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors shadow-2xs ${getOrderStatusStyle(
                            o.status
                          )}`}
                          title="Cambiar estado como Administrador / Asesor"
                        >
                          <option value="Pendiente de Confirmación de Pago">Pendiente de Confirmación de Pago</option>
                          <option value="Pago Confirmado">Pago Confirmado</option>
                          <option value="En Preparación / Bodega">En Preparación / Bodega</option>
                          <option value="En Ruta de Entrega">En Ruta de Entrega</option>
                          <option value="Entregado">Entregado</option>
                          <option value="Cancelado / Rechazado">Cancelado / Rechazado</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-md border ${getOrderStatusStyle(
                            o.status
                          )}`}
                          title="Estado oficial de logística Pintuco"
                        >
                          {o.status}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(o)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver recibo oficial de compra"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(o)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Imprimir recibo oficial"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recibo Oficial Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Top Bar */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-blue-950 text-[10px] font-black uppercase tracking-wider">
                  Comprobante Oficial
                </span>
                <span className="text-[11px] text-blue-200">Pintuco Color Link</span>
              </div>
              <h2 className="text-xl font-black font-display text-white">
                Recibo de Pedido y Despacho
              </h2>
              <p className="text-xs text-blue-200 mt-0.5 font-mono">
                Orden {selectedReceiptOrder.orderNumber} • Radicado {selectedReceiptOrder.quoteNumber}
              </p>
            </div>

            {/* Receipt Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Cliente / Destinatario
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedReceiptOrder.customer.name}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    {selectedReceiptOrder.customer.email} • {selectedReceiptOrder.customer.phone}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Estado Actual
                  </span>
                  <span
                    className={`inline-block font-bold px-2 py-0.5 rounded text-[11px] border ${getOrderStatusStyle(
                      selectedReceiptOrder.status
                    )}`}
                  >
                    {selectedReceiptOrder.status}
                  </span>
                </div>
              </div>

              {/* Delivery info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">
                    Lugar de Entrega:
                  </span>
                  <span className="font-semibold text-slate-900 block">
                    {selectedReceiptOrder.deliveryAddress}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {selectedReceiptOrder.deliveryCity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">
                    Fecha Estimada de Llegada:
                  </span>
                  <span className="font-bold text-blue-900 block">
                    {selectedReceiptOrder.deliveryDate
                      ? formatSpanishDate(selectedReceiptOrder.deliveryDate)
                      : '3 días hábiles'}
                  </span>
                  <span className="text-slate-500 text-[10px] block font-mono">
                    Ref: {selectedReceiptOrder.paymentReference}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-2">
                  Detalle de Materiales Despachados
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedReceiptOrder.items.map((it) => (
                    <div key={it.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{it.productName}</span>
                        <span className="text-[11px] text-slate-500">
                          {it.presentation} • Color: {it.colorName || 'Estándar'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {it.quantity} x {formatCOP(it.unitPrice)}
                        </span>
                        <span className="font-bold text-blue-900 text-xs">
                          {formatCOP(it.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Método de Pago:</span>
                  <span className="font-medium text-slate-800">
                    {selectedReceiptOrder.paymentMethod}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase block">Total Pagado:</span>
                  <span className="text-lg font-black text-slate-950 font-display">
                    {formatCOP(selectedReceiptOrder.total)}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Comprobante</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptOrder(null)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Cerrar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
