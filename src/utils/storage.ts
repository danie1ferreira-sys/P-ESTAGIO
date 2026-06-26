import {
  User, CallRecord, Technician, FormConfig, GeneralConfig,
  DEFAULT_FORM_CONFIG, DEFAULT_GENERAL_CONFIG, SYSTEMS, ORGANS,
  UserPermissions,
} from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const SESSION_KEY = 'gpi_session';

const USERS_TABLE       = 'app_users';
const CALLS_TABLE       = 'call_records';
const SYSTEMS_TABLE     = 'system_options';
const ORGANS_TABLE      = 'organ_options';
const TECHNICIANS_TABLE = 'technicians';
const SETTINGS_TABLE    = 'app_settings';

// ─── Default seed data ───────────────────────────────────────────────────────

export const defaultUsers: User[] = [
  { id: 'admin', name: 'Administrador', username: 'admin', password: 'admin123', role: 'admin', mustChangePassword: false, permissions: {} },
  { id: '1', name: 'Maria Supervisora', username: 'supervisora', password: 'gpi123', role: 'supervisor', mustChangePassword: false, permissions: {} },
  { id: '2', name: 'Joao Estagiario', username: 'joao', password: 'estagio123', role: 'intern', mustChangePassword: false, permissions: {} },
  { id: '3', name: 'Ana Souza', username: 'ana', password: 'estagio123', role: 'intern', mustChangePassword: false, permissions: {} },
  { id: '4', name: 'Pedro Lima', username: 'pedro', password: 'estagio123', role: 'intern', mustChangePassword: false, permissions: {} },
];

// ─── Row types ────────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: User['role'];
  must_change_password: boolean;
  permissions: Record<string, boolean>;
};

type CallRow = {
  id: string;
  date: string;
  time: string;
  call_number: string;
  organ: string;
  system: string;
  description: string;
  solution: string;
  received_help: 'sim' | 'nao';
  helper_name: string | null;
  intern_id: string;
  intern_name: string;
  created_at: string;
};

type OptionRow = { id: string; name: string; sort_order: number };
type TechRow   = { id: string; name: string };
type SettingRow = { key: string; value: string };

// ─── Mappers ─────────────────────────────────────────────────────────────────

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  username: row.username,
  password: row.password,
  role: row.role,
  mustChangePassword: row.must_change_password ?? false,
  permissions: (row.permissions as UserPermissions) ?? {},
});

const toUserRow = (user: User): UserRow => ({
  id: user.id,
  name: user.name,
  username: user.username,
  password: user.password,
  role: user.role,
  must_change_password: user.mustChangePassword ?? false,
  permissions: (user.permissions ?? {}) as Record<string, boolean>,
});

const toCall = (row: CallRow): CallRecord => ({
  id: row.id, date: row.date, time: row.time, callNumber: row.call_number,
  organ: row.organ, system: row.system, description: row.description,
  solution: row.solution, receivedHelp: row.received_help,
  helperName: row.helper_name ?? undefined,
  internId: row.intern_id, internName: row.intern_name, createdAt: row.created_at,
});

const toCallRow = (call: CallRecord): CallRow => ({
  id: call.id, date: call.date, time: call.time, call_number: call.callNumber,
  organ: call.organ, system: call.system, description: call.description,
  solution: call.solution, received_help: call.receivedHelp,
  helper_name: call.helperName ?? null,
  intern_id: call.internId, intern_name: call.internName, created_at: call.createdAt,
});

const optionRows = (values: string[]): OptionRow[] =>
  values.map((name, index) => ({ id: slugify(name), name, sort_order: index }));

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function throwIfError<T>(result: { data: T | null; error: unknown }): Promise<T> {
  if (result.error) throw toError(result.error);
  return result.data as T;
}

/** Converts any Supabase PostgrestError or unknown value into a proper Error instance */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const msg = typeof e.message === 'string' ? e.message : JSON.stringify(e);
    const detail = typeof e.details === 'string' ? ` — ${e.details}` : '';
    return new Error(msg + detail);
  }
  return new Error(String(err));
}

// ─── Init ────────────────────────────────────────────────────────────────────

export async function initStorage() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Informe VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }

  const [users, systems, organs] = await Promise.all([
    getUsers(),
    getSystems(),
    getOrgans(),
  ]);

  const inserts: Promise<unknown>[] = [];

  if (users.length === 0) {
    inserts.push(throwIfError(await supabase.from(USERS_TABLE).insert(defaultUsers.map(toUserRow))));
  }
  if (systems.length === 0) {
    inserts.push(throwIfError(await supabase.from(SYSTEMS_TABLE).insert(optionRows(SYSTEMS))));
  }
  if (organs.length === 0) {
    inserts.push(throwIfError(await supabase.from(ORGANS_TABLE).insert(optionRows(ORGANS))));
  }

  await Promise.all(inserts);
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from(USERS_TABLE).select('*').order('name', { ascending: true });
  if (error) throw toError(error);
  return (data as UserRow[]).map(toUser);
}

export async function getInterns(): Promise<User[]> {
  const users = await getUsers();
  return users.filter((u) => u.role === 'intern');
}

export async function authenticate(username: string, password: string): Promise<User | null> {
  const { data, error } = await supabase
    .from(USERS_TABLE).select('*')
    .ilike('username', username).eq('password', password).maybeSingle();
  if (error) throw toError(error);
  return data ? toUser(data as UserRow) : null;
}

export async function addUser(user: User) {
  const { error } = await supabase.from(USERS_TABLE).insert(toUserRow(user));
  if (error) throw toError(error);
}

export async function updateUser(user: User) {
  const { error } = await supabase
    .from(USERS_TABLE).update(toUserRow(user)).eq('id', user.id);
  if (error) throw toError(error);

  const session = getSession();
  if (session?.id === user.id) setSession(user);
}

export async function saveUserPermissions(userId: string, permissions: UserPermissions): Promise<void> {
  const { error, data } = await supabase
    .from(USERS_TABLE).update({ permissions }).eq('id', userId).select();
  if (error) throw toError(error);
  if (!data || data.length === 0) throw new Error('Nenhum usuário encontrado com o ID informado.');

  const session = getSession();
  if (session?.id === userId) setSession({ ...session, permissions });
}

export async function resetUserPassword(userId: string, newPassword: string, mustChangePassword: boolean): Promise<void> {
  const { error } = await supabase
    .from(USERS_TABLE).update({ password: newPassword, must_change_password: mustChangePassword }).eq('id', userId);
  if (error) throw toError(error);

  const session = getSession();
  if (session?.id === userId) setSession({ ...session, password: newPassword, mustChangePassword });
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.from(USERS_TABLE).delete().eq('id', userId);
  if (error) throw toError(error);
}

// ─── Session ─────────────────────────────────────────────────────────────────

export function setSession(user: User) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
export function getSession(): User | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

// ─── Technicians ─────────────────────────────────────────────────────────────

export async function getTechnicians(): Promise<Technician[]> {
  try {
    const { data, error } = await supabase
      .from(TECHNICIANS_TABLE).select('*').order('name', { ascending: true });
    if (error) return [];
    return (data as TechRow[]);
  } catch {
    return [];
  }
}

export async function addTechnician(tech: Technician): Promise<void> {
  const { error } = await supabase.from(TECHNICIANS_TABLE).insert(tech);
  if (error) throw error;
}

export async function updateTechnician(tech: Technician): Promise<void> {
  const { error } = await supabase
    .from(TECHNICIANS_TABLE).update({ name: tech.name }).eq('id', tech.id);
  if (error) throw error;
}

export async function deleteTechnician(id: string): Promise<void> {
  const { error } = await supabase.from(TECHNICIANS_TABLE).delete().eq('id', id);
  if (error) throw error;
}

// ─── Call Records ─────────────────────────────────────────────────────────────

export async function getCalls(): Promise<CallRecord[]> {
  const { data, error } = await supabase
    .from(CALLS_TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CallRow[]).map(toCall);
}

export async function addCall(call: CallRecord) {
  const { error } = await supabase.from(CALLS_TABLE).insert(toCallRow(call));
  if (error) throw error;
}

export async function getCallsByIntern(internId: string): Promise<CallRecord[]> {
  const { data, error } = await supabase
    .from(CALLS_TABLE).select('*').eq('intern_id', internId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data as CallRow[]).map(toCall);
}

// ─── Options ─────────────────────────────────────────────────────────────────

export async function getSystems(): Promise<string[]> {
  const { data, error } = await supabase
    .from(SYSTEMS_TABLE).select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as OptionRow[]).map((r) => r.name);
}

export async function saveSystems(systems: string[]) { await replaceOptions(SYSTEMS_TABLE, systems); }

export async function getOrgans(): Promise<string[]> {
  const { data, error } = await supabase
    .from(ORGANS_TABLE).select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as OptionRow[]).map((r) => r.name);
}

export async function saveOrgans(organs: string[]) { await replaceOptions(ORGANS_TABLE, organs); }

async function replaceOptions(table: string, values: string[]) {
  const { error: delErr } = await supabase.from(table).delete().neq('id', '');
  if (delErr) throw delErr;
  if (values.length > 0) {
    const { error: insErr } = await supabase.from(table).insert(optionRows(values));
    if (insErr) throw insErr;
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from(SETTINGS_TABLE).select('value').eq('key', key).maybeSingle();
    if (error || !data) return defaultValue;
    return JSON.parse((data as SettingRow).value) as T;
  } catch {
    return defaultValue;
  }
}

async function saveSetting<T>(key: string, value: T): Promise<void> {
  const { error } = await supabase
    .from(SETTINGS_TABLE).upsert({ key, value: JSON.stringify(value) });
  if (error) throw error;
}

export const getFormConfig    = () => getSetting<FormConfig>   ('form_config',    DEFAULT_FORM_CONFIG);
export const saveFormConfig   = (c: FormConfig)    => saveSetting('form_config',    c);
export const getGeneralConfig = () => getSetting<GeneralConfig>('general_config', DEFAULT_GENERAL_CONFIG);
export const saveGeneralConfig = (c: GeneralConfig) => saveSetting('general_config', c);

// ─── Utils ────────────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Generates a default password for a new user.
 * Pattern: gpi@<username><currentYear>
 */
export function generateDefaultPassword(username: string): string {
  const year = new Date().getFullYear();
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `gpi@${clean}${year}`;
}
