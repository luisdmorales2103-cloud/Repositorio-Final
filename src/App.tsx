import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, ProductPresentation, Quote, QuoteItem, CustomerInfo, QuoteStatus, UserProfile, OrderConfirmation, OrderStatus } from './types';
import { INITIAL_PRODUCTS } from './data/products';
import { formatCOP, generateQuoteNumber } from './utils/formatters';
import { getCurrentUser, logoutUser } from './utils/auth';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { PaintCalculator } from './components/PaintCalculator';
import { QuoteBuilder } from './components/QuoteBuilder';
import { QuoteDocument } from './components/QuoteDocument';
import { QuotesHistory } from './components/QuotesHistory';
import { OrdersView } from './components/OrdersView';
import { InventoryView } from './components/InventoryView';
import { ContactView } from './components/ContactView';
import { SolutionsModuleView } from './components/SolutionsModuleView';
import { ColorStudioView } from './components/ColorStudioView';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { NotificationToast } from './components/NotificationToast';
import { TechnicalSupportChatbot } from './components/TechnicalSupportChatbot';
import {
  fetchQuotesFromSupabase,
  saveQuoteToSupabase,
  updateQuoteStatusInSupabase,
  deleteQuoteFromSupabase,
  filterQuotesForUser,
  fetchOrders,
  saveOrderToStorage,
  updateOrderStatus,
} from './services/supabaseService';
import { GAS_DEFAULT_EMAIL, sendGoogleEmail } from './services/googleAppsScriptService';
import {
  sendQuoteNotificationApi,
  sendQuoteStatusNotificationApi,
} from './services/notificationService';
import { GoogleAppsScriptModal } from './components/GoogleAppsScriptModal';
import { DataWarehouseView } from './components/DataWarehouseView';
import { AdminDwAuthGate } from './components/AdminDwAuthGate';
import { getQuotePdfBase64 } from './utils/generateQuotePdf';


const STORAGE_KEYS = {
  SAVED_QUOTES: 'colorpro_saved_quotes_v1',
  CURRENT_ITEMS: 'colorpro_current_items_v1',
  CURRENT_CUSTOMER: 'colorpro_current_customer_v1',
  DISCOUNT: 'colorpro_discount_v1',
  INCLUDE_IVA: 'colorpro_include_iva_v1',
};

const DEFAULT_CUSTOMER: CustomerInfo = {
  name: '',
  idNumber: '',
  contactPerson: '',
  phone: '',
  email: '',
  city: '',
  address: '',
  notes: '',
};

const buildCustomerFromUser = (user: UserProfile | null): CustomerInfo => {
  if (!user) {
    return { ...DEFAULT_CUSTOMER };
  }
  return {
    name: user.name || '',
    idNumber: user.idNumber || '',
    contactPerson: user.name || '',
    phone: user.phone || '',
    email: user.email || '',
    city: user.city || '',
    address: user.address || '',
    notes: '',
  };
};

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [catalogCategory, setCatalogCategory] = useState<ProductCategory | 'TODAS'>('TODAS');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedSolutionModuleId, setSelectedSolutionModuleId] = useState<string>('mod-construccion');

  // Private Admin Gate for Data Warehouse BI (PIN: 8085)
  const [isDwUnlocked, setIsDwUnlocked] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem('pintuco_dw_admin_unlocked') === 'true';
      }
      return false;
    } catch {
      return false;
    }
  });

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authNotice, setAuthNotice] = useState<string | undefined>(undefined);
  const [pendingCheckout, setPendingCheckout] = useState<boolean>(false);
  const [autoOpenCheckoutOnDocument, setAutoOpenCheckoutOnDocument] = useState<boolean>(false);

  // Products with persistent custom overrides (Stock & Prices by Admin)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const custom = localStorage.getItem('pintuco_custom_inventory_v1');
        if (custom) {
          const overrides: {
            [id: string]: { stock: number; presentations?: ProductPresentation[] };
          } = JSON.parse(custom);
          return INITIAL_PRODUCTS.map((p) => {
            if (overrides[p.id]) {
              return {
                ...p,
                stock: overrides[p.id].stock,
                presentations: overrides[p.id].presentations || p.presentations,
              };
            }
            return p;
          });
        }
      }
    } catch {}
    return INITIAL_PRODUCTS;
  });

  // Technical Support Chatbot state
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);

  // Active Quote State (Cart)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ITEMS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Customer form: strictly empty for guests, autofilled only with current user profile if authenticated
  const [customer, setCustomer] = useState<CustomerInfo>(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CUSTOMER);
    } catch {}
    const user = getCurrentUser();
    return user ? buildCustomerFromUser(user) : { ...DEFAULT_CUSTOMER };
  });

  const [discountPercent, setDiscountPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISCOUNT);
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [includeIva, setIncludeIva] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCLUDE_IVA);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Saved Quotes History: Strictly filtered by user role, preventing shared mock data leaks
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>(() => {
    const user = getCurrentUser();
    if (!user) return [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(STORAGE_KEYS.SAVED_QUOTES);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? filterQuotesForUser(parsed, user) : [];
        }
      }
    } catch {}
    return [];
  });

  // Confirmed Orders History: Strictly filtered by user role, preventing data leaks
  const [orders, setOrders] = useState<OrderConfirmation[]>(() => {
    const user = getCurrentUser();
    return user ? fetchOrders(user) : [];
  });

  // Active Quote Document View (for generated or opened quotes)
  const [activeDocumentQuote, setActiveDocumentQuote] = useState<Quote | null>(null);

  // Modals & Toasts
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [gasModalOpen, setGasModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    submessage?: string;
    variant?: 'default' | 'success';
    showViewQuote?: boolean;
  } | null>(null);

  const showToast = (
    message: string,
    submessage?: string,
    options?: { variant?: 'default' | 'success'; showViewQuote?: boolean }
  ) => {
    setToast({
      message,
      submessage,
      variant: options?.variant,
      showViewQuote: options?.showViewQuote,
    });
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ITEMS, JSON.stringify(quoteItems));
  }, [quoteItems]);

  // User profile synchronization: autofill only active user profile, or reset completely if anonymous
  useEffect(() => {
    if (currentUser) {
      setCustomer(buildCustomerFromUser(currentUser));
    } else {
      setCustomer({ ...DEFAULT_CUSTOMER });
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CUSTOMER);
      } catch {}
    }
  }, [currentUser]);

  // Reset customer inputs to blank strings and wipe any residual storage
  const resetCustomerForm = () => {
    setCustomer({ ...DEFAULT_CUSTOMER });
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CUSTOMER);
    } catch {}
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISCOUNT, String(discountPercent));
  }, [discountPercent]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCLUDE_IVA, JSON.stringify(includeIva));
  }, [includeIva]);

  // Auto-dismiss discrete toast notifications after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync to localStorage without poisoning other users' data or injecting unassociated quotes
  useEffect(() => {
    if (!currentUser) return;
    if (savedQuotes && savedQuotes.length > 0) {
      try {
        if (currentUser.rol === 'admin') {
          localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(savedQuotes));
        } else {
          const raw = localStorage.getItem(STORAGE_KEYS.SAVED_QUOTES);
          const allStored: Quote[] = raw ? JSON.parse(raw) : [];
          const userEmail = currentUser.email.trim().toLowerCase();
          const userId = currentUser.id;
          const otherQuotes = allStored.filter((q) => {
            const qEmail = (q.cliente_email || q.customer?.email || '').trim().toLowerCase();
            const qId = q.cliente_id;
            return !(
              (Boolean(qId) && Boolean(userId) && qId === userId) ||
              (Boolean(qEmail) && Boolean(userEmail) && qEmail === userEmail)
            );
          });
          localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify([...savedQuotes, ...otherQuotes]));
        }
      } catch {}
    }
  }, [savedQuotes, currentUser]);

  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState<boolean>(false);

  const handleRefreshQuotes = () => {
    if (!currentUser) return;
    setIsRefreshingQuotes(true);
    fetchQuotesFromSupabase(currentUser)
      .then(({ quotes }) => {
        if (quotes) setSavedQuotes(quotes);
        setOrders(fetchOrders(currentUser));
      })
      .finally(() => {
        setTimeout(() => setIsRefreshingQuotes(false), 500);
      });
  };

  // Load quotes and orders with strict role isolation:
  // Admin: global list of quotes and orders
  // Cliente: strictly their own quotes and orders (or empty list if new)
  useEffect(() => {
    if (!currentUser) {
      setSavedQuotes([]);
      setOrders([]);
      return;
    }
    fetchQuotesFromSupabase(currentUser).then(({ quotes }) => {
      setSavedQuotes(quotes || []);
      setOrders(fetchOrders(currentUser));
    });
  }, [currentUser]);

  // Whenever navigating to 'historial' tab, refresh quotes from Supabase cloud
  useEffect(() => {
    if (currentTab === 'historial' && currentUser) {
      handleRefreshQuotes();
    }
  }, [currentTab]);

  // Periodic background check for Admin when on 'historial' tab (every 15s)
  useEffect(() => {
    if (currentTab === 'historial' && currentUser?.rol === 'admin') {
      const interval = setInterval(() => {
        fetchQuotesFromSupabase(currentUser).then(({ quotes }) => {
          if (quotes && quotes.length > 0) {
            setSavedQuotes(quotes);
          }
        });
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [currentTab, currentUser]);


  // Financial totals for active cart
  const cartSubtotal = quoteItems.reduce((acc, it) => acc + it.subtotal, 0);
  const cartCount = quoteItems.reduce((acc, it) => acc + it.quantity, 0);

  // Actions
  const handleAddToQuote = (
    product: Product,
    presentation: ProductPresentation,
    quantity: number = 1
  ) => {
    setQuoteItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) =>
          it.productId === product.id &&
          it.presentation === presentation.name &&
          it.colorHex === product.colorHex &&
          it.productName === product.name
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: newQty * presentation.price,
        };
        return updated;
      } else {
        const newItem: QuoteItem = {
          id: `qi-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          category: product.category,
          presentation: presentation.name,
          unitPrice: presentation.price,
          quantity,
          colorName: product.colorName,
          colorHex: product.colorHex,
          surfaceTag: product.surfaceTag,
          subtotal: presentation.price * quantity,
        };
        return [...prev, newItem];
      }
    });

    setToast({
      message: `Agregado a la cotización`,
      submessage: `${product.name} (${presentation.name}) x ${quantity}`,
    });
  };

  const handleAddMultipleToQuote = (
    items: { product: Product; presentation: ProductPresentation; quantity: number }[]
  ) => {
    if (!items || items.length === 0) return;

    setQuoteItems((prev) => {
      let updated = [...prev];
      items.forEach((item, index) => {
        const { product, presentation, quantity } = item;
        const existingIndex = updated.findIndex(
          (it) =>
            it.productId === product.id &&
            it.presentation === presentation.name &&
            it.colorHex === product.colorHex &&
            it.productName === product.name
        );

        if (existingIndex > -1) {
          const newQty = updated[existingIndex].quantity + quantity;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            subtotal: newQty * presentation.price,
          };
        } else {
          const newItem: QuoteItem = {
            id: `qi-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
            productId: product.id,
            sku: product.sku,
            productName: product.name,
            category: product.category,
            presentation: presentation.name,
            unitPrice: presentation.price,
            quantity,
            colorName: product.colorName,
            colorHex: product.colorHex,
            surfaceTag: product.surfaceTag,
            subtotal: presentation.price * quantity,
          };
          updated.push(newItem);
        }
      });
      return updated;
    });

    setToast({
      message: `Colores agregados a la cotización`,
      submessage: `Se agregaron ${items.length} productos y colores de la paleta a la cotización`,
    });
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    setQuoteItems(
      quoteItems.map((it) => {
        if (it.id === itemId) {
          const qty = Math.max(1, newQuantity);
          return {
            ...it,
            quantity: qty,
            subtotal: qty * it.unitPrice,
          };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setQuoteItems(quoteItems.filter((it) => it.id !== itemId));
  };

  const handleUpdateCustomer = (field: keyof CustomerInfo, value: string) => {
    setCustomer({ ...customer, [field]: value });
  };

  // Generate Quote Document
  const handleGenerateQuote = () => {
    const nextNumber = generateQuoteNumber(savedQuotes);
    const subtotal = quoteItems.reduce((acc, it) => acc + it.subtotal, 0);
    const discountAmount = Math.round(subtotal * (discountPercent / 100));
    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const ivaRate = 0.19;
    const ivaAmount = includeIva ? Math.round(subtotalAfterDiscount * ivaRate) : 0;
    const total = subtotalAfterDiscount + ivaAmount;

    const targetEmail = (currentUser?.email || customer.email || '').trim().toLowerCase();
    const clientNotificationEmail = (customer.email || currentUser?.email || '').trim().toLowerCase();
    const targetClienteId = currentUser?.id;

    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNumber: nextNumber,
      cliente_id: targetClienteId,
      cliente_email: targetEmail,
      date: new Date().toISOString(),
      formattedDate: new Date().toISOString(),
      customer: { ...customer, email: clientNotificationEmail || targetEmail },
      items: [...quoteItems],
      subtotal,
      discountPercent,
      discountAmount,
      includeIva,
      ivaRate,
      ivaAmount,
      total,
      status: 'En preparación',
      validityDays: 15,
    };

    setActiveDocumentQuote(newQuote);
    setCurrentTab('documento');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Reset customer inputs to blank strings immediately after emission so fields don't linger
    resetCustomerForm();

    // Asynchronously send to Supabase upon emission
    saveQuoteToSupabase(newQuote, currentUser).then((result) => {
      if (result.savedQuote) {
        setSavedQuotes((prev) => {
          const idx = prev.findIndex((q) => q.id === newQuote.id || q.id === result.savedQuote.id);
          if (idx > -1) {
            const next = [...prev];
            next[idx] = result.savedQuote;
            return next;
          }
          return [result.savedQuote, ...prev];
        });
        setActiveDocumentQuote((prevActive) => {
          if (prevActive && (prevActive.id === newQuote.id || prevActive.id === result.savedQuote.id)) {
            return {
              ...result.savedQuote,
              emailStatus: prevActive.emailStatus,
              emailStatusMessage: prevActive.emailStatusMessage,
            };
          }
          return prevActive;
        });
      }
    });

    // Dispatch automatic email notification in background via Google Apps Script
    if (clientNotificationEmail) {
      const itemsDetail = newQuote.items
        .map((it) => `• ${it.productName} (${it.presentation}) x${it.quantity}: ${formatCOP(it.subtotal)}`)
        .join('\n');

      sendGoogleEmail({
        email: clientNotificationEmail,
        asunto: `Cotización Oficial Pintuco Color Link - Radicado ${newQuote.quoteNumber}`,
        mensaje: [
          `Hola ${newQuote.customer.name || 'Cliente'},`,
          '',
          'Hemos generado tu cotización oficial en Pintuco Color Link Colombia.',
          '',
          `• Número de Radicado: ${newQuote.quoteNumber}`,
          `• Total Cotizado: ${formatCOP(newQuote.total)} COP`,
          `• Subtotal: ${formatCOP(newQuote.subtotal)} COP`,
          newQuote.discountPercent > 0
            ? `• Descuento (${newQuote.discountPercent}%): -${formatCOP(newQuote.discountAmount)} COP`
            : '',
          newQuote.includeIva ? `• IVA (19%): ${formatCOP(newQuote.ivaAmount)} COP` : '• IVA: No aplica',
          `• Validez comercial: ${newQuote.validityDays || 15} días calendario`,
          '',
          'Productos cotizados:',
          itemsDetail,
          '',
          'Gracias por cotizar con Pintuco Color Link.',
        ]
          .filter(Boolean)
          .join('\n'),
      }).then((ok) => {
        if (ok) {
          const confirmMsg = `Confirmación oficial entregada a ${clientNotificationEmail} vía Google Apps Script`;
          setActiveDocumentQuote((prev) =>
            prev && (prev.id === newQuote.id || prev.quoteNumber === newQuote.quoteNumber)
              ? { ...prev, emailStatus: 'Enviado', emailStatusMessage: confirmMsg }
              : prev
          );
          setSavedQuotes((prev) =>
            prev.map((q) =>
              q.id === newQuote.id || q.quoteNumber === newQuote.quoteNumber
                ? { ...q, emailStatus: 'Enviado', emailStatusMessage: confirmMsg }
                : q
            )
          );
          showToast(
            confirmMsg,
            `Radicado ${newQuote.quoteNumber} • Total cotizado: ${formatCOP(newQuote.total)}`,
            { variant: 'success', showViewQuote: false }
          );
        }
      });
    }
  };

  // Save Quote to Supabase relational tables with localStorage backup
  const handleSaveQuoteToStorage = (quoteToSave: Quote) => {
    const targetEmail = (currentUser?.email || quoteToSave.cliente_email || quoteToSave.customer.email || '').trim().toLowerCase();
    const targetClienteId = currentUser?.id || quoteToSave.cliente_id;
    const quoteWithPrep: Quote = {
      ...quoteToSave,
      cliente_id: targetClienteId,
      cliente_email: targetEmail,
      status: quoteToSave.status || 'En preparación',
      customer: {
        ...quoteToSave.customer,
        email: targetEmail,
        name: quoteToSave.customer.name || currentUser?.name || 'Cliente Particular',
      },
    };

    const existingIndex = savedQuotes.findIndex(
      (q) => q.id === quoteWithPrep.id || q.quoteNumber === quoteWithPrep.quoteNumber
    );
    let updated: Quote[];
    if (existingIndex > -1) {
      updated = [...savedQuotes];
      updated[existingIndex] = quoteWithPrep;
    } else {
      updated = [quoteWithPrep, ...savedQuotes];
    }

    setSavedQuotes(updated);
    setActiveDocumentQuote(quoteWithPrep);

    // Save immediately and redundantly to localStorage under colorpro_saved_quotes_v1
    try {
      const rawStored = localStorage.getItem(STORAGE_KEYS.SAVED_QUOTES);
      const storedList: Quote[] = rawStored ? JSON.parse(rawStored) : [];
      const sIdx = storedList.findIndex(
        (q) => q.id === quoteWithPrep.id || q.quoteNumber === quoteWithPrep.quoteNumber
      );
      if (sIdx > -1) {
        storedList[sIdx] = quoteWithPrep;
      } else {
        storedList.unshift(quoteWithPrep);
      }
      localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(storedList));
    } catch {}

    // Auto-clean active quotation draft so next quotation is fresh and empty
    setQuoteItems([]);
    resetCustomerForm();
    setDiscountPercent(0);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.DISCOUNT);
    } catch {}

    setToast({
      message: 'Cotización guardada exitosamente',
      submessage: `Radicado ${quoteWithPrep.quoteNumber} registrado en Mis Cotizaciones y en la nube.`,
    });

    // Asynchronously persist to Supabase relational tables: cliente -> proyecto -> especificacion_tecnica
    saveQuoteToSupabase(quoteWithPrep, currentUser).then((result) => {
      if (result.savedQuote) {
        setSavedQuotes((prev) => {
          const idx = prev.findIndex(
            (q) =>
              q.id === quoteWithPrep.id ||
              q.id === result.savedQuote.id ||
              q.quoteNumber === quoteWithPrep.quoteNumber
          );
          let nextList: Quote[];
          if (idx > -1) {
            nextList = [...prev];
            nextList[idx] = result.savedQuote;
          } else {
            nextList = [result.savedQuote, ...prev];
          }
          try {
            localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(nextList));
          } catch {}
          return nextList;
        });

        setActiveDocumentQuote((prevActive) => {
          if (
            prevActive &&
            (prevActive.id === quoteWithPrep.id ||
              prevActive.id === result.savedQuote.id ||
              prevActive.quoteNumber === quoteWithPrep.quoteNumber)
          ) {
            return result.savedQuote;
          }
          return prevActive;
        });
      }
    });

    // Dispatch automatic email notifications only if not already delivered
    if (quoteWithPrep.emailStatus !== 'Enviado') {
      const pdfAttachment = getQuotePdfBase64(quoteWithPrep);
      sendQuoteNotificationApi(quoteWithPrep, {
        pdfBase64: pdfAttachment.base64,
        pdfName: pdfAttachment.filename,
      })
        .then((res) => {
          const isOk = res.success && res.results?.ok !== false;
          if (!isOk) return;
          const verifyNote = res.pdfAdjunto ? ' (PDF adjunto: ✓)' : '';
          const msg = `Cotización guardada y enviada a ${quoteWithPrep.customer.email}${verifyNote}`;
          setActiveDocumentQuote((prev) =>
            prev && (prev.id === quoteWithPrep.id || prev.quoteNumber === quoteWithPrep.quoteNumber)
              ? { ...prev, emailStatus: 'Enviado', emailStatusMessage: msg }
              : prev
          );
          setSavedQuotes((prev) =>
            prev.map((q) =>
              q.id === quoteWithPrep.id || q.quoteNumber === quoteWithPrep.quoteNumber
                ? { ...q, emailStatus: 'Enviado', emailStatusMessage: msg }
                : q
            )
          );
        })
        .catch((err) => console.warn('Quote notify error:', err));
    }
  };

  // Order Confirmed in Academic Sandbox Checkout
  const handleOrderConfirmed = (order: OrderConfirmation) => {
    saveOrderToStorage(order, currentUser);
    setOrders((prev) => [order, ...prev.filter((o) => o.orderNumber !== order.orderNumber)]);

    const updated = savedQuotes.map((q) => {
      if (q.id === order.quoteId || q.quoteNumber === order.quoteNumber) {
        return {
          ...q,
          status: 'Aprobada' as QuoteStatus,
          order,
        };
      }
      return q;
    });

    setSavedQuotes(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(updated));
    } catch {}

    if (
      activeDocumentQuote &&
      (activeDocumentQuote.id === order.quoteId || activeDocumentQuote.quoteNumber === order.quoteNumber)
    ) {
      setActiveDocumentQuote({
        ...activeDocumentQuote,
        status: 'Aprobada',
        order,
      });
    }

    // Reset customer inputs and active cart after purchase
    resetCustomerForm();

    // Dispatch automatic purchase confirmation email via Google Apps Script
    const recipientEmail = (
      order.cliente_email ||
      order.customer?.email ||
      currentUser?.email ||
      ''
    ).trim().toLowerCase();

    const confirmedAddress = [order.deliveryAddress, order.deliveryCity]
      .filter(Boolean)
      .join(', ');

    if (recipientEmail) {
      sendGoogleEmail({
        email: recipientEmail,
        asunto: `Confirmación de Compra Pintuco Color Link - Pedido ${order.orderNumber}`,
        mensaje: [
          `Hola ${order.cliente_nombre || order.customer?.name || 'Cliente'},`,
          '',
          '¡Tu compra en Pintuco Color Link ha sido confirmada exitosamente!',
          '',
          `• Número de Pedido: ${order.orderNumber}`,
          `• Radicado de Cotización: ${order.quoteNumber}`,
          `• Dirección de Entrega Confirmada: ${confirmedAddress || 'Por confirmar'}`,
          `• Total Pagado: ${formatCOP(order.total)} COP`,
          `• Método de Pago: ${order.paymentMethod}`,
          `• Estado Actual: ${order.status}`,
          order.deliveryDate ? `• Fecha Estimada de Entrega: ${order.deliveryDate}` : '',
          '',
          'Gracias por confiar en Pintuco Color Link Colombia.',
        ]
          .filter(Boolean)
          .join('\n'),
      }).then((ok) => {
        if (ok) {
          showToast(
            `Confirmación oficial entregada a ${recipientEmail} vía Google Apps Script`,
            `Pedido ${order.orderNumber} • Entrega: ${confirmedAddress}`,
            { variant: 'success', showViewQuote: false }
          );
        }
      });
    } else {
      showToast(
        '¡Pedido y compra formalizados!',
        `Orden #${order.orderNumber} en proceso de despacho.`,
        { variant: 'success', showViewQuote: false }
      );
    }
  };

  // Admin Dispatch Management: Update order status
  const handleUpdateOrderStatus = async (orderNumber: string, newStatus: OrderStatus) => {
    if (currentUser?.rol !== 'admin') {
      showToast('Acceso Restringido', 'Solo administradores pueden cambiar el estado del pedido.', {
        showViewQuote: false,
      });
      return;
    }

    const targetOrder = orders.find((o) => o.orderNumber === orderNumber);
    const oldStatus = targetOrder?.status || 'Pendiente';
    await updateOrderStatus(orderNumber, newStatus, currentUser);
    setOrders((prev) =>
      prev.map((o) => (o.orderNumber === orderNumber ? { ...o, status: newStatus } : o))
    );
    setSavedQuotes((prev) =>
      prev.map((q) => {
        if (q.order && q.order.orderNumber === orderNumber) {
          return {
            ...q,
            order: { ...q.order, status: newStatus },
          };
        }
        return q;
      })
    );

    const clientEmail = (
      targetOrder?.cliente_email ||
      targetOrder?.customer?.email ||
      ''
    ).trim().toLowerCase();

    // Dispatch automatic dispatch-progress email to the customer via Google Apps Script
    if (targetOrder && clientEmail) {
      const confirmedAddress = [targetOrder.deliveryAddress, targetOrder.deliveryCity]
        .filter(Boolean)
        .join(', ');

      sendGoogleEmail({
        email: clientEmail,
        asunto: `Avance de Despacho Pintuco Color Link - Pedido ${orderNumber}: ${newStatus}`,
        mensaje: [
          `Hola ${targetOrder.cliente_nombre || targetOrder.customer?.name || 'Cliente'},`,
          '',
          `Te informamos que tu pedido ${orderNumber} presenta una actualización en su proceso de despacho:`,
          '',
          `• Estado anterior: ${oldStatus}`,
          `• Nuevo estado de despacho: ${newStatus}`,
          confirmedAddress ? `• Dirección de entrega: ${confirmedAddress}` : '',
          `• Radicado de referencia: ${targetOrder.quoteNumber}`,
          '',
          'Seguiremos notificándote sobre el avance hasta la entrega final.',
          '',
          'Atentamente,',
          'Logística Pintuco Color Link Colombia',
        ]
          .filter(Boolean)
          .join('\n'),
      }).then((ok) => {
        if (ok) {
          showToast(
            `Confirmación oficial entregada a ${clientEmail} vía Google Apps Script`,
            `Pedido ${orderNumber} actualizado a: ${newStatus}`,
            { variant: 'success', showViewQuote: false }
          );
        }
      });
    } else {
      showToast(
        `Estado del pedido ${orderNumber} actualizado a ${newStatus}`,
        undefined,
        { variant: 'success', showViewQuote: false }
      );
    }
  };

  // Clear current active quotation
  const handleClearQuote = () => {
    setQuoteItems([]);
    resetCustomerForm();
    setDiscountPercent(0);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.DISCOUNT);
    } catch {}
    setToast({
      message: 'Cotización limpiada',
      submessage: 'Se han retirado los productos y datos para empezar una cotización vacía.',
    });
  };

  // Duplicate quote to active cart
  const handleDuplicateQuote = (quote: Quote) => {
    setQuoteItems([...quote.items]);
    setCustomer({ ...quote.customer });
    setDiscountPercent(quote.discountPercent);
    setIncludeIva(quote.includeIva);
    setCurrentTab('cotizador');
    setToast({
      message: 'Cotización duplicada',
      submessage: `Se han cargado los productos de ${quote.quoteNumber} al cotizador.`,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete quote definitively from history & Supabase
  const handleDeleteQuote = async (quoteId: string) => {
    await deleteQuoteFromSupabase(quoteId);
    setSavedQuotes((prev) => {
      const filtered = prev.filter(
        (q) => q.id !== quoteId && q.proyecto_id !== quoteId && q.quoteNumber !== quoteId
      );
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(filtered));
        }
      } catch {}
      return filtered;
    });
    if (
      activeDocumentQuote &&
      (activeDocumentQuote.id === quoteId ||
        activeDocumentQuote.proyecto_id === quoteId ||
        activeDocumentQuote.quoteNumber === quoteId)
    ) {
      setActiveDocumentQuote(null);
      setCurrentTab('historial');
    }
    setToast({
      message: 'Cotización eliminada',
      submessage: 'Se retiró definitivamente de la nube y del historial local.',
    });
  };

  // Update quote status in history & Supabase (Admin Exclusive with Dispatch Email Simulation)
  const handleUpdateQuoteStatus = (quoteId: string, newStatus: QuoteStatus) => {
    if (currentUser?.rol !== 'admin') {
      showToast('Acceso Restringido', 'Solo los asesores y administradores pueden modificar el estado.');
      return;
    }
    updateQuoteStatusInSupabase(quoteId, newStatus, currentUser);

    const targetQuote = savedQuotes.find(
      (q) => q.id === quoteId || q.proyecto_id === quoteId || q.quoteNumber === quoteId
    );
    const oldStatus = targetQuote?.status || 'En preparación';
    const clientEmail = (targetQuote?.customer?.email || currentUser?.email || '').trim().toLowerCase();

    const updated = savedQuotes.map((q) =>
      q.id === quoteId || q.proyecto_id === quoteId ? { ...q, status: newStatus } : q
    );
    setSavedQuotes(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_QUOTES, JSON.stringify(updated));
    } catch {}

    if (
      activeDocumentQuote &&
      (activeDocumentQuote.id === quoteId || activeDocumentQuote.proyecto_id === quoteId)
    ) {
      setActiveDocumentQuote({ ...activeDocumentQuote, status: newStatus });
    }

    // Dispatch automatic real email notification to the customer about quote status change
    if (targetQuote) {
      sendQuoteStatusNotificationApi(
        { ...targetQuote, status: newStatus },
        oldStatus,
        newStatus
      ).catch((err) => console.warn('Quote status email error:', err));
    }

    showToast(
      `Estado actualizado a: ${newStatus}`,
      `Radicado ${targetQuote?.quoteNumber || quoteId} actualizado. Notificación enviada al cliente.`
    );
  };


  // Commercial Inventory Updating (Admin Exclusive)
  const handleUpdateProduct = (
    productId: string,
    newStock: number,
    updatedPresentations: ProductPresentation[]
  ) => {
    if (currentUser?.rol !== 'admin') {
      showToast('Acceso Restringido', 'Solo administradores pueden modificar el inventario comercial.');
      return;
    }

    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, stock: newStock, presentations: updatedPresentations } : p
      );
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const customRaw = localStorage.getItem('pintuco_custom_inventory_v1');
          const overrides = customRaw ? JSON.parse(customRaw) : {};
          overrides[productId] = { stock: newStock, presentations: updatedPresentations };
          localStorage.setItem('pintuco_custom_inventory_v1', JSON.stringify(overrides));
        }
      } catch {}
      return next;
    });

    showToast(
      'Inventario comercial actualizado',
      'Se modificaron las existencias y precios en bodega exitosamente.'
    );
  };

  // Start fresh new quote
  const handleNewQuote = () => {
    setQuoteItems([]);
    resetCustomerForm();
    setDiscountPercent(0);
    setActiveDocumentQuote(null);
    setCurrentTab('catalogo');
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ITEMS);
      localStorage.removeItem(STORAGE_KEYS.DISCOUNT);
    } catch {}
    setToast({
      message: 'Nueva cotización iniciada',
      submessage: 'Selecciona productos para comenzar.',
    });
  };

  // Navigation handlers
  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'cotizador') {
      if (!currentUser) {
        resetCustomerForm();
      } else {
        setCustomer(buildCustomerFromUser(currentUser));
      }
    }
    if (tab === 'historial') {
      if (!currentUser) {
        setAuthModalMode('login');
        setAuthModalOpen(true);
      } else {
        fetchQuotesFromSupabase(currentUser).then(({ quotes }) => {
          setSavedQuotes(quotes || []);
        });
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryFromHome = (category: ProductCategory) => {
    setCatalogCategory(category);
    setCatalogSearch('');
    setCurrentTab('catalogo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchFromHome = (query?: string) => {
    if (query) {
      setCatalogSearch(query);
    }
    setCatalogCategory('TODAS');
    setCurrentTab('catalogo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        cartCount={cartCount}
        cartTotal={cartSubtotal}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={() => {
          logoutUser();
          setCurrentUser(null);
          setSavedQuotes([]);
          setOrders([]);
          resetCustomerForm();
          showToast('Has cerrado sesión correctamente.', 'info');
        }}
        onOpenGasConfig={() => setGasModalOpen(true)}
      />


      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'inicio' && (
          <HomeView
            products={products}
            onSelectCategory={handleSelectCategoryFromHome}
            onNavigateToCatalog={handleSearchFromHome}
            onNavigateToCalculator={() => handleSelectTab('calculadora')}
            onNavigateToQuote={() => handleSelectTab('cotizador')}
            onNavigateToSolutions={(modId) => {
              if (modId) setSelectedSolutionModuleId(modId);
              handleSelectTab('soluciones');
            }}
            onNavigateToPalettes={() => handleSelectTab('paletas')}
            onViewProductDetails={(p) => setModalProduct(p)}
            onAddToQuote={handleAddToQuote}
          />
        )}

        {currentTab === 'soluciones' && (
          <SolutionsModuleView
            products={products}
            initialModuleId={selectedSolutionModuleId}
            onAddToQuote={handleAddToQuote}
            onNavigateToQuote={() => handleSelectTab('cotizador')}
            onViewProductDetails={(p) => setModalProduct(p)}
          />
        )}

        {currentTab === 'paletas' && (
          <ColorStudioView
            products={products}
            onAddToQuote={handleAddToQuote}
            onAddMultipleToQuote={handleAddMultipleToQuote}
            onNavigateToQuote={() => handleSelectTab('cotizador')}
          />
        )}

        {currentTab === 'catalogo' && (
          <CatalogView
            products={products}
            initialSearch={catalogSearch}
            initialCategory={catalogCategory}
            onViewProductDetails={(p) => setModalProduct(p)}
            onAddToQuote={handleAddToQuote}
            onNavigateToCalculator={() => handleSelectTab('calculadora')}
          />
        )}

        {currentTab === 'calculadora' && (
          <PaintCalculator
            products={products}
            onAddToQuote={handleAddToQuote}
            onNavigateToQuote={() => handleSelectTab('cotizador')}
          />
        )}

        {currentTab === 'cotizador' && (
          <QuoteBuilder
            items={quoteItems}
            customer={customer}
            discountPercent={discountPercent}
            includeIva={includeIva}
            currentUser={currentUser}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onUpdateCustomer={handleUpdateCustomer}
            onUpdateDiscount={setDiscountPercent}
            onToggleIva={setIncludeIva}
            onGenerateQuote={handleGenerateQuote}
            onGoToCatalog={() => handleSelectTab('catalogo')}
            onClearQuote={handleClearQuote}
          />
        )}

        {currentTab === 'documento' && activeDocumentQuote && (
          <QuoteDocument
            quote={activeDocumentQuote}
            currentUser={currentUser}
            onSaveQuote={handleSaveQuoteToStorage}
            onNewQuote={handleNewQuote}
            onBackToEditor={() => handleSelectTab('cotizador')}
            onUpdateStatus={(status) => handleUpdateQuoteStatus(activeDocumentQuote.id, status)}
            onOrderConfirmed={handleOrderConfirmed}
            onRequireAuth={(msg) => {
              setPendingCheckout(true);
              setAuthNotice(msg);
              setAuthModalMode('login');
              setAuthModalOpen(true);
              showToast('Inicio de sesión requerido', msg);
            }}
            autoOpenCheckout={autoOpenCheckoutOnDocument}
            onResetAutoOpenCheckout={() => setAutoOpenCheckoutOnDocument(false)}
          />
        )}

        {currentTab === 'historial' && (
          <QuotesHistory
            quotes={savedQuotes}
            currentUser={currentUser}
            onOpenAuth={(mode) => {
              setAuthModalMode(mode);
              setAuthModalOpen(true);
            }}
            onViewQuote={(q) => {
              setActiveDocumentQuote(q);
              setCurrentTab('documento');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDuplicateQuote={handleDuplicateQuote}
            onDeleteQuote={handleDeleteQuote}
            onUpdateStatus={handleUpdateQuoteStatus}
            onGoToCatalog={handleNewQuote}
            onRefreshQuotes={handleRefreshQuotes}
            isRefreshing={isRefreshingQuotes}
            onOpenGasConfig={() => setGasModalOpen(true)}
          />
        )}

        {currentTab === 'compras' && (
          <OrdersView
            orders={orders}
            currentUser={currentUser}
            onOpenAuth={(mode) => {
              setAuthModalMode(mode);
              setAuthModalOpen(true);
            }}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onGoToCatalog={() => handleSelectTab('catalogo')}
            onGoToQuote={() => handleSelectTab('cotizador')}
          />
        )}

        {currentTab === 'inventario' && (
          <InventoryView
            products={products}
            quotes={savedQuotes}
            currentUser={currentUser}
            onOpenAuth={(mode) => {
              setAuthModalMode(mode);
              setAuthModalOpen(true);
            }}
            onViewProductDetails={(p) => setModalProduct(p)}
            onUpdateProduct={handleUpdateProduct}
          />
        )}

        {currentTab === 'bi_dw' && (
          isDwUnlocked ? (
            <DataWarehouseView
              currentUser={currentUser}
              onLock={() => {
                try {
                  sessionStorage.removeItem('pintuco_dw_admin_unlocked');
                } catch {}
                setIsDwUnlocked(false);
              }}
            />
          ) : (
            <AdminDwAuthGate
              onSuccess={() => {
                try {
                  sessionStorage.setItem('pintuco_dw_admin_unlocked', 'true');
                } catch {}
                setIsDwUnlocked(true);
              }}
              onCancel={() => setCurrentTab('inicio')}
            />
          )
        )}

        {currentTab === 'contacto' && (
          <ContactView onOpenChatbot={() => setIsChatbotOpen(true)} />
        )}
      </main>

      {/* Product Detail Modal */}
      {modalProduct && (
        <ProductDetailModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onAddToQuote={handleAddToQuote}
        />
      )}

      {/* User Login / Register Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        authNotice={authNotice}
        onShowToast={showToast}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthNotice(undefined);
          setPendingCheckout(false);
        }}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          fetchQuotesFromSupabase(user).then(({ quotes }) => {
            setSavedQuotes(quotes || []);
            setOrders(fetchOrders(user));
          });
          setCustomer((prev) => ({
            ...prev,
            name: prev.name || user.name,
            phone: prev.phone || user.phone,
            email: prev.email || user.email,
            city: user.city || prev.city,
            idNumber: user.idNumber || prev.idNumber,
          }));
          const roleLabel = user.rol === 'admin' ? 'Asesor / Administrador Pintuco' : 'Cliente';
          showToast(`¡Bienvenido, ${user.name}! (${roleLabel})`, 'success');

          // If auth was requested from checkout attempt, return to purchase overview ready to pay
          if (pendingCheckout) {
            setPendingCheckout(false);
            setAuthNotice(undefined);
            if (activeDocumentQuote) {
              setActiveDocumentQuote({
                ...activeDocumentQuote,
                cliente_id: user.id,
                cliente_email: user.email,
                customer: {
                  ...activeDocumentQuote.customer,
                  name: activeDocumentQuote.customer.name || user.name,
                  email: user.email,
                  phone: activeDocumentQuote.customer.phone || user.phone,
                  city: activeDocumentQuote.customer.city || user.city || '',
                  address: activeDocumentQuote.customer.address || user.address || '',
                },
              });
            }
            setCurrentTab('documento');
            setAutoOpenCheckoutOnDocument(true);
          }
        }}
      />

      {/* Google Apps Script & Supabase Webhook Notification Modal */}
      <GoogleAppsScriptModal
        isOpen={gasModalOpen}
        onClose={() => setGasModalOpen(false)}
        adminEmail={GAS_DEFAULT_EMAIL}
        currentUser={currentUser}
      />


      {/* Action Notification Toast */}
      {toast && (
        <NotificationToast
          message={toast.message}
          submessage={toast.submessage}
          variant={toast.variant}
          onViewQuote={
            toast.showViewQuote === false
              ? undefined
              : () => {
                  setToast(null);
                  handleSelectTab('cotizador');
                }
          }
          onClose={() => setToast(null)}
        />
      )}

      {/* Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onSelectCategory={handleSelectCategoryFromHome}
      />

      {/* Technical Support Chatbot with Escalation to Human Advisor */}
      <TechnicalSupportChatbot
        currentUser={currentUser}
        isOpen={isChatbotOpen}
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)}
      />
    </div>
  );
}
