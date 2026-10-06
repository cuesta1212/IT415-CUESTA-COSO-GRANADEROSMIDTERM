const paths = {
  All: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  Drinks: '<path d="M5 8h12v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM17 9h2a3 3 0 0 1 0 6h-2M8 2v3m4-3v3"/>',
  Food: '<path d="M3 11c0-5 18-5 18 0zM3 15h18M4 19h16M7 7l1-1m4 0h1m3 1h1"/>',
  Snacks: '<path d="M20 10a5 5 0 0 1-6-6 9 9 0 1 0 6 6Z"/><path d="M8 9h.01M7 15h.01M12 17h.01M12 11h.01"/>',
  table: '<path d="M3 9h18v4H3zM5 13v8m14-8v8M7 3v6m10-6v6"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  Cash: '<rect x="2" y="5" width="20" height="14" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M5 12h1m12 0h1"/>',
  'QR Payment': '<path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h3v3h3v3h-6zM21 12h-3M12 3v3m0 6v3"/>',
  'Credit/Debit Card': '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 9h20M6 15h4"/>',
};
export function iconMarkup(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.All}</svg>`;
}
