// Types for Diário de Obras module

export interface TempoDiario {
    id: number;
    diario_id: number;
    periodo: 'manha' | 'tarde' | 'noite';
    condicao: string;
    temperatura_min?: number;
    temperatura_max?: number;
    created_at: string;
}

export interface Atividade {
    id: number;
    diario_id: number;
    descricao: string;
    local: string;
    tipo: string;
    status: 'pendente' | 'em_andamento' | 'concluido' | 'pausado' | 'cancelado';
    ordem: number;
    observacoes?: string;
    image_url?: string;
    video_url?: string;
    latitude?: number;
    longitude?: number;
    total_contestacoes?: number;
    created_at: string;
    updated_at: string;
}

export interface Diario {
    id: number;
    data: string;
    created_by?: number;
    observacoes?: string;
    tempo?: TempoDiario[];
    atividades?: Atividade[];
    total_atividades?: number;
    created_at: string;
    updated_at: string;
}

export interface Contestacao {
    id: number;
    atividade_id: number;
    nome_morador: string;
    contato?: string;
    mensagem: string;
    status: 'pendente' | 'em_analise' | 'resolvida' | 'rejeitada';
    resposta_admin?: string;
    respondido_por?: number;
    respondido_em?: string;
    atividade_descricao?: string;
    atividade_local?: string;
    diario_data?: string;
    created_at: string;
    updated_at: string;
}

export interface TipoAtividade {
    id: number;
    nome: string;
    icone?: string;
    cor?: string;
}

export interface DiarioStats {
    total_diarios: string;
    total_atividades: string;
    atividades_concluidas: string;
    atividades_andamento: string;
    contestacoes_pendentes: string;
}

// Weather condition options
export const CONDICOES_TEMPO = [
    { value: 'ensolarado', label: '☀️ Ensolarado', icon: 'sun' },
    { value: 'nublado', label: '☁️ Nublado', icon: 'cloud' },
    { value: 'chuvoso', label: '🌧️ Chuvoso', icon: 'cloud-rain' },
    { value: 'tempestade', label: '⛈️ Tempestade', icon: 'cloud-lightning' },
    { value: 'parcialmente_nublado', label: '⛅ Parcialmente Nublado', icon: 'cloud-sun' },
] as const;

// Activity status options
export const STATUS_ATIVIDADE = [
    { value: 'pendente', label: 'Pendente', color: 'bg-gray-100 text-gray-800' },
    { value: 'em_andamento', label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
    { value: 'concluido', label: 'Concluído', color: 'bg-green-100 text-green-800' },
    { value: 'pausado', label: 'Pausado', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
] as const;

// Contest status options
export const STATUS_CONTESTACAO = [
    { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'em_analise', label: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
    { value: 'resolvida', label: 'Resolvida', color: 'bg-green-100 text-green-800' },
    { value: 'rejeitada', label: 'Rejeitada', color: 'bg-red-100 text-red-800' },
] as const;
