import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  X,
  Send,
  User,
  Bot,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Headphones,
  Users,
  Clock,
  ChevronRight,
  ShieldAlert,
  Reply
} from 'lucide-react';
import { UserProfile } from '../types';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'advisor';
  authorName?: string;
  text: string;
  timestamp: string;
  isEscalation?: boolean;
}

export interface ChatThread {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientRole?: string;
  status: 'bot' | 'esperando_asesor' | 'atendido';
  assignedAdvisor?: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface TechnicalSupportChatbotProps {
  currentUser?: UserProfile | null;
  isOpen: boolean;
  onToggle: () => void;
}

const STORAGE_THREADS_KEY = 'pintuco_live_chat_threads_v1';
const CHAT_UPDATE_EVENT = 'pintuco_chat_update';

const FAQS_ANSWERS: { [key: string]: string } = {
  rendimiento: `📊 **Rendimientos Técnicos Pintuco (a 2 manos):**
• **Vinilo Tipo 1 (VinilPro / Koraza):** Rinde de 40 a 50 m² por galón en repinte sobre color similar; 25 a 35 m² sobre obra nueva o estuco virgen.
• **Esmaltes Sintéticos (Alquídicos):** Rinden de 35 a 45 m² por galón sobre metal o madera previamente sellada.
• **Epóxicos Industriales (Pisos y Tráfico):** Rinden de 20 a 25 m² por galón a 4-5 mils de espesor seco.
• **Cuñete (5 galones):** Rinde aproximadamente 200 a 250 m² a 2 manos.
*Tip: Te invitamos a usar la pestaña 'Calculadora' para calcular los galones exactos según tus medidas.*`,

  preparacion: `🧱 **Preparación Técnica de Superficies:**
1. **Limpieza profunda:** Retira polvo, grasa, salitre o pintura suelta con espátula y cepillo de cerdas duras.
2. **Neutralización de hongos o humedad:** Aplica solución de agua con hipoclorito al 10%, deja actuar 20 min y enjuaga.
3. **Resane de grietas y fisuras:** Usa Estuco Acrílico Listo Para Usar EstucoFácil (interior) o Estuco Acrílico Exterior.
4. **Lijado y anclaje:** Lija con grano 150-180 para abrir poro y limpia con paño húmedo antes de aplicar la pintura.`,

  secado: `⏱️ **Tiempos de Secado y Curado (a 25°C y 60% HR):**
• **Secado al tacto:** 30 a 60 minutos.
• **Tiempo entre manos (segunda mano):** 2 a 4 horas para vinilos; 4 a 6 horas para esmaltes y epóxicos.
• **Secado total para uso:** 24 horas para tránsito liviano.
• **Curado final y máxima lavabilidad:** 7 a 14 días. No laves ni frotes la pared antes de este tiempo.`,

  tipos: `🎨 **Tipos de Pintura y Usos Recomendados:**
• **Interiores (Salas, Habitaciones, Pasillos):** VinilPro Tipo 1 (Alta lavabilidad y cubrimiento superior).
• **Fachadas y Exteriores:** Koraza Doble Vida / Acrílico Elastomérico 100% resistente a rayos UV y lluvias.
• **Metales y Maderas:** Esmalte Sintético Brillante o Satinado con Anticorrosivo Cromato de Zinc.
• **Pisos y Zonas Industriales:** Recubrimiento Epóxico Poliamida Pintucoat de alta resistencia química y al desgaste.`,
};

function getStoredThreads(): ChatThread[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_THREADS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // Initial seed threads for demonstration of active advisor panel
  const initialSeeds: ChatThread[] = [
    {
      id: 'thread-cliente-demo-1',
      clientName: 'Constructora Bolívar (Arq. Carlos Peña)',
      clientEmail: 'carlos.pena@bolivar.com.co',
      clientPhone: '3104567890',
      clientRole: 'Empresa / Constructora',
      status: 'esperando_asesor',
      assignedAdvisor: 'Ing. Luis Morales',
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      messages: [
        {
          id: 'seed-m1',
          sender: 'user',
          text: 'Buenas tardes. Requerimos cotizar 80 cuñetes de Koraza Doble Vida y asesoría en campo para fachada de 12 pisos en Bogotá.',
          timestamp: '14:20',
        },
        {
          id: 'seed-m2',
          sender: 'bot',
          text: 'Tu solicitud ha sido catalogada como prioridad técnica alta para obra nueva institucional.',
          timestamp: '14:20',
        },
      ],
    },
    {
      id: 'thread-cliente-demo-2',
      clientName: 'Pinturas & Diseños SAS (Juliana Gómez)',
      clientEmail: 'juliana.gomez@pyd.co',
      clientPhone: '3157891234',
      clientRole: 'Pintor / Contratista',
      status: 'atendido',
      assignedAdvisor: 'Ing. Juan Romero',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      messages: [
        {
          id: 'seed-m3',
          sender: 'user',
          text: 'Hola, ¿qué recubrimiento epóxico me recomiendan para taller de mecánica pesada en Medellín?',
          timestamp: '11:05',
        },
        {
          id: 'seed-m4',
          sender: 'advisor',
          authorName: 'Ing. Juan Romero',
          text: 'Hola Juliana. Para tráfico pesado de taller recomendamos Pintucoat Epóxico Poliamida de 4 a 6 mils con previo desengrase y perfil de anclaje CSP-3.',
          timestamp: '11:12',
        },
      ],
    },
  ];

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(initialSeeds));
    }
  } catch {}

  return initialSeeds;
}

function saveThreads(threads: ChatThread[]) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
      window.dispatchEvent(new CustomEvent(CHAT_UPDATE_EVENT));
    }
  } catch {}
}

export const TechnicalSupportChatbot: React.FC<TechnicalSupportChatbotProps> = ({
  currentUser,
  isOpen,
  onToggle,
}) => {
  // Current user's thread identity
  const clientId = currentUser?.id || 'guest_client_session';
  const clientName = currentUser?.name || 'Cliente Visitante';
  const clientEmail = currentUser?.email || 'cliente@portal.com';

  const [threads, setThreads] = useState<ChatThread[]>(() => getStoredThreads());
  const [activeAdminTab, setActiveAdminTab] = useState<'client_chat' | 'advisor_panel'>(
    currentUser?.rol === 'admin' ? 'advisor_panel' : 'client_chat'
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string>('thread-cliente-demo-1');
  const [advisorInput, setAdvisorInput] = useState<string>('');
  const [clientInput, setClientInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync threads from storage events
  const refreshThreads = useCallback(() => {
    setThreads(getStoredThreads());
  }, []);

  useEffect(() => {
    window.addEventListener('storage', refreshThreads);
    window.addEventListener(CHAT_UPDATE_EVENT, refreshThreads);
    return () => {
      window.removeEventListener('storage', refreshThreads);
      window.removeEventListener(CHAT_UPDATE_EVENT, refreshThreads);
    };
  }, [refreshThreads]);

  // Ensure current user's thread exists in the threads collection
  useEffect(() => {
    const existing = threads.find((t) => t.id === clientId);
    if (!existing) {
      const newThread: ChatThread = {
        id: clientId,
        clientName,
        clientEmail,
        clientPhone: currentUser?.phone,
        clientRole: currentUser?.role,
        status: 'bot',
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'welcome-init',
            sender: 'bot',
            text: `¡Hola! 👋 Soy tu Asistente Técnico Virtual de Pintuco Color Link. Estoy preparado para resolver dudas técnicas sobre rendimientos por metro cuadrado, preparación de muros, tiempos de secado y tipo de recubrimiento ideal para tu obra. Si lo requieres, también puedo comunicarte con un asesor técnico humano.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      };
      const updated = [newThread, ...threads];
      saveThreads(updated);
      setThreads(updated);
    }
  }, [clientId, clientName, clientEmail, currentUser, threads]);

  // Current client thread
  const currentClientThread = threads.find((t) => t.id === clientId) || {
    id: clientId,
    clientName,
    clientEmail,
    status: 'bot',
    updatedAt: new Date().toISOString(),
    messages: [],
  };

  const isEscalated =
    currentClientThread.status === 'esperando_asesor' ||
    currentClientThread.status === 'atendido' ||
    currentClientThread.messages.some((m) => m.isEscalation);

  // Active thread viewed in advisor panel
  const activeAdvisorThread =
    threads.find((t) => t.id === selectedThreadId) || threads[0] || currentClientThread;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threads, isOpen, activeAdminTab, selectedThreadId]);

  // -------------------------------------------------------------
  // CLIENT HANDLERS
  // -------------------------------------------------------------
  const handleClientSend = (textToSend?: string) => {
    const text = (textToSend || clientInput).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const lower = text.toLowerCase();
    const wantsHuman =
      lower.includes('humano') ||
      lower.includes('asesor') ||
      lower.includes('persona') ||
      lower.includes('ingeniero') ||
      lower.includes('hablar con alguien') ||
      lower.includes('especialista') ||
      lower.includes('contacto directo');

    const nextMessages = [...currentClientThread.messages, userMsg];
    let nextStatus = currentClientThread.status;
    let assignedAdvisor = currentClientThread.assignedAdvisor;

    if (wantsHuman) {
      nextStatus = 'esperando_asesor';
      assignedAdvisor = 'Luis Morales / Juan Romero';
      const escMsg: ChatMessage = {
        id: `esc-${Date.now()}`,
        sender: 'advisor',
        authorName: 'Ing. Luis Morales & Ing. Juan Romero',
        isEscalation: true,
        text: `👨‍💼 **Conectado con Asesor Pintuco (Luis Morales / Juan Romero)**\n\nTu solicitud técnica ha sido radicada en cola prioritaria para nuestros asesores en vivo. Uno de nuestros ingenieros te responderá directamente en este chat o puedes pulsar el enlace a WhatsApp oficial.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      nextMessages.push(escMsg);
    } else if (
      lower.includes('rendimiento') ||
      lower.includes('m2') ||
      lower.includes('galon') ||
      lower.includes('cuanto rinde') ||
      lower.includes('metros')
    ) {
      nextMessages.push({
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: FAQS_ANSWERS.rendimiento,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (
      lower.includes('prepar') ||
      lower.includes('superficie') ||
      lower.includes('muro') ||
      lower.includes('lijar') ||
      lower.includes('grieta') ||
      lower.includes('estuco') ||
      lower.includes('humedad')
    ) {
      nextMessages.push({
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: FAQS_ANSWERS.preparacion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (
      lower.includes('secado') ||
      lower.includes('secar') ||
      lower.includes('tiempo') ||
      lower.includes('repinte') ||
      lower.includes('manos')
    ) {
      nextMessages.push({
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: FAQS_ANSWERS.secado,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (
      lower.includes('tipo') ||
      lower.includes('pintura') ||
      lower.includes('cual') ||
      lower.includes('recomiend') ||
      lower.includes('fachada') ||
      lower.includes('esmalte') ||
      lower.includes('epoxi')
    ) {
      nextMessages.push({
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: FAQS_ANSWERS.tipos,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } else if (nextStatus !== 'esperando_asesor' && nextStatus !== 'atendido') {
      nextMessages.push({
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `Comprendo tu inquietud técnica. Puedes consultar sobre **rendimientos**, **preparación de superficies**, **tiempos de secado** o pulsar 'Hablar con un asesor técnico humano' para transferirte directamente.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    const updatedThreads = threads.map((t) =>
      t.id === clientId
        ? {
            ...t,
            status: nextStatus,
            assignedAdvisor,
            updatedAt: new Date().toISOString(),
            messages: nextMessages,
          }
        : t
    );

    saveThreads(updatedThreads);
    setThreads(updatedThreads);
    if (!textToSend) setClientInput('');
  };

  // -------------------------------------------------------------
  // ADVISOR (ADMIN) BIDIRECTIONAL HANDLERS
  // -------------------------------------------------------------
  const handleAdvisorSendReply = (customText?: string) => {
    const text = (customText || advisorInput).trim();
    if (!text || !activeAdvisorThread) return;

    const advisorName = currentUser?.name || 'Ing. Luis Morales (Asesor Técnico)';

    const newReplyMsg: ChatMessage = {
      id: `adv-${Date.now()}`,
      sender: 'advisor',
      authorName: advisorName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedThreads = threads.map((t) => {
      if (t.id === activeAdvisorThread.id) {
        return {
          ...t,
          status: 'atendido' as const,
          assignedAdvisor: advisorName,
          updatedAt: new Date().toISOString(),
          messages: [...t.messages, newReplyMsg],
        };
      }
      return t;
    });

    saveThreads(updatedThreads);
    setThreads(updatedThreads);
    if (!customText) setAdvisorInput('');
  };

  const pendingRequestsCount = threads.filter((t) => t.status === 'esperando_asesor').length;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-700 to-blue-900 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 border-2 border-white/20 cursor-pointer"
        aria-label="Abrir Asistente Técnico Pintuco"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-amber-300" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-blue-900" />
        </div>
        <span className="hidden sm:inline text-xs font-bold font-display tracking-wide">
          {currentUser?.rol === 'admin' ? 'Asistencia & Mesa de Asesor' : 'Asistente Técnico Pintuco'}
        </span>
        {currentUser?.rol === 'admin' && pendingRequestsCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-blue-950 font-black text-[10px]">
            {pendingRequestsCount}
          </span>
        )}
      </button>

      {/* Main Chat Panel Container */}
      {isOpen && (
        <div className={`fixed bottom-20 sm:bottom-22 right-4 sm:right-6 z-50 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[560px] animate-in fade-in slide-in-from-bottom-5 duration-200 ${
          currentUser?.rol === 'admin' && activeAdminTab === 'advisor_panel'
            ? 'w-[calc(100vw-2rem)] sm:w-[500px]'
            : 'w-[calc(100vw-2rem)] sm:w-96'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-xs">
                {currentUser?.rol === 'admin' && activeAdminTab === 'advisor_panel' ? (
                  <Headphones className="w-5 h-5 text-amber-300" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                  <span>
                    {currentUser?.rol === 'admin' && activeAdminTab === 'advisor_panel'
                      ? 'Panel de Asesor Técnico en Vivo'
                      : 'Asistencia Técnica Pintuco'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </h3>
                <span className="text-[10px] text-blue-200 block truncate max-w-[220px]">
                  {isEscalated
                    ? 'Conectado con Asesor Pintuco (Luis Morales / Juan Romero)'
                    : 'Respuestas Técnicas Inmediatas & Formulación'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 text-blue-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Navigation Switcher Tabs (Only for rol === 'admin') */}
          {currentUser?.rol === 'admin' && (
            <div className="bg-blue-950/90 border-b border-blue-800/60 px-3 py-1.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 bg-blue-900/60 p-0.5 rounded-lg border border-blue-700/50">
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('advisor_panel')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeAdminTab === 'advisor_panel'
                      ? 'bg-amber-400 text-blue-950 shadow-xs'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3 h-3" />
                  <span>Panel Asesor Humano</span>
                  {pendingRequestsCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-extrabold">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAdminTab('client_chat')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeAdminTab === 'client_chat'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-200 hover:text-white'
                  }`}
                >
                  <Bot className="w-3 h-3" />
                  <span>Mi Vista de Chat</span>
                </button>
              </div>

              <span className="text-[10px] text-amber-300 font-semibold hidden sm:inline">
                Rol: Asesor / Admin
              </span>
            </div>
          )}

          {/* ================================================================= */}
          {/* VIEW A: ADVISOR HUMAN LIVE PANEL (For Admins)                    */}
          {/* ================================================================= */}
          {currentUser?.rol === 'admin' && activeAdminTab === 'advisor_panel' ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
              {/* Threads Selector Strip */}
              <div className="bg-white border-b border-slate-200 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Clientes en Espera / Conversaciones Activas</span>
                  <span className="text-blue-600 font-bold">{threads.length} chats</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {threads.map((thread) => {
                    const isSelected = thread.id === activeAdvisorThread.id;
                    const isPending = thread.status === 'esperando_asesor';
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`px-3 py-2 rounded-xl text-left border transition-all shrink-0 max-w-[200px] cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/90 text-blue-950 shadow-2xs ring-1 ring-blue-600'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold truncate block">{thread.clientName}</span>
                          {isPending && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : thread.status === 'atendido'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isPending ? 'Esperando Asesor' : thread.status === 'atendido' ? 'Atendido' : 'Bot'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Conversation Messages */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/70">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{activeAdvisorThread.clientName}</span>
                    <span className="text-[10px] text-slate-500">
                      {activeAdvisorThread.clientEmail} • {activeAdvisorThread.clientPhone || 'Sin tel'}
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    {activeAdvisorThread.clientRole || 'Cliente'}
                  </span>
                </div>

                {activeAdvisorThread.messages.map((m) => {
                  const isUser = m.sender === 'user';
                  const isAdv = m.sender === 'advisor';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2 ${isAdv ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isAdv
                            ? 'bg-amber-500 text-blue-950'
                            : isUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-900 text-amber-300'
                        }`}
                      >
                        {isAdv ? 'A' : isUser ? 'C' : 'B'}
                      </div>
                      <div
                        className={`max-w-[82%] rounded-2xl p-2.5 text-xs leading-relaxed ${
                          isAdv
                            ? 'bg-blue-900 text-white rounded-tr-none shadow-xs'
                            : isUser
                            ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-xs'
                            : 'bg-slate-100 border border-slate-200 text-slate-700'
                        }`}
                      >
                        {m.authorName && (
                          <div className={`text-[10px] font-bold mb-0.5 ${isAdv ? 'text-amber-300' : 'text-blue-700'}`}>
                            {m.authorName}
                          </div>
                        )}
                        <div className="whitespace-pre-line font-sans">{m.text}</div>
                        <span
                          className={`text-[9px] mt-1 block text-right ${
                            isAdv ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Advisor Suggestions */}
              <div className="px-3 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[10px] scrollbar-none">
                <button
                  type="button"
                  onClick={() =>
                    handleAdvisorSendReply(
                      'Hola, un gusto saludarte. Te confirmo que el rendimiento de Koraza Doble Vida es de 40 a 50 m² por galón en repinte. ¿Deseas que preparemos cotización formal?'
                    )
                  }
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:border-blue-500 whitespace-nowrap cursor-pointer"
                >
                  Rendimiento Koraza
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAdvisorSendReply(
                      'Para la preparación de superficie recomendamos aplicar Estuco Acrílico Exterior previa limpieza con hipoclorito al 10%.'
                    )
                  }
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:border-blue-500 whitespace-nowrap cursor-pointer"
                >
                  Preparación Exterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAdvisorSendReply(
                      'Te acabamos de transferir los datos técnicos a tu radicado en línea. Quedo atento a tus observaciones.'
                    )
                  }
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:border-blue-500 whitespace-nowrap cursor-pointer"
                >
                  Confirmar Radicado
                </button>
              </div>

              {/* Advisor Response Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdvisorSendReply();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Responder como ${currentUser?.name || 'Asesor Pintuco'}...`}
                  value={advisorInput}
                  onChange={(e) => setAdvisorInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!advisorInput.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Responder</span>
                </button>
              </form>
            </div>
          ) : (
            /* ================================================================= */
            /* VIEW B: CLIENT PERSPECTIVE (Default for Clients / Simulated)      */
            /* ================================================================= */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
              {/* Quick FAQ Chips */}
              <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleClientSend('¿Cuál es el rendimiento por m2 y galón?')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-500 rounded-full font-medium text-slate-700 whitespace-nowrap shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  📐 Rendimientos
                </button>
                <button
                  type="button"
                  onClick={() => handleClientSend('¿Cómo preparar la superficie antes de pintar?')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-500 rounded-full font-medium text-slate-700 whitespace-nowrap shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  🧱 Preparación
                </button>
                <button
                  type="button"
                  onClick={() => handleClientSend('¿Cuáles son los tiempos de secado y repinte?')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-500 rounded-full font-medium text-slate-700 whitespace-nowrap shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  ⏱️ Tiempos de secado
                </button>
                <button
                  type="button"
                  onClick={() => handleClientSend('¿Qué tipo de pintura me recomiendan?')}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-500 rounded-full font-medium text-slate-700 whitespace-nowrap shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  🎨 Tipos de pintura
                </button>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
                {currentClientThread.messages.map((m) => {
                  const isUser = m.sender === 'user';
                  const isAdvisor = m.sender === 'advisor';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                          isUser
                            ? 'bg-blue-600 text-white'
                            : isAdvisor
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-blue-900 text-amber-300'
                        }`}
                      >
                        {isUser ? <User className="w-3.5 h-3.5" /> : isAdvisor ? <Headphones className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : isAdvisor
                            ? 'bg-amber-50/90 border border-amber-300 text-slate-900 rounded-tl-none shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                        }`}
                      >
                        {isAdvisor && (
                          <div className="text-[10px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{m.authorName || 'Asesor Técnico Pintuco'}</span>
                          </div>
                        )}
                        <div className="whitespace-pre-line font-sans">{m.text}</div>

                        {/* If escalation message, show WhatsApp and Contact CTA */}
                        {m.isEscalation && (
                          <div className="mt-3 pt-2.5 border-t border-amber-200 space-y-2">
                            <a
                              href="https://wa.me/573118568707?text=Hola%20Pintuco,%20requiero%20asesor%C3%ADa%20t%C3%A9cnica%20especializada%20para%20mi%20proyecto."
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Hablar por WhatsApp (+57 311 856 8707)</span>
                              <ExternalLink className="w-3 h-3 ml-0.5" />
                            </a>
                            <div className="text-[10px] text-amber-900 font-medium text-center">
                              Especialistas: Ing. Luis Morales & Ing. Juan Romero
                            </div>
                          </div>
                        )}

                        <span
                          className={`text-[9px] mt-1 block text-right ${
                            isUser ? 'text-blue-200' : 'text-slate-400'
                          }`}
                        >
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Action for Human Advisor if not already escalated */}
              {!isEscalated && (
                <div className="px-3 py-1.5 bg-amber-50/80 border-t border-amber-200 flex items-center justify-between">
                  <span className="text-[10px] text-amber-900 font-medium">
                    ¿Prefieres hablar con una persona?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleClientSend('Deseo hablar con un asesor técnico humano')}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                  >
                    Hablar con asesor técnico humano →
                  </button>
                </div>
              )}

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClientSend();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    isEscalated
                      ? 'Escribe tu consulta al Asesor Pintuco...'
                      : 'Escribe tu duda técnica (ej: rendimiento, secado)...'
                  }
                  value={clientInput}
                  onChange={(e) => setClientInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!clientInput.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
