(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-nav');
  toggle?.addEventListener('click', () => {
    if (!menu) return;
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    menu.hidden = expanded;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      toggle.click();
      toggle.focus();
    }
  });

  const path = location.pathname.replace(/\/$/, '');
  if (path !== '/guides' && path !== '/search') return;
  const grid = document.querySelector('.listing .guide-grid');
  if (!grid) return;
  const initialCards = [...grid.querySelectorAll('.guide-card')];
  const cardsBySlug = new Map(initialCards.map((card) => [card.querySelector('a')?.getAttribute('href')?.split('/')[2], card]));
  const loadingError = () => {
    const status = document.querySelector('.search-count');
    if (status) status.textContent = 'Search is temporarily unavailable. Browse all guides below.';
  };

  fetch('/assets/preview-data.json').then((response) => {
    if (!response.ok) throw new Error('Preview index unavailable');
    return response.json();
  }).then((index) => {
    index.forEach((guide) => {
      const card = cardsBySlug.get(guide.slug);
      if (card) card.dataset.category = guide.category;
    });
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.hidden = true;
    const heading = document.createElement('h2');
    heading.textContent = 'No guides found this time.';
    const explanation = document.createElement('p');
    explanation.textContent = 'Try a shorter phrase such as “desk”, “lamp”, or “keyboard”, or browse the full library.';
    const link = document.createElement('a');
    link.href = '/guides/'; link.className = 'text-link'; link.textContent = 'Browse all guides →';
    empty.append(heading, explanation, link);
    grid.after(empty);

    function render() {
      const params = new URLSearchParams(location.search);
      const category = params.get('category');
      const query = (params.get('q') || '').trim().slice(0, 120);
      const selected = ['workspace', 'lighting', 'accessories'].includes(category) ? category : '';
      const results = index.filter((guide) => path === '/guides' ? !selected || guide.category === selected : !query || guide.text.toLowerCase().includes(query.toLowerCase()));
      grid.replaceChildren(...results.map((guide) => {
        const existing = cardsBySlug.get(guide.slug);
        if (existing) return existing;
        const template = document.createElement('template');
        template.innerHTML = guide.html;
        return template.content.firstElementChild;
      }));
      grid.hidden = results.length === 0;
      empty.hidden = results.length !== 0;
      if (path === '/guides') {
        document.querySelectorAll('.filters .filter').forEach((filter) => {
          const active = (new URL(filter.href).searchParams.get('category') || '') === selected;
          filter.dataset.active = String(active);
          if (active) filter.setAttribute('aria-current', 'page');
          else filter.removeAttribute('aria-current');
        });
      } else {
        document.querySelector('#search-query').value = query;
        document.querySelector('.search-count').textContent = query ? `${results.length} ${results.length === 1 ? 'guide' : 'guides'} found for “${query}”` : 'Explore all guides, or search for a topic.';
      }
    }
    render();
    window.addEventListener('popstate', render);
    if (path === '/guides') {
      document.querySelectorAll('.filters .filter').forEach((filter) => filter.addEventListener('click', (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault(); history.pushState(null, '', filter.href); render();
      }));
    } else {
      document.querySelector('.search-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const query = document.querySelector('#search-query').value.trim().slice(0, 120);
        history.pushState(null, '', query ? `/search/?q=${encodeURIComponent(query)}` : '/search/');
        render();
      });
    }
  }).catch(loadingError);
})();
