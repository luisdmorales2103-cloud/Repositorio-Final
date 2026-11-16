// @ts-ignore
import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';

// Asegurar formato de retorno JSON para filas en oracledb
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

export interface OracleConfig {
  user?: string;
  password?: string;
  connectString?: string;
  poolMin?: number;
  poolMax?: number;
  poolIncrement?: number;
  timeout?: number;
}

let pool: oracledb.Pool | null = null;
let isPoolInitializing = false;

export function getOracleConfig(): OracleConfig {
  return {
    user: process.env.ORACLE_USER?.trim() || '',
    password: process.env.ORACLE_PASSWORD?.trim() || '',
    connectString: process.env.ORACLE_CONNECT_STRING?.trim() || '',
    poolMin: Number(process.env.ORACLE_POOL_MIN) || 1,
    poolMax: Number(process.env.ORACLE_POOL_MAX) || 8,
    poolIncrement: Number(process.env.ORACLE_POOL_INCREMENT) || 1,
    timeout: Number(process.env.ORACLE_TIMEOUT) || 60,
  };
}

export function isOracleConfigured(): boolean {
  const cfg = getOracleConfig();
  return Boolean(cfg.user && cfg.password && cfg.connectString);
}

/**
 * Inicializa el Pool de conexiones a Oracle Database (Thin Mode nativo o Thick Mode)
 */
export async function initializeOraclePool(): Promise<{ success: boolean; message: string; error?: string }> {
  if (pool) {
    return { success: true, message: 'Pool de conexiones Oracle ya activo.' };
  }

  const cfg = getOracleConfig();
  if (!isOracleConfigured()) {
    return {
      success: false,
      message: 'Credenciales de Oracle no configuradas en el entorno (ORACLE_USER, ORACLE_PASSWORD, ORACLE_CONNECT_STRING).',
    };
  }

  if (isPoolInitializing) {
    return { success: false, message: 'Inicialización de pool Oracle en progreso...' };
  }

  isPoolInitializing = true;
  try {
    pool = await oracledb.createPool({
      user: cfg.user,
      password: cfg.password,
      connectString: cfg.connectString,
      poolMin: cfg.poolMin,
      poolMax: cfg.poolMax,
      poolIncrement: cfg.poolIncrement,
      poolTimeout: cfg.timeout,
    });
    console.log(`[Oracle DW] Pool de conexiones establecido exitosamente con ${cfg.connectString}`);
    return { success: true, message: `Conexión y Pool establecidos con Oracle (${cfg.connectString})` };
  } catch (err: any) {
    console.error('[Oracle DW] Error inicializando pool de Oracle:', err.message);
    return { success: false, message: 'Fallo al conectar con Oracle Database', error: err.message };
  } finally {
    isPoolInitializing = false;
  }
}

/**
 * Prueba real de conexión y latencia contra Oracle Database
 * "No afirmes que Oracle está conectado hasta probar una conexión real."
 */
export async function testOracleConnectionProbe(): Promise<{
  isConnected: boolean;
  version?: string;
  serverBanner?: string;
  latencyMs?: number;
  configSummary?: any;
  error?: string;
}> {
  const cfg = getOracleConfig();
  const startTime = Date.now();

  const configSummary = {
    user: cfg.user ? `${cfg.user.slice(0, 3)}***` : 'No configurado',
    connectString: cfg.connectString || 'No configurado',
    poolMin: cfg.poolMin,
    poolMax: cfg.poolMax,
  };

  if (!isOracleConfigured()) {
    return {
      isConnected: false,
      configSummary,
      error: 'Variables ORACLE_USER, ORACLE_PASSWORD y ORACLE_CONNECT_STRING no detectadas en el servidor.',
    };
  }

  let connection: oracledb.Connection | null = null;
  try {
    // Si el pool no está listo, intentamos una conexión directa para la prueba
    if (pool) {
      connection = await pool.getConnection();
    } else {
      connection = await oracledb.getConnection({
        user: cfg.user,
        password: cfg.password,
        connectString: cfg.connectString,
      });
    }

    const result = await connection.execute<{ BANNER: string }>(
      `SELECT BANNER FROM V$VERSION WHERE ROWNUM = 1`
    );

    const latencyMs = Date.now() - startTime;
    const banner = result.rows && result.rows.length > 0 ? (result.rows[0] as any).BANNER : 'Oracle Database Active';

    return {
      isConnected: true,
      serverBanner: banner,
      latencyMs,
      configSummary,
    };
  } catch (err: any) {
    return {
      isConnected: false,
      latencyMs: Date.now() - startTime,
      configSummary,
      error: err.message || 'Error de conexión con la instancia de Oracle',
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch {}
    }
  }
}

/**
 * Ejecuta una consulta parametrizada segura en Oracle Database
 */
export async function executeOracleQuery<T = any>(
  sql: string,
  binds: oracledb.BindParameters = {},
  options: oracledb.ExecuteOptions = {}
): Promise<{ rows: T[]; rowsAffected?: number }> {
  if (!pool) {
    const initRes = await initializeOraclePool();
    if (!initRes.success || !pool) {
      throw new Error(`Oracle pool no disponible: ${initRes.message}`);
    }
  }

  let connection: oracledb.Connection | null = null;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });

    return {
      rows: (result.rows as T[]) || [],
      rowsAffected: result.rowsAffected,
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch {}
    }
  }
}
