import { News, NewsCategory, Occurrence, OccurrenceCategory, Business, BusinessCategory, UsefulContact, ContactCategory } from '@/types';

// News Categories
export const newsCategories: NewsCategory[] = [
  { id: '1', name: 'Comunicados', slug: 'comunicados' },
  { id: '2', name: 'Eventos', slug: 'eventos' },
  { id: '3', name: 'Obras', slug: 'obras' },
  { id: '4', name: 'Utilidade Pública', slug: 'utilidade-publica' },
];

// News
export const news: News[] = [
  {
    id: '1',
    title: 'Mutirão de limpeza no bairro Vista Alegre',
    slug: 'mutirao-limpeza-vista-alegre',
    summary: 'A prefeitura realizará um mutirão de limpeza no próximo sábado. Participe!',
    content: `A Prefeitura de Porto Velho, em parceria com a comunidade local, realizará um grande mutirão de limpeza no bairro Vista Alegre do Abunã no próximo sábado, dia 15.

O evento começará às 7h da manhã e contará com equipes de limpeza urbana, coleta de entulhos e materiais recicláveis.

**O que será feito:**
- Capina e roçagem de áreas públicas
- Coleta de entulhos
- Limpeza de bueiros e valas
- Orientação sobre descarte correto de lixo

**Como participar:**
Os moradores interessados em ajudar podem se apresentar na praça central às 7h. Serão fornecidos equipamentos de proteção e lanche para os voluntários.

Contamos com a participação de todos para mantermos nosso bairro limpo e saudável!`,
    categoryId: '1',
    published: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Festa Junina da Comunidade 2024',
    slug: 'festa-junina-2024',
    summary: 'Venha celebrar a tradicional Festa Junina do Vista Alegre com muita comida típica e quadrilha!',
    content: `É com grande alegria que anunciamos a tradicional Festa Junina do Vista Alegre do Abunã!

**Data:** 22 e 23 de Junho de 2024
**Local:** Praça Central do Vista Alegre
**Horário:** A partir das 18h

**Atrações:**
- Quadrilha tradicional com grupos locais
- Barraquinhas de comidas típicas
- Correio elegante
- Pescaria e outras brincadeiras
- Show com bandas regionais

**Inscrições para barracas:**
Os interessados em montar barracas devem procurar a associação de moradores até o dia 15 de junho.

Tragam a família e venham se divertir! Entrada gratuita.`,
    categoryId: '2',
    published: true,
    createdAt: '2024-01-10T14:30:00Z',
    updatedAt: '2024-01-10T14:30:00Z',
  },
  {
    id: '3',
    title: 'Obra de pavimentação na Rua Principal',
    slug: 'pavimentacao-rua-principal',
    summary: 'Iniciadas as obras de pavimentação asfáltica na Rua Principal. Previsão de conclusão: 30 dias.',
    content: `Informamos aos moradores que iniciaram hoje as obras de pavimentação asfáltica na Rua Principal do Vista Alegre.

**Detalhes da obra:**
- Extensão: 1,5 km
- Tipo: Pavimentação asfáltica com drenagem
- Prazo estimado: 30 dias
- Empresa responsável: Construtora ABC

**Orientações aos moradores:**
- Evitem estacionar veículos na via durante as obras
- Atenção redobrada com crianças e animais
- Em caso de dúvidas, procurem a fiscalização da obra

Pedimos a compreensão de todos pelos transtornos temporários. Ao final, teremos uma via muito mais segura e confortável.`,
    categoryId: '3',
    published: true,
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-05T08:00:00Z',
  },
];

// Occurrence Categories
export const occurrenceCategories: OccurrenceCategory[] = [
  { id: '1', name: 'Iluminação', slug: 'iluminacao', icon: 'Lightbulb' },
  { id: '2', name: 'Buracos/Vias', slug: 'buracos-vias', icon: 'Construction' },
  { id: '3', name: 'Água/Saneamento', slug: 'agua-saneamento', icon: 'Droplets' },
  { id: '4', name: 'Lixo/Entulho', slug: 'lixo-entulho', icon: 'Trash2' },
  { id: '5', name: 'Árvores/Vegetação', slug: 'arvores-vegetacao', icon: 'TreePine' },
  { id: '6', name: 'Outros', slug: 'outros', icon: 'AlertCircle' },
];

// Occurrences
export const occurrences: Occurrence[] = [
  {
    id: '1',
    title: 'Poste de luz queimado na Rua das Flores',
    description: 'O poste em frente ao número 234 está com a lâmpada queimada há mais de uma semana, deixando a rua muito escura à noite.',
    categoryId: '1',
    location: 'Rua das Flores, 234',
    status: 'em_andamento',
    published: true,
    userName: 'Maria Silva',
    createdAt: '2024-01-12T18:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: '2',
    title: 'Buraco grande na Avenida Central',
    description: 'Existe um buraco muito grande próximo à padaria, que está causando problemas para carros e motos que passam pelo local.',
    categoryId: '2',
    location: 'Avenida Central, próximo à Padaria Boa Vista',
    status: 'pendente',
    published: true,
    userName: 'João Santos',
    createdAt: '2024-01-14T09:30:00Z',
    updatedAt: '2024-01-14T09:30:00Z',
  },
  {
    id: '3',
    title: 'Falta de água na Rua dos Ipês',
    description: 'Estamos há 3 dias sem água na região da Rua dos Ipês. Já tentamos contato com a CAERD mas sem sucesso.',
    categoryId: '3',
    location: 'Rua dos Ipês e adjacências',
    status: 'resolvida',
    published: true,
    userName: 'Ana Oliveira',
    createdAt: '2024-01-08T07:00:00Z',
    updatedAt: '2024-01-11T16:00:00Z',
  },
];

// Business Categories
export const businessCategories: BusinessCategory[] = [
  { id: '1', name: 'Mercado/Mercearia', slug: 'mercado-mercearia', icon: 'ShoppingCart' },
  { id: '2', name: 'Restaurante/Lanchonete', slug: 'restaurante-lanchonete', icon: 'UtensilsCrossed' },
  { id: '3', name: 'Oficina/Borracharia', slug: 'oficina-borracharia', icon: 'Wrench' },
  { id: '4', name: 'Farmácia', slug: 'farmacia', icon: 'Pill' },
  { id: '5', name: 'Salão de Beleza', slug: 'salao-beleza', icon: 'Scissors' },
  { id: '6', name: 'Serviços Gerais', slug: 'servicos-gerais', icon: 'Briefcase' },
];

// Businesses
export const businesses: Business[] = [
  {
    id: '1',
    name: 'Mercado Boa Vista',
    description: 'Mercado completo com açougue, padaria e hortifruti fresquinho todos os dias.',
    categoryId: '1',
    address: 'Avenida Central, 100',
    phone: '(69) 3221-0001',
    whatsapp: '5569999990001',
    openingHours: 'Seg-Sáb: 6h-21h | Dom: 6h-12h',
    approved: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Borracharia do Zé',
    description: 'Serviços de borracharia, troca de óleo e pequenos reparos. Atendimento 24 horas para emergências.',
    categoryId: '3',
    address: 'Rua Principal, 500',
    phone: '(69) 3221-0002',
    whatsapp: '5569999990002',
    openingHours: 'Seg-Sáb: 7h-18h | Emergência: 24h',
    approved: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Restaurante Sabor da Terra',
    description: 'Comida caseira com pratos regionais. Almoço por quilo e marmitex para levar.',
    categoryId: '2',
    address: 'Rua das Flores, 45',
    phone: '(69) 3221-0003',
    whatsapp: '5569999990003',
    openingHours: 'Seg-Sex: 11h-14h',
    approved: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Farmácia Popular Vista Alegre',
    description: 'Medicamentos, produtos de higiene e conveniência. Entrega em domicílio.',
    categoryId: '4',
    address: 'Avenida Central, 250',
    phone: '(69) 3221-0004',
    whatsapp: '5569999990004',
    openingHours: 'Seg-Sáb: 7h-22h | Dom: 8h-12h',
    approved: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Contact Categories
export const contactCategories: ContactCategory[] = [
  { id: '1', name: 'Saúde', slug: 'saude' },
  { id: '2', name: 'Segurança', slug: 'seguranca' },
  { id: '3', name: 'Educação', slug: 'educacao' },
  { id: '4', name: 'Serviços Públicos', slug: 'servicos-publicos' },
  { id: '5', name: 'Emergência', slug: 'emergencia' },
];

// Useful Contacts
export const usefulContacts: UsefulContact[] = [
  {
    id: '1',
    name: 'Unidade Básica de Saúde Vista Alegre',
    categoryId: '1',
    phone: '(69) 3221-1001',
    address: 'Rua da Saúde, 100',
    openingHours: 'Seg-Sex: 7h-17h',
    description: 'Atendimento médico básico, vacinação e acompanhamento de gestantes.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Polícia Militar - 190',
    categoryId: '2',
    phone: '190',
    description: 'Emergências policiais. Ligue 190 para qualquer situação de risco.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Corpo de Bombeiros - 193',
    categoryId: '5',
    phone: '193',
    description: 'Incêndios, resgates e emergências. Ligue 193.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'SAMU - 192',
    categoryId: '5',
    phone: '192',
    description: 'Serviço de Atendimento Móvel de Urgência. Emergências médicas.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Escola Municipal Vista Alegre',
    categoryId: '3',
    phone: '(69) 3221-2001',
    address: 'Rua da Educação, 200',
    openingHours: 'Seg-Sex: 7h-17h',
    description: 'Ensino fundamental. Matrículas abertas em janeiro e julho.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    name: 'CAERD - Companhia de Águas',
    categoryId: '4',
    phone: '0800 647 0115',
    description: 'Falta de água, vazamentos, ligações novas e segundas vias.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    name: 'Energisa - Energia Elétrica',
    categoryId: '4',
    phone: '0800 647 0120',
    description: 'Falta de energia, problemas na rede, ligações novas.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '8',
    name: 'Conselho Tutelar',
    categoryId: '2',
    phone: '(69) 3221-3001',
    address: 'Rua Central, 300',
    openingHours: 'Seg-Sex: 8h-18h | Plantão: 24h',
    description: 'Proteção e defesa dos direitos de crianças e adolescentes.',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Packages (mock data for existing feature)
export const packages = [
  { id: '1', recipientName: 'Maria Silva', trackingCode: 'RP123456789BR', status: 'aguardando' as const, arrivalDate: '2024-01-14', pickupDeadline: '2024-01-21' },
  { id: '2', recipientName: 'João Santos', trackingCode: 'RP987654321BR', status: 'aguardando' as const, arrivalDate: '2024-01-13', pickupDeadline: '2024-01-20' },
  { id: '3', recipientName: 'Ana Oliveira', trackingCode: 'RP456789123BR', status: 'aguardando' as const, arrivalDate: '2024-01-12', pickupDeadline: '2024-01-19' },
  { id: '4', recipientName: 'Carlos Souza', trackingCode: 'RP789123456BR', status: 'retirada' as const, arrivalDate: '2024-01-10', pickupDeadline: '2024-01-17' },
];
