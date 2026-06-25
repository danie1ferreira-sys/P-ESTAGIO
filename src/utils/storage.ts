import { User, CallRecord, SYSTEMS, ORGANS } from '../types';

const USERS_KEY = 'gpi_users';
const CALLS_KEY = 'gpi_calls';
const SESSION_KEY = 'gpi_session';
const SYSTEMS_KEY = 'gpi_systems';
const ORGANS_KEY = 'gpi_organs';

export const defaultUsers: User[] = [
  {
    id: 'admin',
    name: 'Administrador',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: '1',
    name: 'Maria Supervisora',
    username: 'supervisora',
    password: 'gpi123',
    role: 'supervisor',
  },
  {
    id: '2',
    name: 'João Estagiário',
    username: 'joao',
    password: 'estagio123',
    role: 'intern',
  },
  {
    id: '3',
    name: 'Ana Souza',
    username: 'ana',
    password: 'estagio123',
    role: 'intern',
  },
  {
    id: '4',
    name: 'Pedro Lima',
    username: 'pedro',
    password: 'estagio123',
    role: 'intern',
  },
  {
    id: '5',
    name: 'Carla Ferreira',
    username: 'carla',
    password: 'tecnico123',
    role: 'intern',
  },
];

export function initStorage() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
  if (!localStorage.getItem(CALLS_KEY)) {
    localStorage.setItem(CALLS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(SYSTEMS_KEY)) {
    localStorage.setItem(SYSTEMS_KEY, JSON.stringify(SYSTEMS));
  }
  if (!localStorage.getItem(ORGANS_KEY)) {
    localStorage.setItem(ORGANS_KEY, JSON.stringify(ORGANS));
  }
}

export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

export function getInterns(): User[] {
  return getUsers().filter((u) => u.role === 'intern');
}

export function authenticate(username: string, password: string): User | null {
  const users = getUsers();
  return users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  ) || null;
}

export function setSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession(): User | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCalls(): CallRecord[] {
  return JSON.parse(localStorage.getItem(CALLS_KEY) || '[]');
}

export function saveCalls(calls: CallRecord[]) {
  localStorage.setItem(CALLS_KEY, JSON.stringify(calls));
}

export function addCall(call: CallRecord) {
  const calls = getCalls();
  calls.unshift(call);
  saveCalls(calls);
}

export function getCallsByIntern(internId: string): CallRecord[] {
  return getCalls().filter((c) => c.internId === internId);
}

export function getSystems(): string[] {
  const systems = localStorage.getItem(SYSTEMS_KEY);
  return systems ? JSON.parse(systems) : SYSTEMS;
}

export function saveSystems(systems: string[]) {
  localStorage.setItem(SYSTEMS_KEY, JSON.stringify(systems));
}

export function getOrgans(): string[] {
  const organs = localStorage.getItem(ORGANS_KEY);
  return organs ? JSON.parse(organs) : ORGANS;
}

export function saveOrgans(organs: string[]) {
  localStorage.setItem(ORGANS_KEY, JSON.stringify(organs));
}

export function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // Update current session if the logged-in user changed their own info
  const currentSession = getSession();
  if (currentSession) {
    const updated = users.find((u) => u.id === currentSession.id);
    if (updated) {
      setSession(updated);
    }
  }
}

export function addUser(user: User) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(user: User) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    users[idx] = user;
    saveUsers(users);
  }
}

export function deleteUser(userId: string) {
  const users = getUsers();
  const filtered = users.filter((u) => u.id !== userId);
  saveUsers(filtered);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

