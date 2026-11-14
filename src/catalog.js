import catalog from './catalog.json';

export const { categories, uses, plugins } = catalog;

export const isInstrument = (plugin) => plugin.categories.includes('synth');
export const useLabel = (key) => key === 'instruments' ? 'Для инструментальных дорожек' : uses[key];

const normalize = (text) => text.normalize('NFKC').toLocaleLowerCase('ru')
  .replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const compact = (text) => normalize(text).replaceAll(' ', '');

const categoryOrder = Object.keys(categories);
const indexed = plugins.map((plugin) => ({
  plugin,
  names: [plugin.name, plugin.displayName].map(compact),
  text: normalize([plugin.name, plugin.displayName, plugin.publisher, ...plugin.searchTerms,
    plugin.description, ...plugin.categories.map((key) => categories[key]),
    ...plugin.uses.flatMap((key) => [uses[key], useLabel(key)])].join(' ')),
}));

export function matchPlugins({ mode, query, use, category, favorites, exactKey }) {
  const words = normalize(query).split(' ').filter(Boolean);
  return indexed.filter(({ plugin, text, names }) => (
    (!exactKey || plugin.key === exactKey) &&
    (mode === 'library' || isInstrument(plugin) === (mode === 'instruments')) &&
    (!use || plugin.uses.includes(use)) &&
    (!category || plugin.categories.includes(category)) &&
    (!favorites || favorites.has(plugin.key)) &&
    (exactKey || words.every((word) => text.includes(word) || names.some((name) => name.includes(word))))
  )).map(({ plugin }) => plugin);
}

export function groupPlugins(items, mode, category) {
  if (mode === 'library') {
    return [
      ['Обработка', items.filter((plugin) => !isInstrument(plugin))],
      ['Инструменты', items.filter(isInstrument)],
    ].filter(([, group]) => group.length);
  }
  const byCategory = mode === 'categories';
  const groups = new Map();
  for (const plugin of items) {
    const keys = byCategory ? (category ? [category] : plugin.categories) : [plugin.publisher];
    for (const key of keys) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(plugin);
    }
  }
  return [...groups].sort(([left], [right]) => (
    byCategory
      ? categoryOrder.indexOf(left) - categoryOrder.indexOf(right)
      : left.localeCompare(right, 'ru', { sensitivity: 'base' })
  ));
}

const chainAliases = {
  'Pro-Q 4 Dynamic': 'Pro-Q 4',
  'Pro-Q 4 M/S': 'Pro-Q 4',
  'Black Box HG-Q': 'Black Box Analog Design HG-Q',
  'Black Box HG-2': 'Black Box Analog Design HG-2',
  'HG-2MS': 'Black Box Analog Design HG-2MS',
  'Pultec EQP-1A': 'Pultec EQP-1A EQ',
};

const pluginsByName = new Map(plugins.flatMap((plugin) => (
  [plugin.name, plugin.displayName].map((name) => [compact(name), plugin])
)));

export function findChainPlugin(label) {
  const name = chainAliases[label] ?? label.replace(/^Ozone (?!12 )/, 'Ozone 12 ');
  return pluginsByName.get(compact(name));
}

const plural = new Intl.PluralRules('ru');
const pluginWords = { one: 'плагин', few: 'плагина', many: 'плагинов' };

export function pluginCount(count) {
  return `${count} ${pluginWords[plural.select(count)] ?? 'плагинов'}`;
}

export const primaryTypes = {
  eq: 'EQ', dyneq: 'Динамический EQ / резонансы', comp: 'Компрессор',
  sat: 'Сатурация / tape', verb: 'Реверберация', delay: 'Delay', mod: 'Модуляция',
  dist: 'Distortion', clip: 'Клиппер', limit: 'Лимитер', sc: 'Sidechain / unmasking',
  creative: 'Creative FX', pitch: 'Pitch / выравнивание', synth: 'Инструмент',
  monitor: 'Мониторинг', restore: 'Восстановление', transient: 'Транзиенты',
  stereo: 'Стерео / M/S', strip: 'Комплексная обработка', deess: 'De-esser',
  gate: 'Gate / экспандер', utility: 'Служебный инструмент',
};
