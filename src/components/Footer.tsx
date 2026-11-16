import React from 'react';
import { ProductCategory } from '../types';
import { Phone, Mail, MapPin, ShieldAlert, Heart } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
  onSelectCategory: (cat: ProductCategory) => void;
  onOpenGasConfig?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onSelectCategory, onOpenGasConfig }) => {
  return (
    <footer className="no-print bg-slate-900 text-white border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-amber-400 font-extrabold text-lg shadow-xs">
                PCL
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white font-display block leading-none">
                  Pintuco Color Link
                </span>
                <span className="text-[11px] text-slate-400 font-medium tracking-wide block mt-1">
                  Pinturas & Materiales de Construcción
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Plataforma líder para cotización y especificación de pinturas vinílicas, esmaltes,
              recubrimientos epóxicos industriales, estucos e impermeabilizantes en Colombia.
            </p>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>PBX Nacional: (601) 745-9000 · WhatsApp: 311 856 8707</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>ventas@pintucocolorlink.com.co</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Bogotá D.C. · Cobertura nacional</span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Navegación
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('inicio')}
                  className="hover:text-white transition-colors"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('soluciones')}
                  className="hover:text-white transition-colors text-amber-300 font-semibold"
                >
                  Módulos de Solución
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('paletas')}
                  className="hover:text-white transition-colors text-blue-300 font-semibold"
                >
                  Paletas & Combinador de Color
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('catalogo')}
                  className="hover:text-white transition-colors"
                >
                  Catálogo de Productos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('calculadora')}
                  className="hover:text-white transition-colors"
                >
                  Calculadora de m²
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('cotizador')}
                  className="hover:text-white transition-colors"
                >
                  Cotizador en Línea
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('historial')}
                  className="hover:text-white transition-colors"
                >
                  Mis Cotizaciones
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('inventario')}
                  className="hover:text-white transition-colors"
                >
                  Panel de Inventario
                </button>
              </li>
              {onOpenGasConfig && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenGasConfig}
                    className="hover:text-amber-300 transition-colors text-amber-400 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Prueba Notificaciones (Admin)</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Categorías */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Líneas de Producto
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('HOGAR');
                    onSelectTab('catalogo');
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Hogar & Interiores
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('CONSTRUCCIÓN');
                    onSelectTab('catalogo');
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Construcción & Obra
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('INDUSTRIAL');
                    onSelectTab('catalogo');
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Industrial & Mantenimiento
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('AUTOMOTRIZ');
                    onSelectTab('catalogo');
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Repintado Automotriz
                </button>
              </li>
            </ul>
          </div>

          {/* Support / Academic */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Aviso Demostrativo
            </h3>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-[11px] text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Ejercicio Académico</span>
              </div>
              Pintuco Color Link es un portal demostrativo desarrollado para Google AI Studio. Precios y datos simulados en Pesos Colombianos (COP).
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Pintuco Color Link. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            <span>Diseñado con precisión para el mercado colombiano</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
