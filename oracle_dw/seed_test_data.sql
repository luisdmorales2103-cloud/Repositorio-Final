-- ==============================================================================
-- PINTUCO ENTERPRISE DATA WAREHOUSE - SEED TEST SCRIPT
-- Esquema de Pruebas Corporativo
-- ==============================================================================

-- 1. Proyecto Inicial de Demostración
INSERT INTO DW_PROYECTOS (
    PROYECTO_ID, CODIGO_PROYECTO, NOMBRE, DESCRIPCION, CATEGORIA, ESTADO, CREADO_POR
) VALUES (
    'proj-pintuco-corp-001',
    'PRJ-2026-PINTUCO-ANALYTICS',
    'Control Operacional y Ventas Pintuco Colombia',
    'Data warehouse analítico de producción, ventas por departamento y rendimiento de cobertura de recubrimientos arquitectónicos e industriales.',
    'VENTAS_Y_OPERACIONES',
    'ACTIVO',
    'salgadoarevaloleidy@gmail.com'
);

-- 2. Membresía y Permisos RBAC
INSERT INTO DW_ACCESOS (
    ACCESO_ID, PROYECTO_ID, USUARIO_EMAIL, USUARIO_NOMBRE, ROL, PUEDE_CARGAR, PUEDE_EDITAR, PUEDE_EXPORTAR
) VALUES (
    'acc-001',
    'proj-pintuco-corp-001',
    'salgadoarevaloleidy@gmail.com',
    'Leidy Salgado (Super Admin)',
    'ADMINISTRADOR',
    1, 1, 1
);

INSERT INTO DW_ACCESOS (
    ACCESO_ID, PROYECTO_ID, USUARIO_EMAIL, USUARIO_NOMBRE, ROL, PUEDE_CARGAR, PUEDE_EDITAR, PUEDE_EXPORTAR
) VALUES (
    'acc-002',
    'proj-pintuco-corp-001',
    'estudiante.analitica@universidad.edu.co',
    'Estudiante Analista Senior',
    'ESTUDIANTE',
    1, 0, 1
);

-- 3. Registro de Auditoría Inicial
INSERT INTO DW_AUDITORIA (
    AUDITORIA_ID, PROYECTO_ID, USUARIO_EMAIL, ACCION, ENTIDAD_AFECTADA, ID_REGISTRO_AFECTADO, DETALLES_OPERACION
) VALUES (
    'aud-001',
    'proj-pintuco-corp-001',
    'salgadoarevaloleidy@gmail.com',
    'INICIALIZACION_ESQUEMA',
    'DW_PROYECTOS',
    'proj-pintuco-corp-001',
    'Creación e inicialización del Data Warehouse empresarial en Oracle Database.'
);

COMMIT;
