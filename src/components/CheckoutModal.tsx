import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ArrowRight,
  Printer,
  Sparkles,
  Lock,
  Wallet
} from 'lucide-react';
import { Quote, OrderConfirmation, UserProfile } from '../types';
import { formatCOP, formatSpanishDate } from '../utils/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  currentUser?: UserProfile | null;
  onConfirmOrder: (order: OrderConfirmation) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  quote,
  currentUser,
  onConfirmOrder,
}) => {
  // Step 1: form, Step 2: receipt
  const [step, setStep] = useState<'form' | 'receipt'>('form');
  const [isProcessing, setIsProcessing] = useState(false);

  // Delivery Data
  const [deliveryAddress, setDeliveryAddress] = useState(
    quote?.customer?.address || currentUser?.address || ''
  );
  const [deliveryCity, setDeliveryCity] = useState(
    quote?.customer?.city || currentUser?.city || 'Bogotá D.C.'
  );
  
  // Default delivery date: 3 days ahead formatted YYYY-MM-DD
  const defaultDateStr = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const [deliveryDate, setDeliveryDate] = useState(defaultDateStr);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pse' | 'transfer'>('card');

  // Card fields - clean strings by default
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(
    quote?.customer?.name || currentUser?.name || ''
  );

  // PSE fields
  const [pseBank, setPseBank] = useState('Bancolombia');
  const [psePersonType, setPsePersonType] = useState('Natural');

  // Confirmed order data
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);

  const resetCheckoutForm = () => {
    setStep('form');
    setIsProcessing(false);
    setConfirmedOrder(null);
    setDeliveryAddress(quote?.customer?.address || currentUser?.address || '');
    setDeliveryCity(quote?.customer?.city || currentUser?.city || 'Bogotá D.C.');
    setDeliveryDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
    setDeliveryNotes('');
    setPaymentMethod('card');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardHolder(quote?.customer?.name || currentUser?.name || '');
  };

  useEffect(() => {
    if (isOpen) {
      resetCheckoutForm();
    }
  }, [isOpen, quote, currentUser]);

  const handleClose = () => {
    resetCheckoutForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleFillTestCard = () => {
    setCardNumber('4532 8901 2345 6789');
    setCardExpiry('08/29');
    setCardCvv('789');
    setCardHolder(quote.customer.name || 'Cliente Evaluador Sandbox');
  };

  const handleConfirmAndPay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const orderNum = `PED-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const authRef = `AUT-SANDBOX-${Date.now().toString().slice(-6)}`;

      let methodLabel = 'Tarjeta de Crédito (Visa Sandbox)';
      if (paymentMethod === 'pse') {
        methodLabel = `PSE Débito (${pseBank})`;
      } else if (paymentMethod === 'transfer') {
        methodLabel = 'Transferencia Inmediata Bancolombia / Davivienda';
      }

      const customerName = (quote?.customer?.name || currentUser?.name || cardHolder || 'Cliente Particular').trim();
      const orderData: OrderConfirmation = {
        orderNumber: orderNum,
        quoteNumber: quote.quoteNumber,
        quoteId: quote.id,
        cliente_id: currentUser?.id || quote.cliente_id,
        cliente_email: (currentUser?.email || quote.cliente_email || quote.customer.email || '').trim().toLowerCase(),
        cliente_nombre: customerName,
        total: quote.total,
        paymentMethod: methodLabel,
        paymentReference: authRef,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCity: deliveryCity.trim(),
        deliveryDate: deliveryDate,
        deliveryNotes: deliveryNotes.trim(),
        items: [...quote.items],
        customer: {
          ...quote.customer,
          name: customerName,
          address: deliveryAddress.trim(),
          city: deliveryCity.trim(),
        },
        createdAt: new Date().toISOString(),
        status: 'Pendiente de Confirmación de Pago',
      };

      setConfirmedOrder(orderData);
      onConfirmOrder(orderData);
      setIsProcessing(false);
      setStep('receipt');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-950 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-blue-950 text-[10px] font-black uppercase tracking-wider">
              Pasarela de Pago Sandbox
            </span>
            <span className="text-[11px] text-blue-200">
              Ambiente Académico Seguro
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-display text-white">
            {step === 'form' ? 'Finalizar Compra y Despacho' : 'Recibo Comercial Oficial'}
          </h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Cotización oficial <span className="font-bold text-amber-300 font-mono">{quote.quoteNumber}</span> • Total a pagar: <strong className="text-white">{formatCOP(quote.total)}</strong>
          </p>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: CHECKOUT FORM                                         */}
        {/* ------------------------------------------------------------- */}
        {step === 'form' ? (
          <form onSubmit={handleConfirmAndPay} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Quick Summary Pill */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Productos a despachar:</span>
                <span className="font-bold text-slate-900">
                  {quote.items.length} productos ({quote.items.reduce((s, i) => s + i.quantity, 0)} unidades)
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Total con IVA:</span>
                <span className="font-extrabold text-blue-900 text-sm">{formatCOP(quote.total)}</span>
              </div>
            </div>

            {/* SECCIÓN 1: DATOS DE DESPACHO */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Datos de Despacho y Entrega
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección Exacta de Entrega *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="ej: Calle 100 # 19-61, Oficina 502"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ciudad / Municipio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bogotá D.C."
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha Estimada de Entrega *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instrucciones para el Transportista
                </label>
                <input
                  type="text"
                  placeholder="ej: Dejar en portería o contactar al maestro de obra"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            {/* SECCIÓN 2: MÉTODO DE PAGO SIMULADO */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Método de Pago Simulado
                  </h3>
                </div>
                {paymentMethod === 'card' && (
                  <button
                    type="button"
                    onClick={handleFillTestCard}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Usar tarjeta de prueba
                  </button>
                )}
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Tarjeta Débito/Crédito</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pse')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'pse'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>PSE en Línea</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'transfer'
                      ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Transferencia</span>
                </button>
              </div>

              {/* Method Details */}
              {paymentMethod === 'card' && (
                <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nombre del Titular
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Número de Tarjeta (Prueba Sandbox)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Expiración (MM/AA)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-600 font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        CVV (3 dígitos)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-600 font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'pse' && (
                <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Selecciona tu Entidad Financiera
                    </label>
                    <select
                      value={pseBank}
                      onChange={(e) => setPseBank(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                    >
                      <option value="Bancolombia">Bancolombia</option>
                      <option value="Banco de Bogotá">Banco de Bogotá</option>
                      <option value="Davivienda">Davivienda</option>
                      <option value="Nequi">Nequi</option>
                      <option value="Daviplata">Daviplata</option>
                      <option value="BBVA Colombia">BBVA Colombia</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Tipo de Persona
                      </label>
                      <select
                        value={psePersonType}
                        onChange={(e) => setPsePersonType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none"
                      >
                        <option value="Natural">Persona Natural</option>
                        <option value="Juridica">Persona Jurídica (Empresa)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Correo PSE Registrado
                      </label>
                      <input
                        type="email"
                        required
                        defaultValue={quote.customer.email || 'cliente@pse.com.co'}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Cuentas Corrientes Oficiales Pintuco:</div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                    <div>• <strong>Bancolombia:</strong> Cta Cte # 031-789456-12 (Convenio Pintuco SAS)</div>
                    <div>• <strong>Davivienda:</strong> Cta Cte # 452-987410-00</div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Al confirmar, el sistema validará automáticamente la transferencia simulada y radicará el despacho.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Procesando pago seguro en Sandbox...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar y Pagar (Ambiente Sandbox) • {formatCOP(quote.total)}</span>
                  </>
                )}
              </button>
              <div className="text-center mt-2">
                <span className="text-[10px] text-slate-400">
                  Transacción protegida por protocolo seguro SSL de 256 bits.
                </span>
              </div>
            </div>
          </form>
        ) : (
          /* ------------------------------------------------------------- */
          /* STEP 2: COMMERCIAL RECEIPT & CONFIRMATION                     */
          /* ------------------------------------------------------------- */
          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 font-display">
                ¡Orden de Compra Registrada!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Estado inicial: <strong className="text-amber-700 font-bold">«Pendiente de Confirmación de Pago»</strong>. Hemos enviado la confirmación detallada a tu correo electrónico.
              </p>
            </div>

            {/* Receipt Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs space-y-3 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Número de Pedido</span>
                  <span className="font-mono text-base font-black text-blue-900">
                    {confirmedOrder?.orderNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Radicado Técnico</span>
                  <span className="font-mono font-bold text-slate-700">{confirmedOrder?.quoteNumber}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Dirección de Despacho:</span>
                  <span className="font-bold text-slate-900">{confirmedOrder?.deliveryAddress}</span>
                  <span className="text-slate-500 block text-[11px]">{confirmedOrder?.deliveryCity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Fecha Estimada de Entrega:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {confirmedOrder?.deliveryDate ? formatSpanishDate(confirmedOrder.deliveryDate) : '3 días hábiles'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Método y Autorización:</span>
                  <span className="font-medium text-slate-800">{confirmedOrder?.paymentMethod}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Ref: {confirmedOrder?.paymentReference}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block uppercase">Monto Total Pagado:</span>
                  <span className="text-base font-black text-slate-950">
                    {confirmedOrder?.total ? formatCOP(confirmedOrder.total) : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Hemos enviado la confirmación y copia oficial de este recibo a tu correo electrónico registrado.
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Aceptar y Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
