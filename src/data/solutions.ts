import { ProductCategory } from '../types';
import { CATEGORY_IMAGES } from './products';

export interface SolutionItemConfig {
  productId: string;
  presentationName: string;
  defaultQty: number;
}

export interface ProjectSolution {
  id: string;
  name: string;
  tagline: string;
  description: string;
  targetArea: string;
  level: 'Hogar / Básico' | 'Técnico / Obra' | 'Industrial Avanzado';
  benefits: string[];
  items: SolutionItemConfig[];
}

export interface SolutionModule {
  id: string;
  category: ProductCategory;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  solutions: ProjectSolution[];
}

export const SOLUTION_MODULES: SolutionModule[] = [
  {
    id: 'mod-construccion',
    category: 'CONSTRUCCIÓN',
    tag: 'PROYECTOS / CONSTRUCCIÓN',
    title: 'Construcción y mantenimiento...',
    subtitle: '4 Soluciones Pintuco',
    description: 'Sistemas integrales para obra civil, impermeabilización de terrazas, tratamiento de juntas y enlucido de muros.',
    image: CATEGORY_IMAGES.CONSTRUCCIÓN,
    solutions: [
      {
        id: 'sol-con-1',
        name: 'Impermeabilización Integral de Terrazas y Cubiertas',
        tagline: 'Protección 10 años sin goteras ni filtraciones en losas',
        description: 'Kit completo que incluye sellador penetrante para poro abierto, masilla elástica para fisuras y recubrimiento fibratado elástico.',
        targetArea: 'Hasta 40 m² de terraza',
        level: 'Técnico / Obra',
        benefits: [
          'Elimina filtraciones y humedades descendentes',
          'Soporta dilatación térmica y tráfico peatonal liviano',
          'Ahorra hasta un 15% de calor por reflexión solar',
        ],
        items: [
          { productId: 'hog-006', presentationName: '5 galones (Cuñete)', defaultQty: 2 },
          { productId: 'con-020', presentationName: '1 galón', defaultQty: 1 },
          { productId: 'con-024', presentationName: 'Galón (5 kg)', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-con-2',
        name: 'Estucado y Alisado de Fachadas Exteriores',
        tagline: 'Acabado liso hidrorrepelente para frentes expuestos a la intemperie',
        description: 'Sistema bicapa con estuco acrílico exterior impermeable y pintura elastomérica UV para frentes de casas y edificios.',
        targetArea: 'Fachada aprox. 60 m²',
        level: 'Técnico / Obra',
        benefits: [
          'Previene fisuras y caleo en la pared exterior',
          'Película flexible que puentear microgrietas',
          'Color firme de alta resistencia a radiación solar',
        ],
        items: [
          { productId: 'con-018', presentationName: 'Caneca (30 kg)', defaultQty: 2 },
          { productId: 'hog-004', presentationName: '5 galones (Cuñete)', defaultQty: 1 },
          { productId: 'con-020', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-con-3',
        name: 'Sistema Liviano y Acabado Drywall Completo',
        tagline: 'Tratamiento de juntas invisibles sin grietas para paneles de yeso',
        description: 'Compuesto para juntas, cinta autoadhesiva de malla de fibra de vidrio y pintura vinílica interior de alta cobertura.',
        targetArea: 'Hasta 80 m² de tabiquería o cielorrasos',
        level: 'Hogar / Básico',
        benefits: [
          'Juntas lisas sin burbujas ni desprendimiento',
          'Fácil lijado sin generar polvo tóxico',
          'Pintura de un solo pase con cubrimiento homogéneo',
        ],
        items: [
          { productId: 'con-019', presentationName: 'Caneca (28 kg)', defaultQty: 1 },
          { productId: 'con-023', presentationName: 'Rollo 90 metros (50 mm ancho)', defaultQty: 1 },
          { productId: 'hog-001', presentationName: '5 galones (Cuñete)', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-con-4',
        name: 'Revoque Texturizado Graniplast de Alto Impacto',
        tagline: 'Elegancia arquitectónica y protección contra desgaste en pasillos y fachadas',
        description: 'Revestimiento plástico con granos de mármol natural seleccionado más base imprimante teñida al tono.',
        targetArea: 'Aprox. 30 m² de muros',
        level: 'Técnico / Obra',
        benefits: [
          'Disfraza desplomes e irregularidades de pañete',
          'Lavable con agua y resistente al roce continuo',
          'Aporta valor estético contemporáneo',
        ],
        items: [
          { productId: 'con-022', presentationName: 'Caneca (30 kg)', defaultQty: 2 },
          { productId: 'con-020', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
    ],
  },
  {
    id: 'mod-automotriz',
    category: 'AUTOMOTRIZ',
    tag: 'AUTOMOTRIZ',
    title: 'Automotriz',
    subtitle: '4 Soluciones Pintuco',
    description: 'Sistemas profesionales para talleres de latonería y pintura: primers de relleno, esmaltes uretanos y barnices alto brillo.',
    image: CATEGORY_IMAGES.AUTOMOTRIZ,
    solutions: [
      {
        id: 'sol-aut-1',
        name: 'Repintado Completo Bicapa Brillo Espejo 2K',
        tagline: 'Pintura poliuretano y barniz cerámico para vehículos particulares',
        description: 'Combo de acabado tipo equipo original con esmalte de poliuretano 2K, barniz transparente con doble filtro UV y thinner acrílico.',
        targetArea: 'Vehículo sedán o SUV completo',
        level: 'Industrial Avanzado',
        benefits: [
          'Brillo espejo superior a 95° gloss de profundidad',
          'Protección inquebrantable frente al sol y lluvia ácida',
          'Resistencia contra rayones finos de autolavado',
        ],
        items: [
          { productId: 'aut-025', presentationName: '1 galón (Kit con catalizador)', defaultQty: 1 },
          { productId: 'aut-027', presentationName: '1 galón (Kit con catalizador rápido)', defaultQty: 1 },
          { productId: 'aut-029', presentationName: '1 galón', defaultQty: 1 },
          { productId: 'aut-030', presentationName: '1/4 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-aut-2',
        name: 'Preparación y Corrección de Paneles Chocados',
        tagline: 'Relleno de abolladuras y nivelación sin ojos de pez',
        description: 'Masilla ultraliviana de corte suave, primer aparejo de alto espesor y limpiador desengrasante antiestático.',
        targetArea: '3 a 4 paneles golpeados (puertas / capó)',
        level: 'Técnico / Obra',
        benefits: [
          'Secado rápido en 20 minutos listo para lijado',
          'Cero absorción de brillo en capas de acabado',
          'Elimina estática y cráteres por contaminación',
        ],
        items: [
          { productId: 'aut-028', presentationName: 'Galón (3.5 kg con catalizador)', defaultQty: 1 },
          { productId: 'aut-026', presentationName: '1 galón (Kit con catalizador)', defaultQty: 1 },
          { productId: 'aut-030', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-aut-3',
        name: 'Retoque Rápido y Barnizado de Piezas Nuevas',
        tagline: 'Ideal para paragolpes, espejos y puertas de recambio',
        description: 'Kits en presentación de 1/4 galón ideales para optimizar costos en reparaciones express sin desperdicios de material.',
        targetArea: 'Paragolpes y piezas individuales',
        level: 'Técnico / Obra',
        benefits: [
          'Dosificación exacta para piezas unitarias',
          'Curado acelerado en cabina o al aire',
          'Pulido inmediato al día siguiente',
        ],
        items: [
          { productId: 'aut-026', presentationName: '1/4 galón (Kit)', defaultQty: 1 },
          { productId: 'aut-027', presentationName: '1/4 galón (Kit)', defaultQty: 1 },
          { productId: 'aut-029', presentationName: '1/4 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-aut-4',
        name: 'Chasises, Rines y Protección Anticorrosiva',
        tagline: 'Recubrimiento rudo para componentes expuestos al asfalto',
        description: 'Wash primer para adherencia sobre metales y esmalte poliuretano negro brillante o gris para bajos y rines.',
        targetArea: '4 rines + chasis completo',
        level: 'Técnico / Obra',
        benefits: [
          'Anclaje infalible sobre aluminio y acero galvanizado',
          'Resiste impactos de gravilla y salitre en carretera',
          'Limpieza fácil de barro y hollín de frenos',
        ],
        items: [
          { productId: 'ind-016', presentationName: '1/4 galón (Kit)', defaultQty: 1 },
          { productId: 'hog-007', presentationName: '1 galón', defaultQty: 1 },
          { productId: 'aut-029', presentationName: '1/4 galón', defaultQty: 1 },
        ],
      },
    ],
  },
  {
    id: 'mod-industrial',
    category: 'INDUSTRIAL',
    tag: 'INDUSTRIAL',
    title: 'Industrial',
    subtitle: '4 Soluciones Pintuco',
    description: 'Recubrimientos técnicos de alto desempeño para bodegas, señalización vial, plantas de alimentos e infraestructuras metálicas.',
    image: CATEGORY_IMAGES.INDUSTRIAL,
    solutions: [
      {
        id: 'sol-ind-1',
        name: 'Piso Epóxico Sanitario Grado Alimenticio',
        tagline: 'Superficie higiénica libre de juntas certificada para contacto indirecto',
        description: 'Sistema epóxico 100% sólidos para frigoríficos, cocinas industriales, lácteos y plantas farmacéuticas.',
        targetArea: 'Piso industrial de aprox. 50 m²',
        level: 'Industrial Avanzado',
        benefits: [
          'Cumple normas sanitarias INVIMA para alimentos',
          'Resiste lavado diario con soda cáustica y desinfectantes',
          'Soporta tráfico de carretillas y estibadoras',
        ],
        items: [
          { productId: 'ind-010', presentationName: '5 galones (Kit Industrial)', defaultQty: 1 },
          { productId: 'ind-015', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-ind-2',
        name: 'Demarcación Vial de Parqueaderos y Zonas Logísticas',
        tagline: 'Pintura base solvente de secado ultra rápido para tráfico pesado',
        description: 'Líneas peatonales, señalización de parqueaderos y bodegas con pintura tráfico amarilla de máxima visibilidad.',
        targetArea: 'Aprox. 400 a 500 metros lineales de línea',
        level: 'Técnico / Obra',
        benefits: [
          'Abre al paso vehicular en solo 15 minutos',
          'Alta resistencia a la abrasión por llantas y maniobras',
          'Compatible con microesferas reflectivas de vidrio',
        ],
        items: [
          { productId: 'ind-013', presentationName: '5 galones (Cuñete)', defaultQty: 1 },
          { productId: 'aut-029', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-ind-3',
        name: 'Protección de Estructuras Metálicas y Cubiertas',
        tagline: 'Barrera química y UV para vigas, cerchas y puentes grúa',
        description: 'Fondo promotor de anclaje wash primer más acabado de poliuretano alifático brillante de alta intemperie.',
        targetArea: 'Cerchas y vigas estructurales medianas',
        level: 'Industrial Avanzado',
        benefits: [
          'Cero desprendimiento sobre láminas galvanizadas',
          'Brillo inalterable frente al sol directo',
          'Detiene la corrosión en atmósferas agresivas',
        ],
        items: [
          { productId: 'ind-016', presentationName: '1 galón (Kit A+B)', defaultQty: 1 },
          { productId: 'ind-011', presentationName: '1 galón (Kit A+B)', defaultQty: 2 },
          { productId: 'ind-015', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-ind-4',
        name: 'Mantenimiento de Maquinaria y Minería en Campo',
        tagline: 'Epóxico mastic tolerante a preparación manual de superficie',
        description: 'Recubrimiento para sitios de difícil arenado donde se requiere pintar sobre acero con óxido adherido.',
        targetArea: 'Tolvas, maquinaria pesada y tuberías',
        level: 'Industrial Avanzado',
        benefits: [
          'No requiere sandblasting exhaustivo',
          'Espesor de película alto en una sola mano',
          'Excelente barrera impermeable contra agua y sales',
        ],
        items: [
          { productId: 'ind-012', presentationName: '1 galón (Kit)', defaultQty: 2 },
          { productId: 'ind-015', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
    ],
  },
  {
    id: 'mod-hogar',
    category: 'HOGAR',
    tag: 'HOGAR / RESIDENCIAL',
    title: 'Hogar y Decoración',
    subtitle: '4 Soluciones Pintuco',
    description: 'Renovación completa para viviendas: vinilos lavables, antibacteriales para baños, esmaltes y protección de maderas.',
    image: CATEGORY_IMAGES.HOGAR,
    solutions: [
      {
        id: 'sol-hog-1',
        name: 'Renovación Total de Sala, Comedor y Alcobas',
        tagline: 'Vinilo tipo 1 de bajo olor con acabado mate sedoso',
        description: 'Pack residencial que incluye imprimante sellador para muros, estuco para retoques y vinilo premium de máximo cubrimiento.',
        targetArea: 'Apartamento de 3 habitaciones (aprox. 80 m²)',
        level: 'Hogar / Básico',
        benefits: [
          'Cero olor irritante durante y después de pintar',
          'Lavable con trapo húmedo y detergente suave',
          'Acabado homogéneo sin sombras ni marcas de rodillo',
        ],
        items: [
          { productId: 'hog-001', presentationName: '5 galones (Cuñete)', defaultQty: 1 },
          { productId: 'con-017', presentationName: 'Galón (6 kg)', defaultQty: 1 },
          { productId: 'con-020', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-hog-2',
        name: 'Protección Antihongos para Baños, Cocinas y Lavado',
        tagline: 'Barrera activa contra humedad, vapores y moho negro',
        description: 'Pintura biocida especializada semi-brillante lavable diseñada para resistir condensación de agua caliente.',
        targetArea: '2 baños y 1 cocina integral',
        level: 'Hogar / Básico',
        benefits: [
          'Inhibe la formación de moho por 5 años',
          'Resiste vapores y salpicaduras de grasa doméstica',
          'Fácil limpieza con paño y desinfectante',
        ],
        items: [
          { productId: 'hog-003', presentationName: '1 galón', defaultQty: 2 },
          { productId: 'con-021', presentationName: 'Cartucho (300 ml)', defaultQty: 2 },
        ],
      },
      {
        id: 'sol-hog-3',
        name: 'Restauración de Puertas, Closets y Madera Fina',
        tagline: 'Barniz poliuretano y laca cristal que realzan la veta',
        description: 'Sistema de protección para maderas interiores y exteriores contra rayones, humedad y dilatación.',
        targetArea: '5 a 6 puertas macizas o muebles',
        level: 'Hogar / Básico',
        benefits: [
          'Película elástica que no se descascara',
          'Filtro UV contra la decoloración de la madera',
          'Tacto suave y acabado artesanal refinado',
        ],
        items: [
          { productId: 'hog-008', presentationName: '1 galón', defaultQty: 1 },
          { productId: 'hog-031', presentationName: '1 galón (Kit con catalizador)', defaultQty: 1 },
          { productId: 'aut-029', presentationName: '1/4 galón', defaultQty: 1 },
        ],
      },
      {
        id: 'sol-hog-4',
        name: 'Tratamiento Definitivo para Muros con Humedad',
        tagline: 'Bloquea el salitre y la pintura desprendida por filtración',
        description: 'Pintura de barrera hidrostática que detiene la humedad por capilaridad en paredes bajas y sótanos.',
        targetArea: 'Muro perimetral de 25 m²',
        level: 'Técnico / Obra',
        benefits: [
          'Detiene la presión hidrostática negativa',
          'Se puede pintar sobre pañete ligeramente húmedo',
          'Evita que la pintura exterior se ampolle o caiga',
        ],
        items: [
          { productId: 'hog-005', presentationName: '1 galón', defaultQty: 2 },
          { productId: 'hog-002', presentationName: '1 galón', defaultQty: 1 },
        ],
      },
    ],
  },
];
