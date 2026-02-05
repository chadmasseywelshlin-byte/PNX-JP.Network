// js/engine.js
document.addEventListener('DOMContentLoaded', () => {
  const content = document.getElementById('content');

  // Function to load a page
  async function loadPage(page) {
    try {
      const res = await fetch(`pages/${page}.html`);
      if (!res.ok) throw new Error('Page not found');
      const html = await res.text();
      content.innerHTML = html;
      document.title = page; // Update page title
      history.pushState({page}, page, `#${page}`);
    } catch {
      content.innerHTML = '<h2>Page not found</h2>';
    }
  }

  // Handle navigation clicks
  document.body.addEventListener('click', e => {
    if(e.target.tagName === 'A' && e.target.dataset.page) {
      e.preventDefault();
      loadPage(e.target.dataset.page);
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', e => {
    if (e.state && e.state.page) loadPage(e.state.page);
  });

  // Load initial page (from URL hash or default)
  const initialPage = location.hash.slice(1) || 'Home';
  loadPage(initialPage);
});
