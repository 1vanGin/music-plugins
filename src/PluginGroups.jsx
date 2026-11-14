import { categories, isInstrument, pluginCount, primaryTypes, useLabel } from './catalog.js';
import Icon from './Icon.jsx';

function PluginRow({ plugin, use, category, showPublisher, showKind, saved, onFavorite }) {
  const primary = plugin.categories[0];
  return (
    <li className="plugin" data-plugin={plugin.key}>
      <div className="plugin-content">
        <div className="plugin-heading">
          <h2>{plugin.displayName}</h2>
          {showKind && !isInstrument(plugin) && <span className="classification">Обработка</span>}
          <span className="classification">{primaryTypes[primary]}</span>
          {category && category !== primary && (
            <span className="classification classification-match">{primaryTypes[category]}</span>
          )}
          {showPublisher && <span className="manufacturer">{plugin.publisher}</span>}
          {plugin.version && <span className="classification plugin-version">{plugin.version}</span>}
        </div>
        <p className="description">{plugin.description}</p>
        <div className="uses" aria-label="Подходит для">
          {plugin.uses.map((key) => (
            <span key={key} className={key === use ? 'matching' : undefined}>{useLabel(key)}</span>
          ))}
        </div>
        {plugin.note && <p className="note"><b>Уточнение:</b> {plugin.note}</p>}
      </div>
      <div className="plugin-actions">
        <button
          className={`icon-button${saved ? ' saved' : ''}`}
          data-favorite={plugin.key}
          aria-pressed={saved}
          aria-label={`Избранное: ${plugin.displayName}`}
          title={saved ? 'Убрать из избранного' : 'В избранное'}
          onClick={() => onFavorite(plugin.key)}
        >
          <Icon name="star" />
        </button>
        {plugin.source && (
          <a
            href={plugin.source} target="_blank" rel="noopener" className="source"
            aria-label={`Источник: ${plugin.displayName}`} title="Описание и документация"
          >
            <Icon name="external" />
          </a>
        )}
      </div>
    </li>
  );
}

export default function PluginGroups({
  hidden, mode, tab, groups, favorites, use, category, favoritesEmpty, isOpen, onToggle, onFavorite, onReset,
}) {
  const byCategory = mode === 'categories';
  const library = mode === 'library';
  return (
    <section id="groups" role="tabpanel" aria-labelledby={`${tab}Tab`} tabIndex={0} hidden={hidden}>
      {groups.map(([key, items], index) => (
        <details key={`${mode}:${key}`} className="group" id={`group-${index}`} data-group={key} open={isOpen(key)}>
          <summary onClick={(event) => { event.preventDefault(); onToggle(key); }}>
            <span className="chevron"><Icon name="chevron" /></span>
            <span>{byCategory ? categories[key] : key}</span>
            <span className="group-count" aria-label={pluginCount(items.length)}>{items.length}</span>
          </summary>
          <ul className="plugin-list">
            {items.map((plugin) => (
              <PluginRow key={plugin.key} plugin={plugin} showPublisher={byCategory || library} showKind={library}
                use={use} category={byCategory ? key : category} saved={favorites.has(plugin.key)} onFavorite={onFavorite} />
            ))}
          </ul>
        </details>
      ))}
      {groups.length === 0 && (
        <div className="empty">
          <h2>{favoritesEmpty ? 'В избранном пока пусто' : 'Совпадений нет'}</h2>
          <p>{favoritesEmpty ? 'Добавляй плагины звёздочкой рядом с названием.' : 'Попробуй изменить поиск или сбросить фильтры.'}</p>
          <button onClick={onReset}>Показать все плагины</button>
        </div>
      )}
    </section>
  );
}
