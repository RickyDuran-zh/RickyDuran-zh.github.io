(function() {
  // 点赞按钮 - 纯前端实现，无需任何后端
  var postBody = document.querySelector('.post-content') || document.querySelector('.markdown-body');
  if (!postBody) return;

  // 从 URL 提取文章标识
  var path = window.location.pathname.replace(/\/+$/, '');
  var parts = path.split('/').filter(Boolean);
  var slug = parts.pop() || path;
  var storageKey = 'blog_like_' + slug;

  var liked = localStorage.getItem(storageKey) === '1';

  // 创建按钮
  var wrap = document.createElement('div');
  wrap.style.cssText = 'text-align:center;padding:2.5rem 0 1.5rem;';

  var btn = document.createElement('button');
  btn.setAttribute('aria-label', liked ? '已点赞' : '点赞');
  btn.style.cssText = [
    'display:inline-flex;align-items:center;gap:0.5rem;',
    'padding:0.7rem 2rem;font-size:1.05rem;line-height:1;',
    'border:2px solid ', liked ? '#e74c3c' : '#d0d0d0', ';',
    'border-radius:50px;background:', liked ? '#fff5f5' : 'transparent', ';',
    'color:', liked ? '#e74c3c' : '#999', ';',
    'cursor:pointer;transition:all 0.25s ease;outline:none;',
    'font-family:inherit;'
  ].join('');

  var heart = document.createElement('span');
  heart.innerHTML = liked ? '&#9829;' : '&#9825;';
  heart.style.cssText = 'font-size:1.4rem;transition:transform 0.3s ease;';

  var text = document.createElement('span');
  text.textContent = liked ? '已赞' : '点赞';
  text.style.fontWeight = '600';

  btn.appendChild(heart);
  btn.appendChild(text);
  wrap.appendChild(btn);

  // 深色模式
  function applyDark() {
    var dark = document.documentElement.getAttribute('data-user-color-scheme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (btn.classList.contains('liked')) {
      btn.style.borderColor = '#e74c3c';
      btn.style.color = '#e74c3c';
      btn.style.background = dark ? 'rgba(231,76,60,0.12)' : '#fff5f5';
    } else {
      btn.style.borderColor = dark ? '#555' : '#d0d0d0';
      btn.style.color = dark ? '#bbb' : '#999';
      btn.style.background = 'transparent';
    }
  }
  applyDark();
  new MutationObserver(applyDark).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-user-color-scheme']
  });

  // 点击事件
  btn.addEventListener('click', function() {
    if (btn.classList.contains('liked')) return;

    // 标记已赞
    liked = true;
    localStorage.setItem(storageKey, '1');
    btn.classList.add('liked');

    // 脉冲动画
    btn.style.transform = 'scale(0.92)';
    setTimeout(function() { btn.style.transform = 'scale(1.06)'; }, 100);
    setTimeout(function() { btn.style.transform = 'scale(1)'; }, 250);

    // 心形填充 + 弹跳
    heart.innerHTML = '&#9829;';
    heart.style.transform = 'scale(1.35)';
    setTimeout(function() { heart.style.transform = 'scale(1)'; }, 300);

    // 更新样式
    text.textContent = '已赞';
    btn.style.borderColor = '#e74c3c';
    btn.style.color = '#e74c3c';
    applyDark();
    btn.style.cursor = 'default';
  });

  // 插入到页脚前
  postBody.appendChild(wrap);
})();
