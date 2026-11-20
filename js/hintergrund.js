/* =====================================================================
   Hintergrund auf Touch-Geräten: feste Höhe in Pixeln.
   Am Handy fährt beim Wischen die Adressleiste ein und aus und ändert die Fensterhöhe.
   Ohne diese Regel würde der Hintergrund dabei neu skaliert und gegen den Inhalt springen.
   Die Höhe wird nur beim Laden und beim Drehen des Geräts (Breite ändert sich) neu gesetzt.
   ===================================================================== */
(function () {
  if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) return;
  const root = document.documentElement;
  let breite = window.innerWidth;
  function setzen() {
    const h = Math.max(window.screen.height || 0, window.innerHeight);
    root.style.setProperty('--bgh', h + 'px');
    root.classList.add('bg-fix');
  }
  setzen();
  window.addEventListener('resize', () => {
    if (window.innerWidth !== breite) {
      breite = window.innerWidth;
      setzen();
    }
  });
})();
