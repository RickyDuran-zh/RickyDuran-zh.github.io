(function() {
  'use strict';

  function initSearchCloseFix() {
    var modal = document.getElementById('modalSearch');
    var closeButton = document.getElementById('local-search-close');
    if (!modal || !closeButton) return;

    function forceCleanup() {
      if (!modal.classList.contains('show')) return;
      modal.classList.remove('show');
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('padding-right');
      document.querySelectorAll('.modal-backdrop').forEach(function(backdrop) {
        backdrop.remove();
      });
    }

    function closeSearch(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (window.jQuery && window.jQuery.fn && window.jQuery.fn.modal) {
        window.jQuery(modal).modal('hide');
      }
      window.setTimeout(forceCleanup, 360);
    }

    closeButton.addEventListener('click', closeSearch);
    modal.addEventListener('click', function(event) {
      if (event.target === modal) closeSearch(event);
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal.classList.contains('show')) {
        closeSearch(event);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchCloseFix);
  } else {
    initSearchCloseFix();
  }
})();
