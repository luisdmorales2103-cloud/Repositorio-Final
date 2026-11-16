import React, { useState, useEffect } from 'react';
import { Product, ProductPresentation, ColorSwatch, ColorPalette } from '../types';
import { PINTUCO_SWATCHES, PRESET_PALETTES } from '../data/palettes';
import { formatCOP } from '../utils/formatters';
import {
  Palette,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Check,
  Layers,
  Sliders,
  Home,
  Building2,
  BedDouble,
  Plus,
  Minus,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface ColorStudioViewProps {
  products: Product[];
  onAddToQuote: (product: Product, presentation: ProductPresentation, quantity: number) => void;
  onAddMultipleToQuote?: (items: { product: Product; presentation: ProductPresentation; quantity: number }[]) => void;
  onNavigateToQuote: () => void;
}

type SurfaceTarget = 'mainWall' | 'accentWall' | 'ceiling' | 'trim';

export interface SavedUserPalette {
  id: string;
  name: string;
  roomType: 'living' | 'bedroom' | 'facade';
  date: string;
  colors: {
    mainWall: ColorSwatch;
    accentWall: ColorSwatch;
    ceiling: ColorSwatch;
    trim: ColorSwatch;
  };
}

const STORAGE_KEYS = {
  ACTIVE_PALETTE: 'pintuco_active_palette_v1',
  SAVED_PALETTES: 'pintuco_user_saved_palettes_v1',
};

export const ColorStudioView: React.FC<ColorStudioViewProps> = ({
  products,
  onAddToQuote,
  onAddMultipleToQuote,
  onNavigateToQuote,
}) => {
  // Read persisted active palette from localStorage
  const persistedActive = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_PALETTE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  // Current active palette state
  const [activeSurface, setActiveSurface] = useState<SurfaceTarget>('mainWall');
  const [roomType, setRoomType] = useState<'living' | 'bedroom' | 'facade'>(
    persistedActive?.roomType || 'living'
  );

  // Surface Colors
  const [mainWallColor, setMainWallColor] = useState<ColorSwatch>(
    persistedActive?.mainWallColor || PINTUCO_SWATCHES[1] // Blanco Hueso
  );
  const [accentWallColor, setAccentWallColor] = useState<ColorSwatch>(
    persistedActive?.accentWallColor || PINTUCO_SWATCHES[13] // Azul Zafiro
  );
  const [ceilingColor, setCeilingColor] = useState<ColorSwatch>(
    persistedActive?.ceilingColor || PINTUCO_SWATCHES[0] // Blanco Nieve
  );
  const [trimColor, setTrimColor] = useState<ColorSwatch>(
    persistedActive?.trimColor || PINTUCO_SWATCHES[4] // Gris Plomo
  );

  // Surface Quantities
  const [mainWallQty, setMainWallQty] = useState<number>(persistedActive?.mainWallQty || 2);
  const [accentWallQty, setAccentWallQty] = useState<number>(persistedActive?.accentWallQty || 1);
  const [ceilingQty, setCeilingQty] = useState<number>(persistedActive?.ceilingQty || 1);
  const [trimQty, setTrimQty] = useState<number>(persistedActive?.trimQty || 1);

  // Surface Enabled Checks
  const [includeMainWall, setIncludeMainWall] = useState<boolean>(true);
  const [includeAccentWall, setIncludeAccentWall] = useState<boolean>(true);
  const [includeCeiling, setIncludeCeiling] = useState<boolean>(true);
  const [includeTrim, setIncludeTrim] = useState<boolean>(true);

  const [customHex, setCustomHex] = useState<string>('#2563EB');
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [addedSingle, setAddedSingle] = useState<{ [key in SurfaceTarget]?: boolean }>({});
  const [savedPaletteSuccess, setSavedPaletteSuccess] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('TODOS');
  const [paletteSaveName, setPaletteSaveName] = useState<string>('');

  // User Saved Palettes list
  const [savedUserPalettes, setSavedUserPalettes] = useState<SavedUserPalette[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PALETTES);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'usr-pal-demo-01',
        name: 'Mi Sala Contemporánea (Azul & Marfil)',
        roomType: 'living',
        date: 'Guardada recientemente',
        colors: {
          mainWall: PINTUCO_SWATCHES[1],
          accentWall: PINTUCO_SWATCHES[13],
          ceiling: PINTUCO_SWATCHES[0],
          trim: PINTUCO_SWATCHES[4],
        },
      },
    ];
  });

  // Automatically save current active palette to localStorage so data is NEVER lost
  useEffect(() => {
    try {
      const activeData = {
        roomType,
        mainWallColor,
        accentWallColor,
        ceilingColor,
        trimColor,
        mainWallQty,
        accentWallQty,
        ceilingQty,
        trimQty,
      };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PALETTE, JSON.stringify(activeData));
    } catch {
      // storage error fallback
    }
  }, [roomType, mainWallColor, accentWallColor, ceilingColor, trimColor, mainWallQty, accentWallQty, ceilingQty, trimQty]);

  // Sync user saved palettes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PALETTES, JSON.stringify(savedUserPalettes));
    } catch {}
  }, [savedUserPalettes]);

  // Assigned default products
  const wallProduct = products.find((p) => p.id === 'hog-001') || products[0]; // VinilPro
  const accentProduct = products.find((p) => p.id === 'hog-002') || products[1]; // SuperWash
  const ceilingProduct = products.find((p) => p.id === 'hog-003') || products[2]; // Antihongos Techos
  const trimProduct = products.find((p) => p.id === 'hog-007') || products[6]; // Esmalte Sintético

  const [mainWallPresName, setMainWallPresName] = useState<string>(
    wallProduct?.presentations.find((p) => p.name.includes('1 gal'))?.name || wallProduct?.presentations[0]?.name || ''
  );
  const [accentWallPresName, setAccentWallPresName] = useState<string>(
    accentProduct?.presentations.find((p) => p.name.includes('1 gal'))?.name || accentProduct?.presentations[0]?.name || ''
  );
  const [ceilingPresName, setCeilingPresName] = useState<string>(
    ceilingProduct?.presentations.find((p) => p.name.includes('1 gal'))?.name || ceilingProduct?.presentations[0]?.name || ''
  );
  const [trimPresName, setTrimPresName] = useState<string>(
    trimProduct?.presentations[0]?.name || ''
  );

  // Surface config labels
  const surfaces: { key: SurfaceTarget; label: string; desc: string; current: ColorSwatch }[] = [
    { key: 'mainWall', label: 'Pared Principal (60%)', desc: 'Color dominante en muros', current: mainWallColor },
    { key: 'accentWall', label: 'Pared de Acento (30%)', desc: 'Pared focal o cabecero', current: accentWallColor },
    { key: 'ceiling', label: 'Techo / Cielorraso', desc: 'Apertura de luz cenital', current: ceilingColor },
    { key: 'trim', label: 'Zócalos & Molduras (10%)', desc: 'Marcos, puertas y rodapiés', current: trimColor },
  ];

  const handleApplyColor = (swatch: ColorSwatch) => {
    switch (activeSurface) {
      case 'mainWall':
        setMainWallColor(swatch);
        break;
      case 'accentWall':
        setAccentWallColor(swatch);
        break;
      case 'ceiling':
        setCeilingColor(swatch);
        break;
      case 'trim':
        setTrimColor(swatch);
        break;
    }
  };

  const handleApplyPresetPalette = (palette: ColorPalette) => {
    setMainWallColor(palette.colors.mainWall);
    setAccentWallColor(palette.colors.accentWall);
    setCeilingColor(palette.colors.ceiling);
    setTrimColor(palette.colors.trim);
    if (palette.roomType !== 'office') {
      setRoomType(palette.roomType as any);
    }
  };

  // Load a user-saved palette
  const handleLoadUserSavedPalette = (palette: SavedUserPalette) => {
    setMainWallColor(palette.colors.mainWall);
    setAccentWallColor(palette.colors.accentWall);
    setCeilingColor(palette.colors.ceiling);
    setTrimColor(palette.colors.trim);
    setRoomType(palette.roomType);
  };

  // Save current palette to user's saved list
  const handleSaveCurrentPalette = () => {
    const name = paletteSaveName.trim() || `Paleta ${mainWallColor.name} & ${accentWallColor.name}`;
    const newSaved: SavedUserPalette = {
      id: `pal-usr-${Date.now()}`,
      name,
      roomType,
      date: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
      colors: {
        mainWall: mainWallColor,
        accentWall: accentWallColor,
        ceiling: ceilingColor,
        trim: trimColor,
      },
    };

    setSavedUserPalettes([newSaved, ...savedUserPalettes]);
    setPaletteSaveName('');
    setSavedPaletteSuccess(true);
    setTimeout(() => setSavedPaletteSuccess(false), 3000);
  };

  const handleDeleteUserPalette = (id: string) => {
    setSavedUserPalettes(savedUserPalettes.filter((p) => p.id !== id));
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomHex(hex);
    const customSwatch: ColorSwatch = {
      id: `custom-${Date.now()}`,
      name: `Tono Especial (${hex.toUpperCase()})`,
      hex: hex,
      category: 'Acento',
      description: 'Color preparado a medida por el usuario',
    };
    handleApplyColor(customSwatch);
  };

  const handleRandomize = () => {
    const randomMain = PINTUCO_SWATCHES[Math.floor(Math.random() * 6)];
    const randomAccent = PINTUCO_SWATCHES[6 + Math.floor(Math.random() * (PINTUCO_SWATCHES.length - 6))];
    const randomCeiling = PINTUCO_SWATCHES[0];
    const randomTrim = PINTUCO_SWATCHES[Math.floor(Math.random() * PINTUCO_SWATCHES.length)];

    setMainWallColor(randomMain);
    setAccentWallColor(randomAccent);
    setCeilingColor(randomCeiling);
    setTrimColor(randomTrim);
  };

  const handleResetToDefaults = () => {
    setMainWallColor(PINTUCO_SWATCHES[1]);
    setAccentWallColor(PINTUCO_SWATCHES[13]);
    setCeilingColor(PINTUCO_SWATCHES[0]);
    setTrimColor(PINTUCO_SWATCHES[4]);
    setRoomType('living');
  };

  // Add all selected surfaces to quote with exact colors, tags, and presentations
  const handleAddPaletteToQuote = () => {
    const itemsToAdd: { product: Product; presentation: ProductPresentation; quantity: number }[] = [];

    // 1. Main Wall
    if (includeMainWall && wallProduct) {
      const pres = wallProduct.presentations.find((p) => p.name === mainWallPresName) || wallProduct.presentations[0];
      const customProd: Product = {
        ...wallProduct,
        id: `${wallProduct.id}-mainWall-${mainWallColor.id}`,
        name: `${wallProduct.name} [Pared Principal] - ${mainWallColor.name}`,
        colorName: mainWallColor.name,
        colorHex: mainWallColor.hex,
        surfaceTag: 'Pared Principal',
      };
      itemsToAdd.push({ product: customProd, presentation: pres, quantity: mainWallQty });
    }

    // 2. Accent Wall
    if (includeAccentWall && accentProduct) {
      const pres = accentProduct.presentations.find((p) => p.name === accentWallPresName) || accentProduct.presentations[0];
      const customProd: Product = {
        ...accentProduct,
        id: `${accentProduct.id}-accentWall-${accentWallColor.id}`,
        name: `${accentProduct.name} [Pared de Acento] - ${accentWallColor.name}`,
        colorName: accentWallColor.name,
        colorHex: accentWallColor.hex,
        surfaceTag: 'Pared de Acento',
      };
      itemsToAdd.push({ product: customProd, presentation: pres, quantity: accentWallQty });
    }

    // 3. Ceiling
    if (includeCeiling && ceilingProduct) {
      const pres = ceilingProduct.presentations.find((p) => p.name === ceilingPresName) || ceilingProduct.presentations[0];
      const customProd: Product = {
        ...ceilingProduct,
        id: `${ceilingProduct.id}-ceiling-${ceilingColor.id}`,
        name: `${ceilingProduct.name} [Techo / Cielorraso] - ${ceilingColor.name}`,
        colorName: ceilingColor.name,
        colorHex: ceilingColor.hex,
        surfaceTag: 'Techo / Cielorraso',
      };
      itemsToAdd.push({ product: customProd, presentation: pres, quantity: ceilingQty });
    }

    // 4. Trim / Molduras
    if (includeTrim && trimProduct) {
      const pres = trimProduct.presentations.find((p) => p.name === trimPresName) || trimProduct.presentations[0];
      const customProd: Product = {
        ...trimProduct,
        id: `${trimProduct.id}-trim-${trimColor.id}`,
        name: `${trimProduct.name} [Zócalos & Molduras] - ${trimColor.name}`,
        colorName: trimColor.name,
        colorHex: trimColor.hex,
        surfaceTag: 'Zócalos & Molduras',
      };
      itemsToAdd.push({ product: customProd, presentation: pres, quantity: trimQty });
    }

    if (itemsToAdd.length > 0) {
      if (onAddMultipleToQuote) {
        onAddMultipleToQuote(itemsToAdd);
      } else {
        itemsToAdd.forEach((it) => onAddToQuote(it.product, it.presentation, it.quantity));
      }
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3000);
    }
  };

  // Add individual surface
  const handleAddSingleSurface = (surfaceKey: SurfaceTarget) => {
    if (surfaceKey === 'mainWall' && wallProduct) {
      const pres = wallProduct.presentations.find((p) => p.name === mainWallPresName) || wallProduct.presentations[0];
      onAddToQuote(
        {
          ...wallProduct,
          id: `${wallProduct.id}-mainWall-${mainWallColor.id}`,
          name: `${wallProduct.name} [Pared Principal] - ${mainWallColor.name}`,
          colorName: mainWallColor.name,
          colorHex: mainWallColor.hex,
          surfaceTag: 'Pared Principal',
        },
        pres,
        mainWallQty
      );
    } else if (surfaceKey === 'accentWall' && accentProduct) {
      const pres = accentProduct.presentations.find((p) => p.name === accentWallPresName) || accentProduct.presentations[0];
      onAddToQuote(
        {
          ...accentProduct,
          id: `${accentProduct.id}-accentWall-${accentWallColor.id}`,
          name: `${accentProduct.name} [Pared de Acento] - ${accentWallColor.name}`,
          colorName: accentWallColor.name,
          colorHex: accentWallColor.hex,
          surfaceTag: 'Pared de Acento',
        },
        pres,
        accentWallQty
      );
    } else if (surfaceKey === 'ceiling' && ceilingProduct) {
      const pres = ceilingProduct.presentations.find((p) => p.name === ceilingPresName) || ceilingProduct.presentations[0];
      onAddToQuote(
        {
          ...ceilingProduct,
          id: `${ceilingProduct.id}-ceiling-${ceilingColor.id}`,
          name: `${ceilingProduct.name} [Techo / Cielorraso] - ${ceilingColor.name}`,
          colorName: ceilingColor.name,
          colorHex: ceilingColor.hex,
          surfaceTag: 'Techo / Cielorraso',
        },
        pres,
        ceilingQty
      );
    } else if (surfaceKey === 'trim' && trimProduct) {
      const pres = trimProduct.presentations.find((p) => p.name === trimPresName) || trimProduct.presentations[0];
      onAddToQuote(
        {
          ...trimProduct,
          id: `${trimProduct.id}-trim-${trimColor.id}`,
          name: `${trimProduct.name} [Zócalos & Molduras] - ${trimColor.name}`,
          colorName: trimColor.name,
          colorHex: trimColor.hex,
          surfaceTag: 'Zócalos & Molduras',
        },
        pres,
        trimQty
      );
    }

    setAddedSingle((prev) => ({ ...prev, [surfaceKey]: true }));
    setTimeout(() => {
      setAddedSingle((prev) => ({ ...prev, [surfaceKey]: false }));
    }, 2500);
  };

  // Calculate total price of current configured palette
  const calculatePaletteEstimate = () => {
    let sum = 0;
    if (includeMainWall && wallProduct) {
      const pres = wallProduct.presentations.find((p) => p.name === mainWallPresName) || wallProduct.presentations[0];
      sum += (pres?.price || 0) * mainWallQty;
    }
    if (includeAccentWall && accentProduct) {
      const pres = accentProduct.presentations.find((p) => p.name === accentWallPresName) || accentProduct.presentations[0];
      sum += (pres?.price || 0) * accentWallQty;
    }
    if (includeCeiling && ceilingProduct) {
      const pres = ceilingProduct.presentations.find((p) => p.name === ceilingPresName) || ceilingProduct.presentations[0];
      sum += (pres?.price || 0) * ceilingQty;
    }
    if (includeTrim && trimProduct) {
      const pres = trimProduct.presentations.find((p) => p.name === trimPresName) || trimProduct.presentations[0];
      sum += (pres?.price || 0) * trimQty;
    }
    return sum;
  };

  const filteredSwatches = PINTUCO_SWATCHES.filter(
    (s) => filterCategory === 'TODOS' || s.category === filterCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
            <span>Estudio de Color & Simulador Arquitectónico</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">
            Paletas de Colores & Combinador
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Tus selecciones y combinaciones de color quedan guardadas automáticamente en tu dispositivo.
            Elige los tonos para cada pared, techo y molduras, guárdalos como paletas personalizadas y cotízalos al instante.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Restablecer a colores estándar"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>

          <button
            type="button"
            onClick={handleRandomize}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Combinación Aleatoria</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Room Visualizer Simulator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl overflow-hidden text-white">
            {/* Visualizer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Simulador de Espacio 2D Interactivo
              </span>

              {/* Room selector buttons */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setRoomType('living')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    roomType === 'living' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sala</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomType('bedroom')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    roomType === 'bedroom' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BedDouble className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Alcoba</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoomType('facade')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    roomType === 'facade' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fachada</span>
                </button>
              </div>
            </div>

            {/* Architectural SVG Space Viewport */}
            <div className="relative mt-4 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2">
              <svg
                viewBox="0 0 600 380"
                className="w-full h-auto max-h-[380px] drop-shadow-md select-none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Subtle shadows & floor perspective */}
                  <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1E293B" />
                  </linearGradient>

                  <linearGradient id="windowLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>

                  <filter id="wallShadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="-4" dy="0" stdDeviation="6" floodColor="#000" floodOpacity="0.25" />
                  </filter>
                </defs>

                {roomType === 'living' && (
                  <>
                    {/* Ceiling */}
                    <polygon
                      points="0,0 600,0 490,65 110,65"
                      fill={ceilingColor.hex}
                      className="cursor-pointer transition-colors duration-300 hover:opacity-90"
                      onClick={() => setActiveSurface('ceiling')}
                    />

                    {/* Floor with wooden / tiled planks */}
                    <polygon points="0,380 600,380 490,290 110,290" fill="url(#floorGrad)" />
                    {/* Floor perspective lines */}
                    <line x1="300" y1="290" x2="300" y2="380" stroke="#334155" strokeWidth="1" />
                    <line x1="200" y1="290" x2="150" y2="380" stroke="#334155" strokeWidth="1" />
                    <line x1="400" y1="290" x2="450" y2="380" stroke="#334155" strokeWidth="1" />

                    {/* Left Wall (Main Wall) */}
                    <polygon
                      points="0,0 110,65 110,290 0,380"
                      fill={mainWallColor.hex}
                      className="cursor-pointer transition-colors duration-300 hover:opacity-90"
                      onClick={() => setActiveSurface('mainWall')}
                    />

                    {/* Window on Left Wall */}
                    <polygon points="20,110 80,125 80,240 20,260" fill="#E0F2FE" opacity="0.8" />
                    <polygon points="20,110 80,125 80,240 20,260" fill="url(#windowLight)" />
                    <line x1="50" y1="118" x2="50" y2="250" stroke={trimColor.hex} strokeWidth="3" />

                    {/* Right Wall (Main Wall continued) */}
                    <polygon
                      points="600,0 490,65 490,290 600,380"
                      fill={mainWallColor.hex}
                      className="cursor-pointer transition-colors duration-300 hover:opacity-90"
                      onClick={() => setActiveSurface('mainWall')}
                    />

                    {/* Door / Trim on Right Wall */}
                    <polygon
                      points="520,120 575,95 575,340 520,310"
                      fill={trimColor.hex}
                      className="cursor-pointer transition-colors duration-300 hover:opacity-90"
                      onClick={() => setActiveSurface('trim')}
                    />

                    {/* Center Accent Wall */}
                    <rect
                      x="110"
                      y="65"
                      width="380"
                      height="225"
                      fill={accentWallColor.hex}
                      filter="url(#wallShadow)"
                      className="cursor-pointer transition-colors duration-300 hover:opacity-90"
                      onClick={() => setActiveSurface('accentWall')}
                    />

                    {/* Modern Baseboard / Skirting Board (Trim) */}
                    <rect
                      x="110"
                      y="282"
                      width="380"
                      height="8"
                      fill={trimColor.hex}
                      className="cursor-pointer transition-colors duration-300"
                      onClick={() => setActiveSurface('trim')}
                    />

                    {/* Art frame on center accent wall */}
                    <rect x="230" y="95" width="140" height="90" fill="#FFFFFF" stroke={trimColor.hex} strokeWidth="4" rx="2" />
                    <circle cx="300" cy="140" r="22" fill={mainWallColor.hex} opacity="0.7" />
                    <path d="M 260 170 Q 300 130, 340 170 Z" fill={accentWallColor.hex} opacity="0.5" />

                    {/* Modern Designer Sofa */}
                    <rect x="180" y="240" width="240" height="48" rx="8" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                    <rect x="200" y="215" width="200" height="35" rx="6" fill="#334155" />
                    <rect x="165" y="235" width="25" height="50" rx="4" fill="#334155" />
                    <rect x="410" y="235" width="25" height="50" rx="4" fill="#334155" />
                    {/* Cushions matching trim or accent */}
                    <rect x="215" y="225" width="35" height="30" rx="4" fill={trimColor.hex} opacity="0.9" />
                    <rect x="350" y="225" width="35" height="30" rx="4" fill={mainWallColor.hex} opacity="0.9" />

                    {/* Plant pot in corner */}
                    <ellipse cx="140" cy="290" rx="14" ry="5" fill="#0F172A" opacity="0.4" />
                    <path d="M 130 270 L 150 270 L 146 290 L 134 290 Z" fill="#9A3412" />
                    <circle cx="140" cy="255" r="16" fill="#15803D" opacity="0.9" />
                    <circle cx="132" cy="245" r="12" fill="#16A34A" opacity="0.9" />
                    <circle cx="148" cy="248" r="12" fill="#22C55E" opacity="0.9" />
                  </>
                )}

                {roomType === 'bedroom' && (
                  <>
                    {/* Bedroom Perspective */}
                    <polygon points="0,0 600,0 480,55 120,55" fill={ceilingColor.hex} onClick={() => setActiveSurface('ceiling')} />
                    <polygon points="0,380 600,380 480,300 120,300" fill="url(#floorGrad)" />

                    {/* Left Main Wall */}
                    <polygon points="0,0 120,55 120,300 0,380" fill={mainWallColor.hex} onClick={() => setActiveSurface('mainWall')} />
                    {/* Right Main Wall */}
                    <polygon points="600,0 480,55 480,300 600,380" fill={mainWallColor.hex} onClick={() => setActiveSurface('mainWall')} />

                    {/* Accent Bed Headboard Wall */}
                    <rect x="120" y="55" width="360" height="245" fill={accentWallColor.hex} onClick={() => setActiveSurface('accentWall')} />
                    {/* Trim skirting */}
                    <rect x="120" y="293" width="360" height="7" fill={trimColor.hex} onClick={() => setActiveSurface('trim')} />

                    {/* Bed */}
                    <rect x="200" y="160" width="200" height="70" rx="6" fill={trimColor.hex} />
                    <rect x="180" y="220" width="240" height="90" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                    <rect x="190" y="250" width="220" height="60" rx="4" fill={mainWallColor.hex} opacity="0.85" />
                    {/* Pillows */}
                    <rect x="205" y="195" width="70" height="30" rx="4" fill="#FFFFFF" />
                    <rect x="325" y="195" width="70" height="30" rx="4" fill="#FFFFFF" />
                  </>
                )}

                {roomType === 'facade' && (
                  <>
                    {/* Sky */}
                    <rect x="0" y="0" width="600" height="380" fill="#BAE6FD" opacity="0.4" />
                    {/* Ground */}
                    <rect x="0" y="300" width="600" height="80" fill="#334155" />

                    {/* Main Building Body */}
                    <rect x="100" y="80" width="400" height="220" fill={mainWallColor.hex} onClick={() => setActiveSurface('mainWall')} />

                    {/* Accent Architectural Volume / Balcony */}
                    <rect x="150" y="100" width="150" height="150" fill={accentWallColor.hex} filter="url(#wallShadow)" onClick={() => setActiveSurface('accentWall')} />

                    {/* Roof Cornice (Ceiling Color) */}
                    <rect x="90" y="70" width="420" height="14" fill={ceilingColor.hex} onClick={() => setActiveSurface('ceiling')} />

                    {/* Windows & Doors (Trim Color) */}
                    <rect x="340" y="120" width="65" height="75" fill="#F0F9FF" stroke={trimColor.hex} strokeWidth="6" />
                    <rect x="340" y="220" width="60" height="80" fill={trimColor.hex} onClick={() => setActiveSurface('trim')} />
                    <rect x="180" y="130" width="90" height="80" fill="#F0F9FF" stroke={trimColor.hex} strokeWidth="5" />
                  </>
                )}
              </svg>

              {/* Click Surface Floating Indicator */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2 pointer-events-none">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Haz clic sobre el techo o paredes del simulador para seleccionarlo</span>
              </div>
            </div>

            {/* Surface Selector Pills */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {surfaces.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveSurface(s.key)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    activeSurface === s.key
                      ? 'border-amber-400 bg-slate-800 text-white shadow-md ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-400 shrink-0 shadow-xs"
                      style={{ backgroundColor: s.current.hex }}
                    />
                    <span className="font-bold text-xs truncate text-white">
                      {s.label.split(' ')[0]} {s.label.split(' ')[1]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {s.current.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Surface-by-Surface Quotation Configuration Panel */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Desglose de Pinturas y Colores para tu Cotización
                </h3>
                <p className="text-xs text-slate-500">
                  Configura cada superficie con su presentación y cantidad para agregar a tu presupuesto.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Estimado Paleta:</span>
                  <span className="text-lg font-black text-blue-900 font-display tabular-nums">
                    {formatCOP(calculatePaletteEstimate())} COP
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddPaletteToQuote}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                  }`}
                  title="Agregar todos los colores seleccionados al cotizador"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {addedSuccess
                      ? '¡Agregados!'
                      : `+ Cotizar Todos (${[includeMainWall, includeAccentWall, includeCeiling, includeTrim].filter(Boolean).length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* List of 4 surfaces */}
            <div className="space-y-3">
              {/* 1. Pared Principal */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeMainWall}
                    onChange={(e) => setIncludeMainWall(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    title="Incluir en cotización"
                  />
                  <span
                    className="w-6 h-6 rounded-full border border-slate-300 shrink-0 shadow-xs"
                    style={{ backgroundColor: mainWallColor.hex }}
                  />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Pared Principal:</span>
                      <span className="text-blue-700">{mainWallColor.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({mainWallColor.hex})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pintura: {wallProduct?.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <select
                    value={mainWallPresName}
                    onChange={(e) => setMainWallPresName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
                  >
                    {wallProduct?.presentations.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({formatCOP(p.price)})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setMainWallQty(Math.max(1, mainWallQty - 1))}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs">{mainWallQty}</span>
                    <button
                      type="button"
                      onClick={() => setMainWallQty(mainWallQty + 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSingleSurface('mainWall')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      addedSingle.mainWall
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                    title="Agregar solo esta pintura"
                  >
                    {addedSingle.mainWall ? '✓ Agregado' : '+ Cotizar'}
                  </button>
                </div>
              </div>

              {/* 2. Pared de Acento */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeAccentWall}
                    onChange={(e) => setIncludeAccentWall(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    title="Incluir en cotización"
                  />
                  <span
                    className="w-6 h-6 rounded-full border border-slate-300 shrink-0 shadow-xs"
                    style={{ backgroundColor: accentWallColor.hex }}
                  />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Pared de Acento:</span>
                      <span className="text-blue-700">{accentWallColor.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({accentWallColor.hex})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pintura: {accentProduct?.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <select
                    value={accentWallPresName}
                    onChange={(e) => setAccentWallPresName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
                  >
                    {accentProduct?.presentations.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({formatCOP(p.price)})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setAccentWallQty(Math.max(1, accentWallQty - 1))}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs">{accentWallQty}</span>
                    <button
                      type="button"
                      onClick={() => setAccentWallQty(accentWallQty + 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSingleSurface('accentWall')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      addedSingle.accentWall
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {addedSingle.accentWall ? '✓ Agregado' : '+ Cotizar'}
                  </button>
                </div>
              </div>

              {/* 3. Techo / Cielorraso */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeCeiling}
                    onChange={(e) => setIncludeCeiling(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    title="Incluir en cotización"
                  />
                  <span
                    className="w-6 h-6 rounded-full border border-slate-300 shrink-0 shadow-xs"
                    style={{ backgroundColor: ceilingColor.hex }}
                  />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Techo / Cielorraso:</span>
                      <span className="text-blue-700">{ceilingColor.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({ceilingColor.hex})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pintura: {ceilingProduct?.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <select
                    value={ceilingPresName}
                    onChange={(e) => setCeilingPresName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
                  >
                    {ceilingProduct?.presentations.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({formatCOP(p.price)})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setCeilingQty(Math.max(1, ceilingQty - 1))}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs">{ceilingQty}</span>
                    <button
                      type="button"
                      onClick={() => setCeilingQty(ceilingQty + 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSingleSurface('ceiling')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      addedSingle.ceiling
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {addedSingle.ceiling ? '✓ Agregado' : '+ Cotizar'}
                  </button>
                </div>
              </div>

              {/* 4. Zócalos & Molduras */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeTrim}
                    onChange={(e) => setIncludeTrim(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    title="Incluir en cotización"
                  />
                  <span
                    className="w-6 h-6 rounded-full border border-slate-300 shrink-0 shadow-xs"
                    style={{ backgroundColor: trimColor.hex }}
                  />
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Zócalos & Molduras:</span>
                      <span className="text-blue-700">{trimColor.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({trimColor.hex})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pintura: {trimProduct?.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-end">
                  <select
                    value={trimPresName}
                    onChange={(e) => setTrimPresName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none"
                  >
                    {trimProduct?.presentations.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} ({formatCOP(p.price)})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setTrimQty(Math.max(1, trimQty - 1))}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs">{trimQty}</span>
                    <button
                      type="button"
                      onClick={() => setTrimQty(trimQty + 1)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSingleSurface('trim')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      addedSingle.trim
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {addedSingle.trim ? '✓ Agregado' : '+ Cotizar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Master Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddPaletteToQuote}
                className={`w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer ${
                  addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>¡Colores Guardados y Agregados a la Cotización!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Guardar y Cotizar Colores de mi Combinación</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNavigateToQuote}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer"
              >
                <span>Ir al Cotizador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Color Swatches Palette, Custom Mixer & Mis Paletas Guardadas */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Surface Inspector & Custom Mixer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  Editando Color Para:
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {surfaces.find((s) => s.key === activeSurface)?.label}
                </h3>
              </div>

              {/* Active Color Preview Badge */}
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span
                  className="w-5 h-5 rounded-full border border-slate-300 shadow-xs"
                  style={{
                    backgroundColor:
                      activeSurface === 'mainWall'
                        ? mainWallColor.hex
                        : activeSurface === 'accentWall'
                        ? accentWallColor.hex
                        : activeSurface === 'ceiling'
                        ? ceilingColor.hex
                        : trimColor.hex,
                  }}
                />
                <span className="text-xs font-bold text-slate-800 tabular-nums">
                  {activeSurface === 'mainWall'
                    ? mainWallColor.hex
                    : activeSurface === 'accentWall'
                    ? accentWallColor.hex
                    : activeSurface === 'ceiling'
                    ? ceilingColor.hex
                    : trimColor.hex}
                </span>
              </div>
            </div>

            {/* Custom HEX / Color Picker */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Selector a Medida:</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer overflow-hidden p-0 bg-transparent"
                  title="Elegir color libre"
                />
                <input
                  type="text"
                  maxLength={7}
                  value={customHex}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 text-center uppercase outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Swatch Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none text-[11px] font-semibold text-slate-600">
              {['TODOS', 'Neutro', 'Cálido', 'Frío', 'Tierra', 'Acento', 'Pastel'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 24 Pintuco Swatches Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 max-h-[280px] overflow-y-auto pr-1">
              {filteredSwatches.map((swatch) => {
                const isSelected =
                  (activeSurface === 'mainWall' && mainWallColor.hex === swatch.hex) ||
                  (activeSurface === 'accentWall' && accentWallColor.hex === swatch.hex) ||
                  (activeSurface === 'ceiling' && ceilingColor.hex === swatch.hex) ||
                  (activeSurface === 'trim' && trimColor.hex === swatch.hex);

                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => handleApplyColor(swatch)}
                    className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2.5 group cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs shrink-0 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-slate-900 truncate">
                        {swatch.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {swatch.hex}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save My Palette Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 border border-slate-800 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                Guardar Mi Paleta Personalizada
              </h4>
              <span className="text-[10px] text-slate-400">Guarda en tu dispositivo</span>
            </div>

            <p className="text-xs text-slate-300">
              Asigna un nombre a los 4 colores actuales para tenerlos guardados permanentemente.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={paletteSaveName}
                onChange={(e) => setPaletteSaveName(e.target.value)}
                placeholder="Ej: Sala Familiar o Fachada Casa"
                className="flex-1 px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={handleSaveCurrentPalette}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
              >
                {savedPaletteSuccess ? (
                  <span className="flex items-center gap-1 text-emerald-950 font-black">
                    <BookmarkCheck className="w-4 h-4" /> ¡Guardada!
                  </span>
                ) : (
                  <span>Guardar Paleta</span>
                )}
              </button>
            </div>
          </div>

          {/* Mis Paletas Guardadas List */}
          {savedUserPalettes.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Mis Paletas Guardadas ({savedUserPalettes.length})
                </h4>
                <span className="text-[10px] text-slate-400">Permanentes en tu cuenta</span>
              </div>

              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {savedUserPalettes.map((pal) => (
                  <div
                    key={pal.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/60 hover:bg-blue-50/20 transition-all flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {pal.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {pal.date} · {pal.roomType === 'living' ? 'Sala' : pal.roomType === 'bedroom' ? 'Alcoba' : 'Fachada'}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300"
                          style={{ backgroundColor: pal.colors.mainWall.hex }}
                          title={`Muros: ${pal.colors.mainWall.name}`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300"
                          style={{ backgroundColor: pal.colors.accentWall.hex }}
                          title={`Acento: ${pal.colors.accentWall.name}`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300"
                          style={{ backgroundColor: pal.colors.ceiling.hex }}
                          title={`Techo: ${pal.colors.ceiling.name}`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300"
                          style={{ backgroundColor: pal.colors.trim.hex }}
                          title={`Molduras: ${pal.colors.trim.name}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadUserSavedPalette(pal)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        title="Ver en simulador"
                      >
                        Cargar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUserPalette(pal.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                        title="Eliminar de mis paletas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curated Preset Palettes Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Paletas Recomendadas de Tendencia
            </h4>
            <p className="text-xs text-slate-500">
              Combinaciones armónicas preconfiguradas por arquitectos y coloristas.
            </p>

            <div className="space-y-2.5 mt-2">
              {PRESET_PALETTES.map((palette) => (
                <div
                  key={palette.id}
                  onClick={() => handleApplyPresetPalette(palette)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">
                      {palette.category}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      {palette.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {palette.description}
                    </p>
                  </div>

                  {/* 4 Swatches row */}
                  <div className="flex items-center gap-1 shrink-0 p-1 bg-slate-100 rounded-lg">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: palette.colors.mainWall.hex }}
                      title={`Pared: ${palette.colors.mainWall.name}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: palette.colors.accentWall.hex }}
                      title={`Acento: ${palette.colors.accentWall.name}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: palette.colors.ceiling.hex }}
                      title={`Techo: ${palette.colors.ceiling.name}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: palette.colors.trim.hex }}
                      title={`Molduras: ${palette.colors.trim.name}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
