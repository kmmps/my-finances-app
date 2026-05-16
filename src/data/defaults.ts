import type { Tag, Bill, Income } from '../types';

export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-moradia',  name: 'Moradia',  color: 'blue',   emoji: '🏠' },
  { id: 'tag-cartao',   name: 'Cartão',   color: 'purple', emoji: '💳' },
  { id: 'tag-saude',    name: 'Saúde',    color: 'green',  emoji: '❤️' },
  { id: 'tag-seguro',   name: 'Seguro',   color: 'yellow', emoji: '🛡️' },
  { id: 'tag-pessoal',  name: 'Pessoal',  color: 'pink',   emoji: '👤' },
  { id: 'tag-imposto',  name: 'Imposto',  color: 'red',    emoji: '📋' },
];

const EB = { pixCode: '', file: null }; // empty boleto

// Sorted by dueDay so the initial display order is natural
export const DEFAULT_BILLS: Bill[] = [
  { id: 'bill-itau',     name: 'Cartão Itaú',        amount: 7197, dueDay: 1,  tagIds: ['tag-cartao'],  isPaid: false, isAutoDebit: true,  boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-clea',     name: 'Clea',                amount: 920,  dueDay: 5,  tagIds: ['tag-pessoal'], isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-alice',    name: 'Alice Terapia',       amount: 1200, dueDay: 5,  tagIds: ['tag-saude'],   isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-aluguel',  name: 'Aluguel',             amount: 4446, dueDay: 5,  tagIds: ['tag-moradia'], isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-luz',      name: 'Luz',                 amount: 120,  dueDay: 10, tagIds: ['tag-moradia'], isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-parcelas', name: 'Parcelas Apto',       amount: 1200, dueDay: 10, tagIds: ['tag-moradia'], isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-gas',      name: 'Gás',                 amount: 14,   dueDay: 11, tagIds: ['tag-moradia'], isPaid: false, isAutoDebit: true,  boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-c6',       name: 'Cartão C6',           amount: 377,  dueDay: 15, tagIds: ['tag-cartao'],  isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-nubank',   name: 'Cartão Nubank',       amount: 49,   dueDay: 15, tagIds: ['tag-cartao'],  isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-porto',    name: 'Porto Seguro Carro',  amount: 625,  dueDay: 15, tagIds: ['tag-seguro'],  isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
  { id: 'bill-mei',      name: 'MEI',                 amount: 90,   dueDay: 20, tagIds: ['tag-imposto'], isPaid: false, isAutoDebit: false, boleto: EB, comprovantes: [], note: '' },
];

export const DEFAULT_INCOMES: Income[] = [
  { id: 'income-salario', name: 'Salário', amount: 13268, type: 'base'  },
  { id: 'income-extra',   name: 'Extra',   amount: 2800,  type: 'extra' },
];

export const DEFAULT_TAG_EMOJIS: Record<string, string> = {
  'tag-moradia': '🏠',
  'tag-cartao':  '💳',
  'tag-saude':   '❤️',
  'tag-seguro':  '🛡️',
  'tag-pessoal': '👤',
  'tag-imposto': '📋',
};
