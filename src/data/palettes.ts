import { ColorSwatch, ColorPalette } from '../types';

export const PINTUCO_SWATCHES: ColorSwatch[] = [
  // Neutros & Blancos
  { id: 'sw-01', name: 'Blanco Nieve Alabastro', hex: '#FFFFFF', category: 'Neutro', description: 'Blanco puro de máxima luminosidad y pureza óptica.' },
  { id: 'sw-02', name: 'Blanco Hueso Suave', hex: '#F8F6F0', category: 'Neutro', description: 'Tono marfil relajante ideal para grandes superficies.' },
  { id: 'sw-03', name: 'Gris Urbano Claro', hex: '#E2E8F0', category: 'Neutro', description: 'Gris contemporáneo sutil que amplifica la luz natural.' },
  { id: 'sw-04', name: 'Gris Cemento Medio', hex: '#94A3B8', category: 'Neutro', description: 'Tono arquitectónico neutro para contrastes modernos.' },
  { id: 'sw-05', name: 'Gris Plomo Oscuro', hex: '#334155', category: 'Neutro', description: 'Carácter sobrio y elegante para paredes focales.' },
  { id: 'sw-06', name: 'Negro Ónix Profundo', hex: '#0F172A', category: 'Neutro', description: 'Máxima profundidad y sofisticación en molduras y acentos.' },

  // Tierra & Cálidos
  { id: 'sw-07', name: 'Terracota Colonial', hex: '#C25E3E', category: 'Tierra', description: 'Inspiración en la arcilla tradicional colombiana.' },
  { id: 'sw-08', name: 'Ocre Andino', hex: '#D97706', category: 'Tierra', description: 'Calidez dorada de cordillera que aporta vitalidad.' },
  { id: 'sw-09', name: 'Arena del Desierto', hex: '#FDE68A', category: 'Cálido', description: 'Tono arena cálido para ambientes acogedores.' },
  { id: 'sw-10', name: 'Canela Tostada', hex: '#92400E', category: 'Tierra', description: 'Marrón especiado perfecto para maderas y calidez.' },
  { id: 'sw-11', name: 'Melocotón Silvestre', hex: '#FED7AA', category: 'Pastel', description: 'Calidez sutil con matices sonrosados suaves.' },
  { id: 'sw-12', name: 'Mostaza Colonial', hex: '#B45309', category: 'Cálido', description: 'Acento rústico de gran energía estética.' },

  // Fríos & Azules
  { id: 'sw-13', name: 'Azul Caribe Profundo', hex: '#1E3A8A', category: 'Frío', description: 'Azul cobalto intenso de serenidad marina.' },
  { id: 'sw-14', name: 'Azul Zafiro Andino', hex: '#2563EB', category: 'Frío', description: 'Color emblemático tecnológico y luminoso.' },
  { id: 'sw-15', name: 'Celeste Niebla', hex: '#BAE6FD', category: 'Frío', description: 'Azul cielo translúcido que refresca el espacio.' },
  { id: 'sw-16', name: 'Azul Petróleo Profundo', hex: '#0E7490', category: 'Frío', description: 'Elegancia oceánica para bibliotecas y salas.' },
  { id: 'sw-17', name: 'Índigo Crepúsculo', hex: '#312E81', category: 'Frío', description: 'Azul noche de serenidad para dormitorios principales.' },

  // Verdes & Botánicos
  { id: 'sw-18', name: 'Verde Eucalipto Salvia', hex: '#84A98C', category: 'Frío', description: 'Verde salvia botánico de tendencia biofílica.' },
  { id: 'sw-19', name: 'Verde Oliva Café', hex: '#4D7C0F', category: 'Tierra', description: 'Tono orgánico inspirado en los cafetales colombianos.' },
  { id: 'sw-20', name: 'Verde Selva Esmeralda', hex: '#065F46', category: 'Frío', description: 'Profundidad vegetal exuberante y distinguida.' },
  { id: 'sw-21', name: 'Menta Fresca', hex: '#A7F3D0', category: 'Pastel', description: 'Frescura ligera para baños y cocinas luminosas.' },

  // Acentos Vivos & Contemporáneos
  { id: 'sw-22', name: 'Amarillo Tráfico Señal', hex: '#EAB308', category: 'Acento', description: 'Luminosidad pura y contraste de alta visibilidad.' },
  { id: 'sw-23', name: 'Rojo Pasión Carmesí', hex: '#DC2626', category: 'Acento', description: 'Impacto visual fuerte para acentos decorativos.' },
  { id: 'sw-24', name: 'Coral Atardecer', hex: '#FB7185', category: 'Acento', description: 'Calidez moderna para comedores y salas dinámicas.' },
];

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'pal-01',
    title: 'Nórdico Sereno',
    category: 'Tendencia 2026',
    description: 'Armonía escandinava que maximiza la luz con blancos puros, grises suaves y un acento verde salvia calmante.',
    roomType: 'living',
    colors: {
      mainWall: PINTUCO_SWATCHES[1], // Blanco Hueso
      accentWall: PINTUCO_SWATCHES[17], // Verde Eucalipto
      ceiling: PINTUCO_SWATCHES[0], // Blanco Nieve
      trim: PINTUCO_SWATCHES[2], // Gris Urbano Claro
    },
  },
  {
    id: 'pal-02',
    title: 'Terracota & Cordillera',
    category: 'Inspiración Colombia',
    description: 'Riqueza artesanal inspirada en la arquitectura colonial de Barichara y Villa de Leyva.',
    roomType: 'living',
    colors: {
      mainWall: PINTUCO_SWATCHES[8], // Arena del Desierto
      accentWall: PINTUCO_SWATCHES[6], // Terracota Colonial
      ceiling: PINTUCO_SWATCHES[1], // Blanco Hueso
      trim: PINTUCO_SWATCHES[9], // Canela Tostada
    },
  },
  {
    id: 'pal-03',
    title: 'Azul Zafiro Ejecutivo',
    category: 'Moderno & Elegante',
    description: 'Contraste imponente entre tonos blancos nítidos y el azul profundo con toques en grafito.',
    roomType: 'office',
    colors: {
      mainWall: PINTUCO_SWATCHES[2], // Gris Urbano Claro
      accentWall: PINTUCO_SWATCHES[12], // Azul Caribe Profundo
      ceiling: PINTUCO_SWATCHES[0], // Blanco Nieve
      trim: PINTUCO_SWATCHES[4], // Gris Plomo
    },
  },
  {
    id: 'pal-04',
    title: 'Esmeralda & Oro Andino',
    category: 'Biofilia & Naturaleza',
    description: 'Verde profundo combinado con acentos cálidos dorados para un ambiente refinado y orgánico.',
    roomType: 'bedroom',
    colors: {
      mainWall: PINTUCO_SWATCHES[1], // Blanco Hueso
      accentWall: PINTUCO_SWATCHES[19], // Verde Selva Esmeralda
      ceiling: PINTUCO_SWATCHES[0], // Blanco Nieve
      trim: PINTUCO_SWATCHES[7], // Ocre Andino
    },
  },
  {
    id: 'pal-05',
    title: 'Minimalista Loft Urbano',
    category: 'Estilo Industrial',
    description: 'Equilibrio de grises arquitectónicos, hormigón y acento amarillo vibrante característico de Pintuco.',
    roomType: 'living',
    colors: {
      mainWall: PINTUCO_SWATCHES[3], // Gris Cemento Medio
      accentWall: PINTUCO_SWATCHES[4], // Gris Plomo
      ceiling: PINTUCO_SWATCHES[0], // Blanco Nieve
      trim: PINTUCO_SWATCHES[21], // Amarillo Tráfico
    },
  },
  {
    id: 'pal-06',
    title: 'Fachada Colonial Renacida',
    category: 'Exteriores & Fachadas',
    description: 'Composición clásica de muros marfil con guardapolvos y marcos en terracota y teja tradicional.',
    roomType: 'facade',
    colors: {
      mainWall: PINTUCO_SWATCHES[1], // Blanco Hueso Suave
      accentWall: PINTUCO_SWATCHES[6], // Terracota Colonial
      ceiling: PINTUCO_SWATCHES[0], // Blanco Nieve
      trim: PINTUCO_SWATCHES[9], // Canela Tostada
    },
  },
];
