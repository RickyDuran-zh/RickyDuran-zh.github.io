/**
 * 阅读进度条
 * 页面顶部细线进度条，随滚动更新
 * 仅文章页有效（检测 .post-content 或 .markdown-body 存在）
 */
(function () {
  'use strict';

  function initReadingProgress() {
    // 仅在文章页启用
    const article = document.querySelector('.markdown-body');
    if (!article) return;

    // 创建进度条元素
    const bar = document.createElement('div');
    bar.id = 'reading-progress-bar';
    bar.setAttribute('aria-hidden', 'true');
    document.body.prepend(bar);

    function updateProgress() {
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // 可滚动总距离 = 文章高度 - 视口高度
      const scrollable = articleHeight - windowHeight;
      if (scrollable <= 0) {
        bar.style.width = '0%';
        return;
      }

      // 当前已滚动的距离（从文章顶部开始算）
      const scrolled = scrollTop - articleTop;
      let progress = (scrolled / scrollable) * 100;

      // 限制在 0-100 之间
      progress = Math.max(0, Math.min(100, progress));

      bar.style.width = progress + '%';
    }

    // 使用 requestAnimationFrame 节流
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // 初始更新
    updateProgress();

    // 窗口大小改变时重新计算
    window.addEventListener('resize', function () {
      updateProgress();
    }, { passive: true });
  }

  // DOM 就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReadingProgress);
  } else {
    initReadingProgress();
  }
})();
