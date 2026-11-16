import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2, ShieldAlert, Bot } from 'lucide-react';

interface ContactViewProps {
  onOpenChatbot?: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onOpenChatbot }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Bogotá D.C.',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Automatically reset inputs on tab change / unmount
  useEffect(() => {
    return () => {
      setFormData({ name: '', phone: '', email: '', city: 'Bogotá D.C.', message: '' });
      setSubmitted(false);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.phone) {
      setSubmitted(true);
      // Immediately reset fields so no residual data lingers
      setFormData({ name: '', phone: '', email: '', city: 'Bogotá D.C.', message: '' });
      setTimeout(() => {
        setSubmitted(false);
      }, 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
          Atención al Cliente & Asesoría Técnica
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">
          Contáctanos en Colombia
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Nuestros expertos en recubrimientos y especificación para obra están listos para asesorarte en tu cotización.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Canales de Atención
            </h2>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Línea Nacional PBX</div>
                <div className="text-sm font-semibold text-blue-700 tabular-nums">(601) 745-9000</div>
                <div className="text-[11px] text-slate-400">Atención técnica y cotizaciones</div>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">WhatsApp Comercial</div>
                <a
                  href="https://wa.me/573118568707"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline tabular-nums"
                >
                  +57 311 856 8707
                </a>
                <div className="text-[11px] text-slate-400">Cotizaciones y fichas en línea</div>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900">Asistente Técnico & Asesores Especialistas</div>
                <div className="text-[11px] text-slate-500 mb-1">
                  Ing. Luis Morales e Ing. Juan Romero (Rendimientos, secado, preparación de superficie).
                </div>
                {onOpenChatbot && (
                  <button
                    type="button"
                    onClick={onOpenChatbot}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Abrir Chat Asistente Técnico Virtual</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Correo Electrónico</div>
                <div className="text-xs font-semibold text-slate-800">ventas@pintucocolorlink.com.co</div>
                <div className="text-[11px] text-slate-400">Licitaciones y ventas corporativas</div>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Horarios de Operación</div>
                <div className="text-xs text-slate-700">Lunes a Viernes: 7:30 a.m. – 5:30 p.m.</div>
                <div className="text-xs text-slate-700">Sábados: 8:00 a.m. – 1:00 p.m.</div>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Centro de Distribución Principal</div>
                <div className="text-xs text-slate-700">Calle 100 # 19-61, Edificio Quantum</div>
                <div className="text-xs text-slate-500">Bogotá D.C., Colombia</div>
              </div>
            </div>
          </div>

          {/* Academic Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Ejercicio Demostrativo</span>
              Pintuco Color Link es un portal conceptual desarrollado para fines académicos de demostración.
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Advisory Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4">
            Envíanos un mensaje o solicitud de cotización especial
          </h2>

          {submitted ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">¡Mensaje Enviado con Éxito!</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Hemos recibido tus datos correctamente. Un asesor técnico de Pintuco Color Link se comunicará contigo.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre o empresa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    placeholder="Ej: 3101234567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@correo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ciudad del Proyecto
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white font-medium"
                >
                  <option value="Bogotá D.C.">Bogotá D.C.</option>
                  <option value="Medellín">Medellín</option>
                  <option value="Cali">Cali</option>
                  <option value="Barranquilla">Barranquilla</option>
                  <option value="Bucaramanga">Bucaramanga</option>
                  <option value="Cartagena">Cartagena</option>
                  <option value="Pereira">Pereira</option>
                  <option value="Otra ciudad">Otra ciudad</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensaje o Consulta Técnica
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe qué superficie vas a pintar, metros cuadrados aproximados o productos requeridos..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Solicitud de Asesoría</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
