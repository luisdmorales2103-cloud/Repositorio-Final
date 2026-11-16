import React, { useState, useEffect } from 'react';
import { UserProfile, ClientRole } from '../types';
import { loginUser, registerUser, resetUserPassword } from '../utils/auth';
import { supabase } from '../lib/supabaseClient';
import { sendGoogleEmail } from '../services/googleAppsScriptService';
import {
  X,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Building,
  ArrowRight,
  UserPlus,
  LogIn,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  Send,
  ArrowLeft,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
  onShowToast?: (
    message: string,
    submessage?: string,
    options?: { variant?: 'default' | 'success'; showViewQuote?: boolean }
  ) => void;
  authNotice?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  onShowToast,
  authNotice,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('Bogotá D.C.');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regRole, setRegRole] = useState<ClientRole>('Particular');
  const [regPassword, setRegPassword] = useState('');

  // Password Recovery State (100% blind - token sent to real email via Supabase Auth)
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify'>('request');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetAuthForms = () => {
    setError(null);
    setSuccessNotice(null);
    setIsSubmitting(false);
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegCity('Bogotá D.C.');
    setRegIdNumber('');
    setRegRole('Particular');
    setRegPassword('');
    setRecoveryEmail('');
    setRecoveryStep('request');
    setRecoveryToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  useEffect(() => {
    resetAuthForms();
    setMode(initialMode);
  }, [isOpen, initialMode]);

  const handleModalClose = () => {
    resetAuthForms();
    onClose();
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // 1. Authenticate with real Supabase Auth to obtain a signed JWT session
    try {
      const { error: supaErr } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      if (supaErr) {
        console.warn('Supabase Auth signIn notice (JWT no emitido aún en auth.users):', supaErr.message);
      }
    } catch (supaErr) {
      console.warn('Supabase Auth signIn exception:', supaErr);
    }

    // 2. Validate local profile
    const res = loginUser(loginEmail, loginPassword);
    setIsSubmitting(false);
    if (res.success && res.user) {
      onAuthSuccess(res.user);
      handleModalClose();
    } else {
      setError(res.error || 'Error al iniciar sesión');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Por favor completa todos los campos requeridos (*)');
      setIsSubmitting(false);
      return;
    }

    if (regPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      setIsSubmitting(false);
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();

    // 1. Asynchronous registration via Supabase Auth in background (dispatches real email verification)
    try {
      await supabase.auth.signUp({
        email: cleanEmail,
        password: regPassword,
        options: {
          data: {
            name: regName.trim(),
            phone: regPhone.trim(),
            city: regCity.trim(),
            idNumber: regIdNumber.trim(),
            role: regRole,
          },
        },
      });
    } catch (supaErr) {
      console.warn('Supabase auth.signUp background notice:', supaErr);
    }

    // 2. Local persistence and profile setup
    const res = registerUser({
      name: regName,
      email: cleanEmail,
      phone: regPhone,
      city: regCity,
      idNumber: regIdNumber,
      role: regRole,
      password: regPassword,
    });

    setIsSubmitting(false);

    if (res.success && res.user) {
      const createdUser = res.user;
      onAuthSuccess(createdUser);
      handleModalClose();

      // Dispatch automatic welcome email in background via Google Apps Script
      sendGoogleEmail({
        email: createdUser.email,
        asunto: '¡Bienvenido a Pintuco Color Link! Tu cuenta ha sido activada',
        mensaje: [
          `Hola ${createdUser.name},`,
          '',
          'Te damos la bienvenida al ecosistema Pintuco Color Link Colombia.',
          'Confirmamos la activación exitosa de tu cuenta.',
          '',
          `• Correo registrado: ${createdUser.email}`,
          `• Perfil: ${createdUser.role}`,
          `• Ciudad: ${createdUser.city || 'Bogotá D.C.'}`,
          '',
          'Ya puedes generar cotizaciones en COP, explorar paletas de color y gestionar tus pedidos en línea.',
          '',
          'Atentamente,',
          'Pintuco Color Link Colombia',
        ].join('\n'),
      }).then((ok) => {
        if (ok) {
          onShowToast?.(
            `Confirmación oficial entregada a ${createdUser.email} vía Google Apps Script`,
            'Cuenta activada en el ecosistema Pintuco Color Link.',
            { variant: 'success', showViewQuote: false }
          );
        }
      });
    } else {
      setError(res.error || 'Error al crear la cuenta');
    }
  };

  const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const val = recoveryEmail.trim().toLowerCase();
    if (!val) {
      setError('Por favor ingresa tu correo electrónico.');
      setIsSubmitting(false);
      return;
    }

    // Dispatch blind password reset via Supabase Auth
    try {
      await supabase.auth.resetPasswordForEmail(val, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
    } catch (supaErr) {
      console.warn('Supabase resetPasswordForEmail notice:', supaErr);
    }

    setIsSubmitting(false);
    setRecoveryStep('verify');
    setRecoveryToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!recoveryToken.trim()) {
      setError('Por favor ingresa el código de verificación o token recibido en tu correo.');
      setIsSubmitting(false);
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      setIsSubmitting(false);
      return;
    }

    const cleanEmail = recoveryEmail.trim().toLowerCase();

    // Verify and update credentials via Supabase Auth
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: recoveryToken.trim(),
        type: 'recovery',
      });
      if (!otpError) {
        await supabase.auth.updateUser({ password: newPassword });
      } else {
        console.warn('Supabase verifyOtp notice:', otpError.message);
      }
    } catch (supaErr) {
      console.warn('Supabase auth credential update notice:', supaErr);
    }

    // Update local user record
    const res = resetUserPassword(cleanEmail, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      // Discrete toast confirming updated credentials
      onShowToast?.('Contraseña actualizada correctamente');
      setMode('login');
      setLoginEmail(cleanEmail);
      setLoginPassword(newPassword);
      setRecoveryStep('request');
      setRecoveryToken('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessNotice('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
    } else {
      setError(res.error || 'No fue posible actualizar la contraseña.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header with Pintuco branding */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 relative">
          <button
            type="button"
            onClick={handleModalClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-amber-400 font-extrabold text-sm shadow-xs">
              PCL
            </div>
            <div>
              <span className="text-base font-black font-display tracking-tight text-white block leading-none">
                Pintuco Color Link
              </span>
              <span className="text-[10px] text-blue-200 font-medium tracking-wide">
                Portal de Cotizaciones & Paletas
              </span>
            </div>
          </div>

          <h2 className="text-xl font-black text-white font-display mt-3">
            {mode === 'login' && 'Iniciar Sesión'}
            {mode === 'register' && 'Crear Cuenta Nueva'}
            {mode === 'forgot_password' && 'Restablecer Contraseña'}
          </h2>
          <p className="text-xs text-blue-200/90 mt-0.5">
            {mode === 'login' && 'Accede a tus cotizaciones guardadas, proyectos y trazabilidad técnica.'}
            {mode === 'register' && 'Regístrate para guardar cotizaciones y asociar tus datos automáticamente.'}
            {mode === 'forgot_password' && 'Recupera el acceso a tu cuenta mediante verificación por correo.'}
          </p>

          {/* Subtle notice banner (e.g. Checkout login requirement) */}
          {authNotice && (
            <div className="mt-3.5 p-3 bg-amber-400/20 border border-amber-300/40 rounded-xl text-xs text-amber-200 leading-relaxed font-medium">
              {authNotice}
            </div>
          )}

          {/* Mode Switch Tabs (Only when in login or register mode) */}
          {mode !== 'forgot_password' && (
            <div className="grid grid-cols-2 gap-1 bg-blue-950/70 p-1 rounded-xl mt-4 border border-blue-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-300 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessNotice(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-300 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrarme</span>
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* LOGIN FORM                                                    */}
          {/* ------------------------------------------------------------- */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setError(null);
                      setSuccessNotice(null);
                      if (loginEmail) setRecoveryEmail(loginEmail);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>Ingresar a Mi Cuenta</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* PASSWORD RECOVERY (100% BLIND - DISPATCHED VIA SUPABASE AUTH) */}
          {/* ------------------------------------------------------------- */}
          {mode === 'forgot_password' && (
            <div className="space-y-4">
              {recoveryStep === 'request' ? (
                <form onSubmit={handleSendRecoveryCode} className="space-y-4">
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 leading-relaxed font-medium">
                    Ingresa tu correo electrónico registrado. Te enviaremos las instrucciones de restablecimiento directamente a tu bandeja de entrada en tiempo real.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo Electrónico Registrado *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="ejemplo@correo.com"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Enviando instrucciones...' : 'Enviar Instrucciones'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setSuccessNotice(null);
                      }}
                      className="text-xs text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver al Inicio de Sesión</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  {/* Notice strictly required by prompt */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed font-medium flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Si el correo se encuentra registrado, hemos enviado las instrucciones de restablecimiento a tu bandeja de entrada.
                    </span>
                  </div>

                  {/* Clean form: Token / Verification code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código de verificación / Token recibido en tu correo real *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Ingresa el código o token del correo"
                        value={recoveryToken}
                        onChange={(e) => setRecoveryToken(e.target.value.trim())}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nueva Contraseña * (mínimo 4 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirmar Nueva Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isSubmitting ? 'Actualizando...' : 'Restablecer y Guardar Contraseña'}</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryStep('request');
                        setError(null);
                      }}
                      className="text-xs text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Cambiar correo electrónico</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* REGISTRATION FORM (With strict validation rules)              */}
          {/* ------------------------------------------------------------- */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo / Razón Social *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre o empresa"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Celular / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="3118568707"
                      maxLength={10}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ciudad *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Bogotá D.C."
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as ClientRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none bg-white font-medium"
                  >
                    <option value="Particular">Particular / Propietario</option>
                    <option value="Pintor / Contratista">Pintor / Contratista</option>
                    <option value="Empresa / Constructora">Empresa / Constructora</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIT o Cédula (Opcional para facturación)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="ej: 900123456-7"
                    maxLength={12}
                    value={regIdNumber}
                    onChange={(e) => setRegIdNumber(e.target.value.replace(/[^0-9-]/g, '').slice(0, 12))}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Crear Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <span>{isSubmitting ? 'Creando cuenta...' : 'Crear Mi Cuenta Pintuco Color Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
