/**
 * 导航栏滚动样式切换
 * 页面滚动超过 50px 后，导航栏背景变为不透明白色 + 阴影
 */
(function() {
  'use strict';

  var navbar = document.querySelector('.navbar');
  if (!navbar) return;

  var SCROLL_THRESHOLD = 50;

  function updateNavbar() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  }

  // 节流处理
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function() {
        updateNavbar();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // 初始检查
  updateNavbar();
})();
