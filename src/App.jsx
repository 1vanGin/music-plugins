import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { categories, groupPlugins, isInstrument, matchPlugins, pluginCount, plugins, useLabel, uses } from './catalog.js';
import Icon from './Icon.jsx';
import MasterChain from './MasterChain.jsx';
import PluginGroups from './PluginGroups.jsx';

const tabs = [
  { mode: 'publishers', id: 'publishersTab', label: 'Издатели' },
  { mode: 'categories', id: 'categoriesTab', label: 'Категории' },
  { mode: 'instruments', id: 'instrumentsTab', label: 'Инструменты' },
  { mode: 'master', id: 'masterChainTab', label: 'Мастер-цепочка' },
];
const navigationHints = {
  publishers: 'Издатели по алфавиту',
  categories: 'Группы по обработке',
  instruments: 'Синтезаторы и сэмплеры по издателям',
};
const useChoices = [['', 'Все дорожки'], ...Object.keys(uses).map((key) => [key, useLabel(key)])];
const processingCategories = Object.entries(categories).filter(([key]) => key !== 'synth');
const pluginKeys = new Set(plugins.map(({ key }) => key));
const publisherNames = new Set(plugins.map(({ publisher }) => publisher));
const instrumentPublishers = [...new Set(plugins.filter(isInstrument).map(({ publisher }) => publisher))];
const legacyPublisher = new Map(plugins.map(({ manufacturer, publisher }) => [manufacturer, publisher]));

function linkedPluginKey() {
  if (!location.hash.startsWith('#plugin=')) return '';
  try {
    const key = decodeURIComponent(location.hash.slice('#plugin='.length));
    return pluginKeys.has(key) ? key : '';
  } catch {
    return '';
  }
}

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
    instruments: new Set(readList('plugin-browser-open-instruments', instrumentPublishers)),
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
  const [category, setCategory] = useState('');
  const [exactKey, setExactKey] = useState(linkedPluginKey);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set(readList('vst3-favorites').filter((key) => pluginKeys.has(key))));
  const [opened, setOpened] = useState(initialOpenGroups);
  const [resultsCollapsed, setResultsCollapsed] = useState(() => new Set());
  const [theme, setTheme] = useState(() => read('mix-atlas-theme', 'dark') === 'light' ? 'light' : 'dark');
  const [status, setStatus] = useState('');
  const searchField = useRef(null);
  const heading = useRef(null);
  const controls = useRef(null);
  const focusOnReturn = useRef(false);
  const favoritesButton = useRef(null);

  const master = mode === 'master' && !exactKey;
  const instruments = catalogMode === 'instruments';
  const query = exactKey ? '' : search.trim();
  const showFavorites = favoritesOnly && !exactKey;
  const showFilters = !instruments && !query && !showFavorites && !exactKey;
  const activeUse = showFilters ? use : '';
  const activeCategory = showFilters ? category : '';
  const libraryResults = Boolean(query || showFavorites || exactKey);
  const groupMode = libraryResults ? 'library' : catalogMode;
  const matches = useMemo(() => matchPlugins({
    mode: groupMode, query, use: activeUse, category: activeCategory,
    favorites: showFavorites ? favorites : null, exactKey,
  }), [groupMode, query, activeUse, activeCategory, showFavorites, favorites, exactKey]);
  const groups = useMemo(() => groupPlugins(matches, groupMode, activeCategory), [matches, groupMode, activeCategory]);
  const autoOpen = Boolean(libraryResults || activeCategory || activeUse);
  const isOpen = (key) => autoOpen ? !resultsCollapsed.has(key) : opened[catalogMode].has(key);
  const hasOpenGroups = groups.some(([key]) => isOpen(key));
  const showAlphabet = groupMode === 'publishers' && groups.length > 0;
  const activeTab = exactKey ? catalogMode : mode;
  const themeAction = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';

  function leavePlugin() {
    if (!exactKey) return;
    history.replaceState(history.state, '', `${location.pathname}${location.search}`);
    setExactKey('');
    setMode(catalogMode);
  }

  function selectMode(next) {
    leavePlugin();
    setMode(next);
    if (next !== 'master') setCatalogMode(next);
    setResultsCollapsed(new Set());
  }

  function changeSearch(value) {
    leavePlugin();
    setSearch(value);
    setResultsCollapsed(new Set());
  }

  function clearSearch() {
    changeSearch('');
    searchField.current.focus();
  }

  function resetFilters() {
    if (showFilters) {
      setUse('');
      setCategory('');
    }
    setFavoritesOnly(false);
    clearSearch();
  }

  function updateOpenGroups(next) {
    setOpened({ ...opened, [catalogMode]: next });
    save(`plugin-browser-open-${catalogMode}`, [...next]);
  }

  function toggleGroup(key) {
    if (autoOpen) setResultsCollapsed(toggleMember(resultsCollapsed, key));
    else updateOpenGroups(toggleMember(opened[catalogMode], key));
  }

  function toggleGroups() {
    const keys = groups.map(([key]) => key);
    if (autoOpen) setResultsCollapsed(new Set(hasOpenGroups ? keys : []));
    else updateOpenGroups(new Set(hasOpenGroups ? [] : keys));
  }

  function toggleFavorite(key) {
    const next = toggleMember(favorites, key);
    setFavorites(next);
    const stored = save('vst3-favorites', [...next]);
    const message = next.has(key) ? 'Добавлено в избранное.' : 'Убрано из избранного.';
    setStatus(stored ? message : `${message} Сохранение доступно только в этой сессии.`);
    if (showFavorites && !next.has(key)) favoritesButton.current.focus({ preventScroll: true });
  }

  function handleTabKeys(event) {
    const index = tabs.findIndex((tab) => tab.mode === activeTab);
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
    if (exactKey) document.getElementById('groups').focus();
  }, [exactKey]);

  useEffect(() => {
    function syncPlugin() {
      setExactKey(linkedPluginKey());
      setResultsCollapsed(new Set());
    }
    window.addEventListener('hashchange', syncPlugin);
    return () => window.removeEventListener('hashchange', syncPlugin);
  }, []);

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
        setResultsCollapsed(new Set());
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
          <div className="library-actions">
            <button id="favoritesOnly" ref={favoritesButton} className="favorite-filter" aria-pressed={showFavorites}
              hidden={master} onClick={() => {
                leavePlugin();
                setFavoritesOnly(!showFavorites);
                setResultsCollapsed(new Set());
              }}><Icon name="star" /><span>Избранное</span></button>
            <button id="theme" className="theme-button" aria-label={themeAction} title={themeAction}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <span className="theme-swatch" aria-hidden="true" />
            </button>
          </div>
          <div className="search" hidden={master}>
            <span data-icon="search"><Icon name="search" /></span>
            <input id="search" ref={searchField} type="search" value={search}
              placeholder="Поиск по всей библиотеке…" aria-label="Поиск по всей библиотеке"
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
        <div className="workspace">
          <div className="browse-controls" ref={controls}>
            <div className="list-heading">
              <div className="tabs" role="tablist" aria-label="Способ навигации" onKeyDown={handleTabKeys}>
                {tabs.map((tab) => (
                  <button key={tab.mode} id={tab.id} role="tab" aria-selected={activeTab === tab.mode}
                    aria-controls={tab.mode === 'master' ? 'masterChain' : 'groups'} tabIndex={activeTab === tab.mode ? 0 : -1}
                    onClick={() => selectMode(tab.mode)}>{tab.label}</button>
                ))}
              </div>
              <span id="resultCount" role="status" aria-live="polite" hidden={master}>
                {pluginCount(matches.length)}
              </span>
            </div>
            <div className="catalog-filters" role="group" aria-label="Фильтры обработки" hidden={master || !showFilters}>
              <label>Подходит для
                <select value={use} onChange={(event) => {
                  setUse(event.target.value);
                  setResultsCollapsed(new Set());
                }}>
                  {useChoices.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
              <label>Тип обработки
                <select value={category} onChange={(event) => {
                  setCategory(event.target.value);
                  setResultsCollapsed(new Set());
                }}>
                  <option value="">Все типы</option>
                  {processingCategories.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </label>
            </div>
            <div className="list-toolbar" hidden={master}>
              <Alphabet groups={groups} hidden={!showAlphabet} />
              <span id="navigationHint" hidden={showAlphabet}>
                {exactKey ? 'Карточка плагина' : showFavorites ? 'Избранное по всей библиотеке'
                  : query ? 'Результаты поиска по библиотеке' : navigationHints[catalogMode]}
              </span>
              <div>
                <button id="reset" className="text-button" hidden={!exactKey && !activeUse && !activeCategory && !showFavorites}
                  onClick={resetFilters}>{exactKey ? 'К каталогу' : 'Сбросить фильтры'}</button>
                <button id="collapse" className="text-button" hidden={!groups.length || Boolean(exactKey)} onClick={toggleGroups}>
                  {hasOpenGroups ? 'Свернуть всё' : 'Развернуть всё'}
                </button>
              </div>
            </div>
          </div>
          <PluginGroups hidden={master} mode={groupMode} tab={activeTab} groups={groups} favorites={favorites}
            use={activeUse} category={activeCategory} favoritesEmpty={showFavorites && !query}
            onToggle={toggleGroup} onFavorite={toggleFavorite} isOpen={isOpen} onReset={resetFilters} />
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
