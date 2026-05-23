(function() {
  // 点赞系统 - 基于 jsonblob.com 免费 API，无需任何后端账号
  var LIKES_BLOB_ID = '019e555a-bf3e-7a5f-b021-9e2b56f5a730';
  var LIKES_API = 'https://jsonblob.com/api/jsonBlob/' + LIKES_BLOB_ID;
  var STORAGE_KEY = 'blog_liked_posts';

  // 只在文章页运行
  var isPost = document.querySelector('.post-content, .markdown-body');
  if (!isPost) return;

  // 从 URL 提取文章 slug
  var path = window.location.pathname.replace(/\/+$/, '');
  var slug = path.split('/').filter(Boolean).pop() || path;

  // 获取已点赞列表
  function getLikedPosts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  // 记录点赞
  function markLiked() {
    var liked = getLikedPosts();
    liked.push(slug);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(liked));
    } catch (e) {}
  }

  // 是否已点赞
  function hasLiked() {
    return getLikedPosts().indexOf(slug) !== -1;
  }

  // 创建按钮 UI
  var container = document.createElement('div');
  container.className = 'like-button-wrapper';
  container.style.cssText = 'text-align:center;padding:2rem 0;user-select:none;';

  var btn = document.createElement('button');
  btn.className = 'like-button';
  btn.setAttribute('aria-label', '点赞');
  btn.style.cssText = [
    'display:inline-flex;align-items:center;gap:0.5rem;',
    'padding:0.7rem 1.8rem;font-size:1.05rem;',
    'border:2px solid #e0e0e0;border-radius:50px;',
    'background:transparent;color:#666;cursor:pointer;',
    'transition:all 0.3s ease;outline:none;'
  ].join('');

  var heart = document.createElement('span');
  heart.innerHTML = '&#9825;';
  heart.style.cssText = 'font-size:1.3rem;transition:transform 0.3s ease;';

  var countSpan = document.createElement('span');
  countSpan.className = 'like-count';
  countSpan.textContent = '...';
  countSpan.style.cssText = 'font-weight:600;min-width:1.5rem;';

  btn.appendChild(heart);
  btn.appendChild(countSpan);
  container.appendChild(btn);

  // 深色模式适配
  function updateDarkMode() {
    var isDark = document.documentElement.getAttribute('data-user-color-scheme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) {
      btn.style.borderColor = '#555';
      btn.style.color = '#ccc';
    } else {
      btn.style.borderColor = '#e0e0e0';
      btn.style.color = '#666';
    }
  }
  updateDarkMode();

  // 监听主题切换
  var observer = new MutationObserver(function() {
    updateDarkMode();
    if (btn.classList.contains('liked')) {
      btn.style.borderColor = '#e74c3c';
      btn.style.color = '#e74c3c';
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-user-color-scheme'] });

  // 已点赞状态
  function setLikedState(count) {
    btn.classList.add('liked');
    heart.innerHTML = '&#9829;';
    heart.style.transform = 'scale(1.1)';
    btn.style.borderColor = '#e74c3c';
    btn.style.color = '#e74c3c';
    btn.style.cursor = 'default';
    countSpan.textContent = count;
  }

  // 获取点赞数
  function fetchCount(callback) {
    fetch(LIKES_API, { cache: 'no-cache' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        callback(data[slug] || 0);
      })
      .catch(function() {
        callback(0);
      });
  }

  // 更新点赞数
  function updateCount(newCount, callback) {
    fetch(LIKES_API)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        data[slug] = newCount;
        return fetch(LIKES_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        callback(data[slug]);
      })
      .catch(function() {
        callback(null);
      });
  }

  // 渲染按钮
  fetchCount(function(count) {
    countSpan.textContent = count;

    if (hasLiked()) {
      setLikedState(count);
    }

    btn.addEventListener('click', function() {
      if (hasLiked() || btn.classList.contains('liked')) return;

      // 动画
      btn.style.transform = 'scale(0.95)';
      setTimeout(function() { btn.style.transform = 'scale(1.05)'; }, 100);
      setTimeout(function() { btn.style.transform = 'scale(1)'; }, 250);

      var newCount = count + 1;
      updateCount(newCount, function(updatedCount) {
        if (updatedCount !== null) {
          count = updatedCount;
          markLiked();
          setLikedState(count);
          // 心跳动画
          heart.style.transform = 'scale(1.4)';
          setTimeout(function() { heart.style.transform = 'scale(1.1)'; }, 300);
        } else {
          // 如果 API 失败，仍然允许本地点赞
          count = newCount;
          markLiked();
          setLikedState(count);
        }
      });
    });
  });

  // 插入到文章末尾
  var postEnd = document.querySelector('.post-content') || document.querySelector('.markdown-body');
  if (postEnd) {
    postEnd.appendChild(container);
  }
})();
