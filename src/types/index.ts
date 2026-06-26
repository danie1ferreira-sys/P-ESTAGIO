export type Role = 'intern' | 'supervisor' | 'admin';

// ─── Permissions ─────────────────────────────────────────────────────────────

export type Permission =
  | 'canRegisterCalls'
  | 'canViewAllCalls'
  | 'canExportExcel'
  | 'canManageUsers'
  | 'canManageOptions'
  | 'canViewStats'
  | 'canManageTechnicians'
  | 'canManageSettings';

export type UserPermissions = Partial<Record<Permission, boolean>>;

export const ALL_PERMISSIONS: Permission[] = [
  'canRegisterCalls',
  'canViewAllCalls',
  'canExportExcel',
  'canManageUsers',
  'canManageOptions',
  'canViewStats',
  'canManageTechnicians',
  'canManageSettings',
];

export const PERMISSION_META: Record<Permission, { label: string; description: string; icon: string }> = {
  canRegisterCalls:    { label: 'Registrar Chamados',      description: 'Pode abrir e registrar novos atendimentos',       icon: '📝' },
  canViewAllCalls:     { label: 'Ver Todos os Chamados',   description: 'Visualiza chamados de todos os estagiários',      icon: '👁️' },
  canExportExcel:      { label: 'Exportar Planilha',       description: 'Pode gerar e baixar a planilha Excel',            icon: '📊' },
  canManageUsers:      { label: 'Gerenciar Usuários',      description: 'Cria, edita e remove contas de usuários',         icon: '👤' },
  canManageOptions:    { label: 'Gerenciar Listas',        description: 'Adiciona e remove sistemas e órgãos',             icon: '📋' },
  canViewStats:        { label: 'Ver Estatísticas',        description: 'Acessa métricas e dados gerais do sistema',       icon: '📈' },
  canManageTechnicians:{ label: 'Gerenciar Técnicos',      description: 'Adiciona e remove técnicos da lista de auxílio',  icon: '🔧' },
  canManageSettings:   { label: 'Configurações Avançadas', description: 'Edita layout do formulário e opções gerais',      icon: '⚙️' },
};

/** Default permissions per role — used as base, individual overrides on top */
export const DEFAULT_PERMISSIONS: Record<Role, Required<UserPermissions>> = {
  intern: {
    canRegisterCalls: true,
    canViewAllCalls: false,
    canExportExcel: false,
    canManageUsers: false,
    canManageOptions: false,
    canViewStats: false,
    canManageTechnicians: false,
    canManageSettings: false,
  },
  supervisor: {
    canRegisterCalls: false,
    canViewAllCalls: true,
    canExportExcel: true,
    canManageUsers: false,
    canManageOptions: false,
    canViewStats: true,
    canManageTechnicians: false,
    canManageSettings: false,
  },
  admin: {
    canRegisterCalls: false,
    canViewAllCalls: true,
    canExportExcel: true,
    canManageUsers: true,
    canManageOptions: true,
    canViewStats: true,
    canManageTechnicians: true,
    canManageSettings: true,
  },
};

/** Merges role defaults with individual overrides */
export function resolvePermissions(user: User): Required<UserPermissions> {
  return { ...DEFAULT_PERMISSIONS[user.role], ...(user.permissions ?? {}) };
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  mustChangePassword?: boolean;
  permissions?: UserPermissions; // individual overrides (empty = use role defaults)
}

// ─── Technician ──────────────────────────────────────────────────────────────

export interface Technician {
  id: string;
  name: string;
}

// ─── Call Record ─────────────────────────────────────────────────────────────

export interface CallRecord {
  id: string;
  date: string;
  time: string;
  callNumber: string;
  organ: string;
  system: string;
  description: string;
  solution: string;
  receivedHelp: 'sim' | 'nao';
  helperName?: string;
  internId: string;
  internName: string;
  createdAt: string;
}

// ─── Form Config ─────────────────────────────────────────────────────────────

export type FormFieldKey = 'callNumber' | 'organ' | 'system' | 'description' | 'solution' | 'receivedHelp';

export interface FieldConfig {
  enabled: boolean;
  required: boolean;
}

export type FormConfig = Record<FormFieldKey, FieldConfig>;

export const FORM_FIELD_LABELS: Record<FormFieldKey, { label: string; icon: string; note?: string }> = {
  callNumber:   { label: 'Número do Chamado',      icon: '🎫', note: 'Exibido condicionalmente (se chamado foi aberto)' },
  organ:        { label: 'Órgão / Setor',          icon: '🏢' },
  system:       { label: 'Sistema Atendido',       icon: '💻' },
  description:  { label: 'Descrição do Atendimento', icon: '📝' },
  solution:     { label: 'Solução Aplicada',       icon: '✅' },
  receivedHelp: { label: 'O estagiário teve ajuda?', icon: '🤝' },
};

export const DEFAULT_FORM_CONFIG: FormConfig = {
  callNumber:   { enabled: true,  required: true  },
  organ:        { enabled: true,  required: true  },
  system:       { enabled: true,  required: true  },
  description:  { enabled: true,  required: true  },
  solution:     { enabled: true,  required: true  },
  receivedHelp: { enabled: true,  required: true  },
};

// ─── General Config ───────────────────────────────────────────────────────────

export interface GeneralConfig {
  supervisorAutoRefresh: boolean;
  supervisorAutoRefreshInterval: number; // seconds
  showRecentCallsInIntern: boolean;
}

export const DEFAULT_GENERAL_CONFIG: GeneralConfig = {
  supervisorAutoRefresh: true,
  supervisorAutoRefreshInterval: 10,
  showRecentCallsInIntern: true,
};

// ─── Static Lists ─────────────────────────────────────────────────────────────

export const SYSTEMS = [
  'Sistemas Administrativos',
  'Licitações',
  'Contabilidade',
  'Patrimônio',
  'Almoxarifado',
  'Recursos Humanos',
  'Protocolos',
  'Gestão Financeira',
  'Transparência Pública',
  'Outros',
];

export const ORGANS = [
  'Prefeitura Municipal',
  'Câmara de Vereadores',
  'Secretaria de Educação',
  'Secretaria de Saúde',
  'Secretaria de Finanças',
  'Secretaria de Administração',
  'Secretaria de Cultura',
  'Secretaria de Meio Ambiente',
  'Gabinete do Prefeito',
  'Procuradoria Geral',
  'Controladoria Geral',
  'Outro',
];
