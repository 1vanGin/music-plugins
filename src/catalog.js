import catalog from './catalog.json';

export const { categories, uses, plugins } = catalog;

const categoryOrder = Object.keys(categories);
const indexed = plugins.map((plugin) => ({
  plugin,
  text: [plugin.name, plugin.displayName, plugin.publisher, ...plugin.searchTerms,
    plugin.description, ...plugin.categories.map((key) => categories[key]),
    ...plugin.uses.map((key) => uses[key])].join(' ').toLocaleLowerCase('ru'),
}));

export function matchPlugins(query, use, favoritesOnly, favorites) {
  const words = query.toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
  return indexed.filter(({ plugin, text }) => (
    (!use || plugin.uses.includes(use)) &&
    (!favoritesOnly || favorites.has(plugin.key)) &&
    words.every((word) => text.includes(word))
  )).map(({ plugin }) => plugin);
}

export function groupPlugins(items, mode) {
  const groups = new Map();
  for (const plugin of items) {
    const keys = mode === 'publishers' ? [plugin.publisher] : plugin.categories;
    for (const key of keys) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(plugin);
    }
  }
  return [...groups].sort(([left], [right]) => (
    mode === 'publishers'
      ? left.localeCompare(right, 'ru', { sensitivity: 'base' })
      : categoryOrder.indexOf(left) - categoryOrder.indexOf(right)
  ));
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
