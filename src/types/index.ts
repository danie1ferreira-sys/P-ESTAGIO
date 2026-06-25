export type Role = 'intern' | 'supervisor' | 'admin';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
}

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
