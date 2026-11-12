import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { groupPlugins, matchPlugins, pluginCount, plugins, uses } from './catalog.js';
import Icon from './Icon.jsx';
import MasterChain from './MasterChain.jsx';
import PluginGroups from './PluginGroups.jsx';

const tabs = [
  { mode: 'publishers', id: 'publishersTab', label: 'Издатели' },
  { mode: 'categories', id: 'categoriesTab', label: 'Категории' },
  { mode: 'master', id: 'masterChainTab', label: 'Мастер-цепочка' },
];
const useChoices = [['', 'Всё'], ...Object.entries(uses)];
const pluginKeys = new Set(plugins.map(({ key }) => key));
const publisherNames = new Set(plugins.map(({ publisher }) => publisher));
const legacyPublisher = new Map(plugins.map(({ manufacturer, publisher }) => [manufacturer, publisher]));

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function readList(key, fallback = []) {
  const saved = read(key, fallback);
  return Array.isArray(saved) ? saved : fallback;
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function initialOpenGroups() {
  const oldGroups = readList('plugin-browser-open-manufacturers');
  const publishers = readList('plugin-browser-open-publishers', oldGroups);
  return {
    publishers: new Set(publishers.map((key) => (
      publisherNames.has(key) ? key : (legacyPublisher.get(key) ?? key)
    ))),
    categories: new Set(readList('plugin-browser-open-categories')),
  };
}

function toggleMember(set, key) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

function Alphabet({ groups, hidden }) {
  if (hidden) return null;

  const letters = new Map();
  groups.forEach(([key], index) => {
    const letter = key.charAt(0).toLocaleUpperCase('ru');
    if (!letters.has(letter)) letters.set(letter, index);
  });

  return (
    <nav id="alphabet" aria-label="Перейти к издателям по первой букве">
      {[...letters].map(([letter, index]) => (
        <a key={letter} href={`#group-${index}`} aria-label={`К издателям на ${letter}`}
          onClick={(event) => {
            const group = document.getElementById(`group-${index}`);
            if (!group) return;
            event.preventDefault();
            group.scrollIntoView({ block: 'start' });
            group.querySelector('summary')?.focus({ preventScroll: true });
          }}
        >{letter}</a>
      ))}
    </nav>
  );
}

export default function App() {
  const [mode, setMode] = useState('publishers');
  const [catalogMode, setCatalogMode] = useState('publishers');
  const [search, setSearch] = useState('');
  const [use, setUse] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set(readList('vst3-favorites').filter((key) => pluginKeys.has(key))));
  const [opened, setOpened] = useState(initialOpenGroups);
  const [searchCollapsed, setSearchCollapsed] = useState(() => new Set());
  const [theme, setTheme] = useState(() => read('mix-atlas-theme', 'dark') === 'light' ? 'light' : 'dark');
  const [status, setStatus] = useState('');
  const searchField = useRef(null);
  const heading = useRef(null);
  const controls = useRef(null);
  const focusOnReturn = useRef(false);
  const favoritesButton = useRef(null);

  const master = mode === 'master';
  const query = search.trim();
  const matches = useMemo(() => matchPlugins(query, use, favoritesOnly, favorites), [query, use, favoritesOnly, favorites]);
  const groups = useMemo(() => groupPlugins(matches, catalogMode), [matches, catalogMode]);
  const showAlphabet = catalogMode === 'publishers' && !query && groups.length > 0;
  const themeAction = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';

  function selectMode(next) {
    setMode(next);
    if (next !== 'master') setCatalogMode(next);
    setSearchCollapsed(new Set());
  }

  function changeSearch(value) {
    setSearch(value);
    setSearchCollapsed(new Set());
  }

  function clearSearch() {
    changeSearch('');
    searchField.current.focus();
  }

  function resetFilters() {
    setUse('');
    setFavoritesOnly(false);
    clearSearch();
  }

  function updateOpenGroups(next) {
    setOpened({ ...opened, [catalogMode]: next });
    save(`plugin-browser-open-${catalogMode}`, [...next]);
  }

  function toggleGroup(key) {
    if (query) setSearchCollapsed(toggleMember(searchCollapsed, key));
    else updateOpenGroups(toggleMember(opened[catalogMode], key));
  }

  function collapseGroups() {
    if (query) setSearchCollapsed(new Set(groups.map(([key]) => key)));
    else updateOpenGroups(new Set());
  }

  function toggleFavorite(key) {
    const next = toggleMember(favorites, key);
    setFavorites(next);
    const stored = save('vst3-favorites', [...next]);
    const message = next.has(key) ? 'Добавлено в избранное.' : 'Убрано из избранного.';
    setStatus(stored ? message : `${message} Сохранение доступно только в этой сессии.`);
    if (favoritesOnly && !next.has(key)) favoritesButton.current.focus({ preventScroll: true });
  }

  function handleTabKeys(event) {
    const index = tabs.findIndex((tab) => tab.mode === mode);
    const nextIndex = {
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectMode(tabs[nextIndex].mode);
    document.getElementById(tabs[nextIndex].id).focus();
  }

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    save('mix-atlas-theme', theme);
  }, [theme]);

  useLayoutEffect(() => {
    if (!master && focusOnReturn.current) {
      focusOnReturn.current = false;
      searchField.current.focus();
      searchField.current.select();
    }
  }, [master]);

  useLayoutEffect(() => {
    const sync = () => {
      const height = heading.current.getBoundingClientRect().height + controls.current.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--sticky-offset', `${height}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(heading.current);
    observer.observe(controls.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handleShortcut(event) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      if (master) {
        focusOnReturn.current = true;
        setSearchCollapsed(new Set());
        setMode(catalogMode);
      } else {
        searchField.current.focus();
        searchField.current.select();
      }
    }
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, [master, catalogMode]);

  return (
    <>
      <a className="skip" href={master ? '#masterChain' : '#groups'}>{master ? 'К мастер-цепочке' : 'К списку плагинов'}</a>
      <main className="browser">
        <header className="heading" ref={heading}>
          <div className="identity"><Icon name="library" className="library-mark" /><h1>Плагины</h1></div>
          <div className="search" hidden={master}>
            <span data-icon="search"><Icon name="search" /></span>
            <input id="search" ref={searchField} type="search" value={search}
              placeholder="Название, издатель, обработка…" aria-label="Поиск плагинов"
              autoComplete="off" spellCheck={false} onChange={(event) => changeSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && search) { event.preventDefault(); clearSearch(); }
              }}
            />
            <kbd aria-hidden="true">⌘ K</kbd>
            <button id="clearSearch" className="icon-button" aria-label="Очистить поиск"
              title="Очистить поиск" hidden={!search} onClick={clearSearch}><Icon name="close" /></button>
          </div>
        </header>
        <aside className="sidebar" aria-label="Фильтры библиотеки">
          <div className="sidebar-main" hidden={master}>
            <h2 className="rail-heading">Библиотека</h2>
            <button id="favoritesOnly" ref={favoritesButton} className="favorite-filter" aria-pressed={favoritesOnly}
              onClick={() => setFavoritesOnly(!favoritesOnly)}><Icon name="star" /><span>Избранное</span></button>
            <div className="use-control">
              <h2 className="rail-heading" id="useLabel">Подходит для</h2>
              <div id="uses" className="use-list" role="group" aria-labelledby="useLabel">
                {useChoices.map(([key, label]) => (
                  <button key={key} data-use={key} aria-pressed={key === use} onClick={() => setUse(key)}>{label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="sidebar-bottom">
            <button id="theme" className="theme-button" aria-label={themeAction} title={themeAction}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <span className="theme-swatch" aria-hidden="true" />
              <span id="themeLabel">{theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}</span>
            </button>
          </div>
        </aside>
        <div className="workspace">
          <div className="browse-controls" ref={controls}>
            <div className="list-heading">
              <div className="tabs" role="tablist" aria-label="Способ навигации" onKeyDown={handleTabKeys}>
                {tabs.map((tab) => (
                  <button key={tab.mode} id={tab.id} role="tab" aria-selected={mode === tab.mode}
                    aria-controls={tab.mode === 'master' ? 'masterChain' : 'groups'} tabIndex={mode === tab.mode ? 0 : -1}
                    onClick={() => selectMode(tab.mode)}>{tab.label}</button>
                ))}
              </div>
              <span id="resultCount" role="status" aria-live="polite" hidden={master}>
                {pluginCount(matches.length)}{use && ` · ${uses[use]}`}
              </span>
            </div>
            <div className="list-toolbar" hidden={master}>
              <Alphabet groups={groups} hidden={!showAlphabet} />
              <span id="navigationHint" hidden={showAlphabet}>
                {query ? 'Результаты поиска' : (catalogMode === 'publishers' ? 'Издатели по алфавиту' : 'Группы по обработке')}
              </span>
              <div>
                <button id="reset" className="text-button" hidden={!search && !use && !favoritesOnly}
                  onClick={resetFilters}>Сбросить фильтры</button>
                <button id="collapse" className="text-button" disabled={!groups.length} onClick={collapseGroups}>Свернуть всё</button>
              </div>
            </div>
          </div>
          <PluginGroups hidden={master} mode={catalogMode} groups={groups} favorites={favorites} use={use}
            favoritesEmpty={favoritesOnly && !query && !use} onToggle={toggleGroup} onFavorite={toggleFavorite}
            isOpen={(key) => query ? !searchCollapsed.has(key) : opened[catalogMode].has(key)} onReset={resetFilters} />
          <MasterChain hidden={!master} />
          <footer id="catalogFooter" hidden={master}>
            <span>Последние установленные версии</span><a href="#top" id="backToTop">К началу</a>
          </footer>
        </div>
        <div id="status" className="sr-only" role="status">{status}</div>
      </main>
    </>
  );
}
