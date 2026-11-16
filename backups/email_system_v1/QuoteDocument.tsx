import React, { useState, useEffect } from 'react';
import { Quote, QuoteStatus, UserProfile } from '../types';
import { formatCOP, formatSpanishDate, generateWhatsAppUrl } from '../utils/formatters';
import { generateQuotePdf } from '../utils/generateQuotePdf';
import {
  Printer,
  Share2,
  Save,
  PlusCircle,
  ArrowLeft,
  Check,
  ShieldAlert,
  ShoppingBag,
  Mail,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { OrderConfirmation } from '../types';
import { sendQuoteNotificationApi } from '../services/notificationService';

interface QuoteDocumentProps {
  quote: Quote;
  currentUser?: UserProfile | null;
  onSaveQuote: (quote: Quote) => void;
  onNewQuote: () => void;
  onBackToEditor: () => void;
  onUpdateStatus?: (status: QuoteStatus) => void;
  onOrderConfirmed?: (order: OrderConfirmation) => void;
  onRequireAuth?: (message: string) => void;
  autoOpenCheckout?: boolean;
  onResetAutoOpenCheckout?: () => void;
}

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({
  quote,
  currentUser,
  onSaveQuote,
  onNewQuote,
  onBackToEditor,
  onUpdateStatus,
  onOrderConfirmed,
  onRequireAuth,
  autoOpenCheckout,
  onResetAutoOpenCheckout,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<QuoteStatus>(quote.status || 'Borrador');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Email Notification Delivery State (4 states: Pendiente, Enviando, Enviado, Error)
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'Pendiente' | 'Enviando' | 'Enviado' | 'Error'>(
    quote.emailStatus || 'Pendiente'
  );
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(
    quote.emailStatusMessage || null
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEmailPromptOpen, setIsEmailPromptOpen] = useState(false);
  const [promptEmailValue, setPromptEmailValue] = useState(
    quote.customer?.email || quote.cliente_email || ''
  );
  const [promptEmailError, setPromptEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (quote.emailStatus) {
      setEmailDeliveryStatus(quote.emailStatus);
    }
    if (quote.emailStatusMessage) {
      setEmailStatusMessage(quote.emailStatusMessage);
    }
    setPromptEmailValue(quote.customer?.email || quote.cliente_email || '');
  }, [quote]);

  // Handler to dispatch email via backend and Google Apps Script
  const handleSendEmail = async (overrideEmail?: string) => {
    const targetEmail = (
      overrideEmail ||
      quote.customer?.email ||
      quote.cliente_email ||
      currentUser?.email ||
      ''
    ).trim().toLowerCase();

    // Requirement 3: If client email is missing, ask for it
    if (!targetEmail) {
      setPromptEmailValue('');
      setPromptEmailError(null);
      setIsEmailPromptOpen(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setPromptEmailValue(targetEmail);
      setPromptEmailError('Por favor ingresa un correo electrónico válido (ej: cliente@correo.com)');
      setIsEmailPromptOpen(true);
      return;
    }

    const updatedQuote: Quote = {
      ...quote,
      cliente_email: targetEmail,
      customer: {
        ...quote.customer,
        email: targetEmail,
      },
      emailStatus: 'Enviando',
    };

    setIsSendingEmail(true);
    setEmailDeliveryStatus('Enviando');
    setEmailStatusMessage(`Enviando notificación oficial a ${targetEmail}...`);

    try {
      const res = await sendQuoteNotificationApi(updatedQuote);
      if (res.success && res.results?.ok !== false) {
        const successMsg = `Cotización enviada exitosamente a ${targetEmail}`;
        setEmailDeliveryStatus('Enviado');
        setEmailStatusMessage(successMsg);
        const finalQuote: Quote = {
          ...updatedQuote,
          emailStatus: 'Enviado',
          emailStatusMessage: successMsg,
        };
        onSaveQuote(finalQuote);
      } else {
        const errorDetail = res.message || res.results?.error || 'No se recibió respuesta ok: true de Google Apps Script';
        setEmailDeliveryStatus('Error');
        setEmailStatusMessage(errorDetail);
        const finalQuote: Quote = {
          ...updatedQuote,
          emailStatus: 'Error',
          emailStatusMessage: errorDetail,
        };
        onSaveQuote(finalQuote);
      }
    } catch (err: any) {
      const errorDetail = err?.message || 'Error de conexión con el servidor backend';
      setEmailDeliveryStatus('Error');
      setEmailStatusMessage(errorDetail);
    } finally {
      setIsSendingEmail(false);
      setIsEmailPromptOpen(false);
    }
  };

  // If user authenticated through checkout prompt, immediately open checkout with ready data
  useEffect(() => {
    if (autoOpenCheckout) {
      setIsCheckoutOpen(true);
      onResetAutoOpenCheckout?.();
    }
  }, [autoOpenCheckout, onResetAutoOpenCheckout]);

  // Strict Protection: Anonymous visitors cannot proceed to checkout
  const handleProceedToCheckout = () => {
    if (!currentUser) {
      onRequireAuth?.(
        'Debes iniciar sesión o registrarte como cliente para formalizar tu compra y programar el despacho.'
      );
      return;
    }
    setIsCheckoutOpen(true);
  };


  const handlePrint = () => {
    try {
      setIsGeneratingPdf(true);
      generateQuotePdf(quote);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 1500);
    }
  };

  const handleSave = () => {
    const updated = { ...quote, status: currentStatus };
    onSaveQuote(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleStatusChange = (status: QuoteStatus) => {
    setCurrentStatus(status);
    if (onUpdateStatus) {
      onUpdateStatus(status);
    }
  };

  const whatsappUrl = generateWhatsAppUrl(quote);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Action Bar (Hidden during print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToEditor}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Modificar Items / Datos</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector (Admin only) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="font-medium">Estado:</span>
            {currentUser?.rol === 'admin' ? (
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="En preparación">En preparación</option>
                <option value="Borrador">Borrador</option>
                <option value="Enviada">Enviada</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
            ) : (
              <span className="font-semibold text-slate-800">{currentStatus}</span>
            )}
          </div>

          {/* WhatsApp Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir WhatsApp</span>
          </a>

          {/* Print / Save PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Descargando PDF...' : 'Imprimir / Guardar PDF'}</span>
          </button>

          {/* Botón Visible: Enviar cotización por correo (Req. 6, 8, 9) */}
          <button
            type="button"
            onClick={() => handleSendEmail()}
            disabled={isSendingEmail}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
              emailDeliveryStatus === 'Enviado'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : emailDeliveryStatus === 'Error'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : emailDeliveryStatus === 'Enviando'
                ? 'bg-blue-600 text-white opacity-80 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title="Enviar esta cotización oficial al correo del cliente mediante Google Apps Script"
          >
            {emailDeliveryStatus === 'Enviando' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : emailDeliveryStatus === 'Enviado' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Enviada ✓</span>
              </>
            ) : emailDeliveryStatus === 'Error' ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-200" />
                <span>Reintentar Correo</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5 text-amber-300" />
                <span>Enviar cotización por correo</span>
              </>
            )}
          </button>

          {/* Buy Now / Checkout Academic Button */}
          <button
            type="button"
            onClick={handleProceedToCheckout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
            title="Formalizar pedido y compra en ambiente sandbox"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Proceder a la Compra</span>
          </button>


          {/* Save locally */}
          <button
            type="button"
            onClick={handleSave}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Guardada!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cotización</span>
              </>
            )}
          </button>

          {/* New Quote button */}
          <button
            type="button"
            onClick={onNewQuote}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-slate-400" />
            <span>Nueva</span>
          </button>
        </div>
      </div>

      {/* Indicador de Estado de Entrega por Correo (Req. 8, 9) */}
      <div className="no-print mb-6">
        {emailDeliveryStatus === 'Enviando' && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900 animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <span>
                <strong>Estado: Enviando</strong> — Notificando al cliente (
                {quote.customer?.email || quote.cliente_email || 'correo registrado'}) mediante Google Apps Script...
              </span>
            </div>
          </div>
        )}

        {emailDeliveryStatus === 'Enviado' && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Estado: Enviado con éxito</span>
                <span className="mx-1.5">•</span>
                <span>
                  Confirmación oficial entregada a{' '}
                  <strong className="underline">{quote.customer?.email || quote.cliente_email}</strong> vía Google Apps Script (ok: true).
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSendEmail()}
              disabled={isSendingEmail}
              className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer shrink-0"
            >
              Reenviar copia
            </button>
          </div>
        )}

        {emailDeliveryStatus === 'Error' && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Estado: Error en entrega de correo</span>
                <p className="mt-0.5 text-rose-800 font-mono text-[11px]">
                  {emailStatusMessage || 'Google Apps Script no respondió con ok: true'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSendEmail()}
              disabled={isSendingEmail}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
            >
              Reintentar Envío
            </button>
          </div>
        )}

        {emailDeliveryStatus === 'Pendiente' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Estado del Correo: Pendiente</strong> — Pulsa <em>"Enviar cotización por correo"</em> para despacharla a{' '}
                <strong className="text-slate-800">{quote.customer?.email || quote.cliente_email || 'la dirección del cliente'}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSendEmail()}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer shrink-0"
            >
              Enviar ahora
            </button>
          </div>
        )}
      </div>

      {/* Official Printable Quotation Document Paper */}
      <div className="printable-quote bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-12 text-slate-900 transition-all">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-amber-400 font-extrabold text-lg shadow-xs">
                PCL
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 font-display">
                  PINTUCO COLOR LINK
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Pinturas, Recubrimientos & Materiales de Construcción
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600 space-y-0.5">
              <p>NIT: 901.845.220-4 (Demostrativo)</p>
              <p>Línea / WhatsApp: 311 856 8707 · Bogotá D.C., Colombia</p>
              <p>ventas@pintucocolorlink.com.co</p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-xl w-full sm:w-auto border sm:border-0 border-slate-100">
            <span className="text-xs uppercase tracking-widest text-blue-700 font-bold block mb-1">
              DOCUMENTO COMERCIAL
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {quote.quoteNumber}
            </div>
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <p>
                <span className="font-semibold text-slate-700">Fecha de expedición: </span>
                {formatSpanishDate(quote.date)}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Validez comercial: </span>
                {quote.validityDays || 15} días calendario
              </p>
              <p>
                <span className="font-semibold text-slate-700">Estado: </span>
                <span className="font-bold text-blue-800">{currentStatus}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information Section */}
        <div className="my-6 p-5 rounded-xl bg-slate-50 border border-slate-300">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 border-b border-slate-200 pb-1.5">
            Datos del Cliente y Obra
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs">
            <div>
              <span className="text-slate-500 block">Razón Social / Cliente:</span>
              <span className="font-bold text-slate-900 text-sm">
                {quote.customer.name || 'Cliente Particular'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Documento (NIT/CC):</span>
              <span className="font-medium text-slate-800">
                {quote.customer.idNumber || 'Sin registrar'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Contacto Responsable:</span>
              <span className="font-medium text-slate-800">
                {quote.customer.contactPerson || quote.customer.name || 'No especificado'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Ciudad / Municipio:</span>
              <span className="font-medium text-slate-800">
                {quote.customer.city || 'Bogotá D.C.'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Celular / Teléfono:</span>
              <span className="font-medium text-slate-800">
                {quote.customer.phone || 'No especificado'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Correo Electrónico (Notificaciones):</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-slate-900 text-xs">
                  {quote.customer.email || quote.cliente_email || 'Sin registrar'}
                </span>
                {quote.customer.email || quote.cliente_email ? (
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                      emailDeliveryStatus === 'Enviado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : emailDeliveryStatus === 'Error'
                        ? 'bg-rose-100 text-rose-800'
                        : emailDeliveryStatus === 'Enviando'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {emailDeliveryStatus}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPromptEmailValue('');
                      setPromptEmailError(null);
                      setIsEmailPromptOpen(true);
                    }}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    + Registrar
                  </button>
                )}
              </div>
            </div>
            <div>
              <span className="text-slate-500 block">Tipo de Proyecto:</span>
              <span className="font-medium text-slate-800">
                {quote.items[0]?.category
                  ? `${quote.items[0].category} · Recubrimiento y Acabados`
                  : 'Mantenimiento / Obra Arquitectónica'}
              </span>
            </div>
          </div>
        </div>

        {/* Specification and Dosing Table */}
        <div className="mt-6 overflow-x-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
            Especificación y Dosificación Técnica
          </h2>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-800 bg-slate-100 font-semibold">
                <th className="py-2.5 px-3 uppercase tracking-wider text-center w-10">Ítem</th>
                <th className="py-2.5 px-3 uppercase tracking-wider">Producto / Sistema Sugerido</th>
                <th className="py-2.5 px-3 uppercase tracking-wider">Superficie</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-right">Área (m²)</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-right">Galones</th>
                <th className="py-2.5 px-3 uppercase tracking-wider">Presentación Sugerida</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {quote.items.map((item, idx) => {
                let galPerUnit = 1;
                const pLower = (item.presentation || '').toLowerCase();
                if (pLower.includes('5 gal') || pLower.includes('cuñete')) galPerUnit = 5;
                else if (pLower.includes('caneca')) galPerUnit = 4;
                else if (pLower.includes('cuarto')) galPerUnit = 0.25;
                const totGal = Number((item.quantity * galPerUnit).toFixed(1));
                const estArea = Math.round(totGal * 25);
                const surface = item.surfaceTag || (item.category === 'INDUSTRIAL' ? 'Metálica / Epóxica' : 'Mampostería / Concreto');

                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      {item.colorName && (
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          <span>Color: <strong className="text-slate-800">{item.colorName}</strong> ({item.colorHex})</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700">{surface}</td>
                    <td className="py-3 px-3 text-right text-slate-700 tabular-nums">
                      {estArea} m²
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 tabular-nums">
                      {totGal} gal
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-medium">
                      {item.presentation} x {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-950 tabular-nums">
                      {formatCOP(item.subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Totals and Observations */}
        <div className="mt-6 pt-5 border-t border-slate-300 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Notes and Observations */}
          <div className="md:col-span-7 space-y-3">
            {quote.customer.notes && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">
                  Observaciones Técnicas / Entrega:
                </span>
                <p className="text-slate-600 whitespace-pre-wrap">{quote.customer.notes}</p>
              </div>
            )}

            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Términos y Condiciones Comerciales:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                <li>Precios referenciales para presupuestación formal en COP.</li>
                <li>Entrega en obra o dirección según programación logística.</li>
                <li>Verificar los lotes y tonalidades de color antes de su aplicación en muro.</li>
              </ul>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="md:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-300 text-xs space-y-2.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal Bruto:</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatCOP(quote.subtotal)}
              </span>
            </div>

            {quote.discountPercent > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Descuento aplicado ({quote.discountPercent}%):</span>
                <span className="font-semibold tabular-nums">
                  - {formatCOP(quote.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>
                IVA ({quote.includeIva ? `${(quote.ivaRate * 100).toFixed(0)}%` : 'No aplica'}):
              </span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {quote.includeIva ? formatCOP(quote.ivaAmount) : '$ 0'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-300 flex flex-col items-end">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                VALOR ESTIMADO REFERENCIAL / PRECIO FINAL:
              </span>
              <span className="text-2xl font-black text-slate-950 tabular-nums font-display mt-0.5">
                {formatCOP(quote.total)} COP
              </span>
            </div>

            {/* Direct Commercial Purchase Button */}
            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="no-print w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Proceder a la Compra (Sandbox)</span>
            </button>
          </div>
        </div>

        {/* Technical Contact Footer */}
        <div className="mt-8 p-4 rounded-xl border border-slate-300 bg-slate-50/80 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-slate-500 block text-[11px]">Asesor Técnico Asignado:</span>
            <span className="font-bold text-slate-900 text-sm">Luis Morales</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Línea / Celular:</span>
            <span className="font-bold text-slate-900 text-sm">311 856 8707</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Validez de la oferta:</span>
            <span className="font-bold text-slate-900 text-sm">30 días calendario</span>
          </div>
        </div>

        {/* Academic Disclaimer Banner */}
        <div className="mt-6 p-3 bg-slate-100 border border-slate-300 rounded-xl text-center text-[11px] text-slate-600">
          <div className="flex items-center justify-center gap-1.5 font-bold mb-0.5 text-slate-800">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
            <span>AVISO ACADÉMICO PINTUCO COLOR LINK</span>
          </div>
          <p>
            Esta cotización corresponde a un ejercicio académico y sus precios son demostrativos.
            No representa una transacción comercial vinculante.
          </p>
        </div>
      </div>

      {/* Checkout Academic Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        quote={quote}
        currentUser={currentUser}
        onConfirmOrder={(order) => {
          setCurrentStatus('Aprobada');
          onUpdateStatus?.('Aprobada');
          onSaveQuote({ ...quote, status: 'Aprobada', order });
          onOrderConfirmed?.(order);
        }}
      />

      {/* Modal: Solicitar Correo del Cliente si está ausente (Req. 3) */}
      {isEmailPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Destinatario de la Cotización
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailPromptOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para enviar la cotización oficial <strong className="font-mono text-blue-900">{quote.quoteNumber}</strong> con su desglose de productos, valores e IVA (19%), ingresa el correo electrónico del cliente:
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Correo Electrónico del Cliente *
              </label>
              <input
                type="email"
                autoFocus
                placeholder="cliente@ejemplo.com"
                value={promptEmailValue}
                onChange={(e) => {
                  setPromptEmailValue(e.target.value);
                  setPromptEmailError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendEmail(promptEmailValue);
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-all ${
                  promptEmailError
                    ? 'border-rose-500 bg-rose-50/40 text-rose-900'
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600'
                }`}
              />
              {promptEmailError && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {promptEmailError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEmailPromptOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSendingEmail || !promptEmailValue.trim()}
                onClick={() => handleSendEmail(promptEmailValue)}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isSendingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirmar y Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

