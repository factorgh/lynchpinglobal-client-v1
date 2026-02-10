// Script to handle hydration issues caused by browser extensions
(function() {
  // Remove browser extension attributes that cause hydration mismatches
  const attributesToRemove = [
    'cz-shortcut-listen',
    'data-new-gr-c-s-check-loaded',
    'data-gr-ext-installed'
  ];
  
  attributesToRemove.forEach(attr => {
    if (document.body.hasAttribute(attr)) {
      document.body.removeAttribute(attr);
    }
  });
})();
