import React, { useState } from 'react';
import { ShoppingCart, Menu, X, Phone, User, LogIn, LogOut, ChevronDown, Mail, Database } from 'lucide-react';
import { formatCOP } from '../utils/formatters';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  cartCount: number;
  cartTotal: number;
  currentUser: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenGasConfig?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
  cartTotal,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenGasConfig,
}) => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'soluciones', label: 'Módulos de Solución' },
    { id: 'paletas', label: 'Paletas de Color' },
    { id: 'catalogo', label: 'Productos' },
    { id: 'calculadora', label: 'Calculadora' },
    { id: 'cotizador', label: 'Cotizador' },
    { id: 'historial', label: 'Mis cotizaciones' },
    { id: 'compras', label: 'Mis Compras' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'bi_dw', label: 'Data Warehouse BI' },
    { id: 'contacto', label: 'Contacto' },
  ];

  const handleNavClick = (tabId: string) => {
    if ((tabId === 'historial' || tabId === 'compras' || tabId === 'inventario') && !currentUser) {
      onOpenAuth('login');
      onSelectTab(tabId);
      setMobileMenuOpen(false);
      setUserDropdownOpen(false);
      return;
    }
    onSelectTab(tabId);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div
            onClick={() => handleNavClick('inicio')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-900 to-blue-700 flex items-center justify-center text-amber-400 font-extrabold text-lg sm:text-xl shadow-xs group-hover:scale-105 transition-transform">
              PCL
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 font-display block leading-none">
                Pintuco Color Link
              </span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide block mt-1">
                Pinturas & Materiales
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-slate-600">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`relative py-2 transition-colors cursor-pointer ${
                  currentTab === link.id
                    ? 'text-blue-900 font-bold'
                    : 'hover:text-slate-950'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <span>{link.label}</span>
                  {link.id === 'bi_dw' && (
                    <span className="text-[10px] text-amber-600" title="Módulo administrativo privado (Clave: 8085)">
                      🔒
                    </span>
                  )}
                </span>
                {currentTab === link.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 rounded-full" />
                )}
                {link.id === 'cotizador' && cartCount > 0 && (
                  <span className="ml-1.5 bg-amber-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                    {cartCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Actions (Desktop & Mobile) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* User Account / Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="font-bold text-slate-900 block leading-tight truncate max-w-[100px]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-none">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                      <div className="mt-1 inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold text-[10px]">
                        {currentUser.role} · {currentUser.city}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNavClick('historial')}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Mis Cotizaciones Guardadas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('compras')}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Mis Compras / Pedidos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('paletas')}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Simulador & Paletas de Color</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('bi_dw')}
                      className="w-full px-4 py-2 text-left text-blue-900 hover:bg-blue-50 flex items-center justify-between cursor-pointer font-bold border-t border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-amber-500" />
                        <span>Data Warehouse & BI</span>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono font-bold">DW</span>
                    </button>
                    {currentUser.rol === 'admin' && onOpenGasConfig && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenGasConfig();
                        }}
                        className="w-full px-4 py-2 text-left text-blue-700 hover:bg-blue-50 flex items-center justify-between cursor-pointer font-bold border-t border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />
                          <span>Notificaciones Correo</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </button>
                    )}
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ingresar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Crear Cuenta</span>
                </button>
              </div>
            )}

            {/* Botón de prueba exclusivo para administradores */}
            {currentUser?.rol === 'admin' && onOpenGasConfig && (
              <button
                type="button"
                onClick={onOpenGasConfig}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Panel de pruebas de Google Apps Script"
              >
                <Mail className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden lg:inline">Probar Correo</span>
              </button>
            )}

            {/* Direct Cotizador Action with live badge */}
            <button
              type="button"
              onClick={() => handleNavClick('cotizador')}
              className="relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
              title="Ver cotización actual"
            >
              <ShoppingCart className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline font-bold">Cotizador</span>
              {cartCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-1.5 py-0.5 rounded-full tabular-nums">
                  {cartCount}
                </span>
              )}
              {cartTotal > 0 && (
                <span className="hidden md:inline text-[11px] text-blue-100 font-normal pl-1 border-l border-blue-500 tabular-nums">
                  {formatCOP(cartTotal)}
                </span>
              )}
            </button>


            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-150">
          {/* User Status Bar in Mobile */}
          <div className="mb-3 pb-3 border-b border-slate-100 flex items-center justify-between">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500">{currentUser.role}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-semibold"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl"
                >
                  Crear Cuenta
                </button>
              </div>
            )}
          </div>

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                  currentTab === link.id
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{link.label}</span>
                  {link.id === 'bi_dw' && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                      🔒 Privado
                    </span>
                  )}
                </span>
                {link.id === 'cotizador' && cartCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full tabular-nums">
                    {cartCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              Cel: 311 856 8707
            </span>
            <span className="font-semibold text-slate-800">Bogotá, Colombia</span>
          </div>
        </div>
      )}
    </header>
  );
};
