import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Database,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface AdminDwAuthGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const ADMIN_DW_PASSWORD = '8085';

export const AdminDwAuthGate: React.FC<AdminDwAuthGateProps> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanInput = password.trim();

    if (!cleanInput) {
      setError('Por favor ingresa la contraseña de administrador.');
      return;
    }

    if (cleanInput === ADMIN_DW_PASSWORD) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 350);
    } else {
      setError('Contraseña de administrador incorrecta. Acceso restringido.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header with Dark Corporate Gradient */}
          <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-7 relative">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Lock className="w-3.5 h-3.5" />
                <span>MÓDULO ADMINISTRATIVO PRIVADO</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-blue-300">
                PIN: 8085
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white font-display tracking-tight leading-tight">
                  Data Warehouse BI
                </h2>
                <p className="text-xs text-blue-200/90 font-medium">
                  Portal Corporativo & Analítica Técnica
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300/90 mt-3 leading-relaxed">
              El acceso a este módulo está restringido exclusivamente a personal autorizado. Contiene esquemas de bases de datos, métricas de proyectos y trazabilidad técnica.
            </p>
          </div>

          {/* Form Body */}
          <div className="p-7">
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium flex items-start gap-2.5 animate-in shake duration-200">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Acceso Denegado</p>
                  <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">Acceso Autorizado</p>
                  <p className="text-[11px] text-emerald-700">Cargando Data Warehouse BI...</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Contraseña de Administrador *</span>
                  <span className="text-[11px] font-normal text-slate-400">Código de 4 dígitos</span>
                </label>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    ref={inputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ingresa la contraseña de admin (8085)"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 text-sm font-mono tracking-wider focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick PIN Buttons for ease of use */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">
                    Clave administrativa configurada:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('8085');
                      setError(null);
                      inputRef.current?.focus();
                    }}
                    className="text-[11px] font-mono font-bold text-blue-700 hover:text-blue-900 bg-blue-100/70 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Usar clave: 8085
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSuccess}
                className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 active:scale-98 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Desbloquear e Ingresar al Módulo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Back button */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Inicio</span>
              </button>

              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Sesión privada protegida</span>
              </span>
            </div>
          </div>
        </div>

        {/* Security explanation note */}
        <p className="text-center text-[11px] text-slate-500 mt-4">
          Pintuco ColorLink • Sistema de Seguridad y Control de Acceso Empresarial
        </p>
      </div>
    </div>
  );
};
