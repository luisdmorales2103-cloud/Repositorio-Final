import { UserProfile, ClientRole } from '../types';

const STORAGE_KEYS = {
  USERS: 'pintuco_registered_users_v1',
  SESSION: 'pintuco_active_session_v1',
};

interface StoredUser extends UserProfile {
  passwordHash: string;
}

// Master Administrator Accounts with Exclusive Access
export const MASTER_ADMINS: { [email: string]: { name: string; pass: string; phone: string; idNum: string; city: string } } = {
  'salgadoarevaloleidy@gmail.com': {
    name: 'Leidy Salgado (Administrador)',
    pass: 'Pintuco2026*',
    phone: '3118568707',
    idNum: '1020789456-0',
    city: 'Bogotá D.C.',
  },
  'luisdmorales@pintuco.com': {
    name: 'Luis Morales (Asesor Técnico)',
    pass: 'Universidad2026-',
    phone: '3118568707',
    idNum: '1020789456-1',
    city: 'Bogotá D.C.',
  },
  'luisdmorales2103@gmail.com': {
    name: 'Luis Morales (Asesor Técnico)',
    pass: 'Universidad2026-',
    phone: '3118568707',
    idNum: '1020789456-1',
    city: 'Bogotá D.C.',
  },
  'juanjpromero@pintuco.com': {
    name: 'Juan Romero (Asesor Técnico)',
    pass: 'Electronica26-',
    phone: '3118568707',
    idNum: '1020789456-2',
    city: 'Medellín',
  },
  'juanjpromero@gmail.com': {
    name: 'Juan Romero (Asesor Técnico)',
    pass: 'Electronica26-',
    phone: '3118568707',
    idNum: '1020789456-2',
    city: 'Medellín',
  },
};

export function isMasterAdminEmail(email: string): boolean {
  const norm = email.trim().toLowerCase();
  return Object.keys(MASTER_ADMINS).some((adm) => adm.toLowerCase() === norm);
}


function getStoredUsers(): StoredUser[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USERS) : null;
    const list: StoredUser[] = raw ? JSON.parse(raw) : [];
    return list;
  } catch {
    return [];
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const user: UserProfile = JSON.parse(raw);

    // Strict validation: Only the two master admin emails can possess admin role
    if (isMasterAdminEmail(user.email)) {
      user.rol = 'admin';
      user.role = 'Asesor Pintuco';
    } else {
      user.rol = 'cliente';
    }
    return user;
  } catch {
    return null;
  }
}

export function loginUser(
  email: string,
  password: string
): { success: boolean; user?: UserProfile; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check Master Admin Accounts
  const masterEntry = Object.entries(MASTER_ADMINS).find(
    ([adminEmail]) => adminEmail.toLowerCase() === normalizedEmail
  );

  if (masterEntry) {
    const [adminEmail, adminData] = masterEntry;
    if (password === adminData.pass) {
      const adminProfile: UserProfile = {
        id: `adm-${normalizedEmail.replace(/[^a-z0-9]/g, '')}`,
        name: adminData.name,
        email: adminEmail,
        phone: adminData.phone,
        idNumber: adminData.idNum,
        city: adminData.city,
        address: 'Centro Técnico Pintuco',
        role: 'Asesor Pintuco',
        rol: 'admin',
        createdAt: '2026-01-01T08:00:00.000Z',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(adminProfile));
      }
      return { success: true, user: adminProfile };
    } else {
      return { success: false, error: 'Contraseña de administrador incorrecta.' };
    }
  }

  // 2. Check Standard Registered Users (Always strictly 'cliente' role)
  const users = getStoredUsers();
  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!found) {
    return { success: false, error: 'No existe una cuenta registrada con este correo electrónico.' };
  }

  if (found.passwordHash !== password) {
    return { success: false, error: 'Contraseña incorrecta. Por favor verifica tus datos.' };
  }

  const { passwordHash, ...profile } = found;
  // Enforce client role for all non-master accounts
  profile.rol = 'cliente';

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
  }
  return { success: true, user: profile };
}

export function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  idNumber?: string;
  city?: string;
  address?: string;
  role?: ClientRole;
}): { success: boolean; user?: UserProfile; error?: string } {
  const normalizedEmail = data.email.trim().toLowerCase();

  // Block registration with master admin emails
  if (isMasterAdminEmail(normalizedEmail)) {
    return {
      success: false,
      error: 'Esta cuenta institucional maestra ya está registrada. Por favor inicia sesión.',
    };
  }

  const users = getStoredUsers();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'Ya existe una cuenta con este correo electrónico. Inicia sesión.' };
  }

  // All new public registrations are strictly assigned 'cliente' role without exception
  const newUser: StoredUser = {
    id: `usr-${Date.now()}`,
    name: data.name.trim(),
    email: normalizedEmail,
    phone: data.phone.trim(),
    idNumber: data.idNumber?.trim() || '',
    city: data.city?.trim() || 'Bogotá D.C.',
    address: data.address?.trim() || '',
    role: data.role || 'Particular',
    rol: 'cliente',
    createdAt: new Date().toISOString(),
    passwordHash: data.password,
  };

  users.push(newUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  const { passwordHash, ...profile } = newUser;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
  }

  return { success: true, user: profile };
}

export function logoutUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

/**
 * Searches for a registered client by email or phone number.
 */
export function findUserByIdentifier(identifier: string): UserProfile | null {
  const norm = identifier.trim().toLowerCase();
  const digits = identifier.replace(/[^0-9]/g, '');
  const users = getStoredUsers();

  const found = users.find((u) => {
    const uEmail = u.email.toLowerCase();
    const uPhoneDigits = u.phone.replace(/[^0-9]/g, '');
    return uEmail === norm || (digits.length >= 7 && uPhoneDigits === digits);
  });

  if (!found) return null;
  const { passwordHash: _, ...profile } = found;
  return profile;
}

/**
 * Resets a customer's password and updates local credentials.
 */
export function resetUserPassword(
  identifier: string,
  newPassword: string
): { success: boolean; error?: string } {
  const norm = identifier.trim().toLowerCase();
  const digits = identifier.replace(/[^0-9]/g, '');

  if (isMasterAdminEmail(norm)) {
    return {
      success: false,
      error: 'Las contraseñas de las cuentas institucionales maestras se gestionan por TI Pintuco.',
    };
  }

  const users = getStoredUsers();
  const index = users.findIndex((u) => {
    const uEmail = u.email.toLowerCase();
    const uPhoneDigits = u.phone.replace(/[^0-9]/g, '');
    return uEmail === norm || (digits.length >= 7 && uPhoneDigits === digits);
  });

  if (index === -1) {
    return {
      success: false,
      error: 'No se encontró ninguna cuenta asociada a este correo electrónico o teléfono.',
    };
  }

  users[index].passwordHash = newPassword;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  return { success: true };
}

