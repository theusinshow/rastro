(function () {
  const C = {
    visited: '#445d24', wanted: '#7d4a06', unvisited: '#635a4e',
    hollow: '#f4efe6', bone: '#211d18', accent: '#c8821a', stripe: '#f4efe6'
  };

  function waitForL() {
    return new Promise(res => {
      if (window.L) return res(window.L);
      const t = setInterval(() => { if (window.L) { clearInterval(t); res(window.L); } }, 40);
    });
  }

  function pinHtml(p, selected) {
    const col = p.status === 'visited' ? C.visited : p.status === 'wanted' ? C.wanted : C.unvisited;
    const fill = p.status === 'unvisited' ? C.hollow : col;
    const ring = p.fav
      ? `<circle cx="14" cy="14" r="12.5" fill="none" stroke="${col}" stroke-width="1.25" opacity=".6"/>`
      : '';
    const dot = p.photo
      ? `<circle cx="14" cy="14" r="2.1" fill="${p.status === 'unvisited' ? col : C.stripe}"/>`
      : '';
    const sel = selected
      ? `<circle cx="14" cy="14" r="13.2" fill="none" stroke="${C.bone}" stroke-width="1.5"/>`
      : '';
    return `<div class="rp ${selected ? 'is-sel' : ''}" data-id="${p.id}">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        ${ring}${sel}
        <circle cx="14" cy="14" r="7.5" fill="${fill}" stroke="${col}" stroke-width="2"/>
        ${dot}
      </svg></div>`;
  }

  class RastroMapClaro extends HTMLElement {
    constructor() { super(); this._data = null; }

    set data(v) {
      this._data = typeof v === 'string' ? JSON.parse(v) : v;
      if (this._map) this._sync();
    }
    get data() { return this._data; }

    static get observedAttributes() { return ['data']; }
    attributeChangedCallback(n, o, v) { if (n === 'data' && v) this.data = v; }

    async connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      this.style.cssText = 'position:absolute;inset:0;display:block;background:#efe9de';
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute;inset:0';
      this.appendChild(host);

      const L = await waitForL();
      const d = this._data || {};
      this._map = L.map(host, {
        zoomControl: false, attributionControl: true,
        center: d.center || [-27.9, -49.3], zoom: d.zoom || 8, preferCanvas: true
      });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18, className: 'rastro-tiles'
      }).addTo(this._map);

      this._map.on('move zoom', () => this._emitCam());
      this._layer = L.layerGroup().addTo(this._map);
      this._routeLayer = L.layerGroup().addTo(this._map);
      this._sync();
      this._emitCam();
      setTimeout(() => this._map.invalidateSize(), 60);
    }

    _emitCam() {
      const c = this._map.getCenter();
      document.dispatchEvent(new CustomEvent('rastro:camera', {
        detail: { lat: c.lat, lng: c.lng, zoom: this._map.getZoom() }
      }));
    }

    _sync() {
      const L = window.L, d = this._data || {};
      this._layer.clearLayers();
      this._routeLayer.clearLayers();

      (d.pins || []).forEach(p => {
        const selected = d.selected === p.id;
        const m = L.marker([p.lat, p.lng], {
          icon: L.divIcon({ html: pinHtml(p, selected), className: 'rastro-pin', iconSize: [28, 28], iconAnchor: [14, 14] }),
          keyboard: true, title: p.name, riseOnHover: true
        });
        m.on('click', () => document.dispatchEvent(new CustomEvent('rastro:select', { detail: p.id })));
        m.addTo(this._layer);
      });

      if (d.route && d.route.length > 1) {
        L.polyline(d.route, { color: C.accent, weight: 7, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(this._routeLayer);
        L.polyline(d.route, { color: C.stripe, weight: 2, opacity: 1, dashArray: '9 11', lineCap: 'butt' }).addTo(this._routeLayer);
      }

      if (d.focus && this._map) {
        const key = JSON.stringify(d.focus);
        if (key !== this._lastFocus) {
          this._lastFocus = key;
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const opts = { duration: reduce ? 0 : 1.1, padding: d.focus.padding || [40, 40] };
          if (d.focus.bounds) this._map.flyToBounds(d.focus.bounds, opts);
          else this._map.flyTo([d.focus.lat, d.focus.lng], d.focus.zoom || 11, opts);
        }
      }
      setTimeout(() => this._map && this._map.invalidateSize(), 40);
    }
  }

  if (!customElements.get('rastro-map-claro')) customElements.define('rastro-map-claro', RastroMapClaro);
})();
