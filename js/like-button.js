(function() {
  var postBody = document.querySelector('.post-content') || document.querySelector('.markdown-body');
  if (!postBody) return;

  var path = window.location.pathname.replace(/\/+$/, '') || '/';
  var parts = path.split('/').filter(Boolean);
  var legacySlug = parts[parts.length - 1] || path;
  var storageId = path.toLowerCase();
  var likedKey = 'blog_like_' + storageId;
  var countKey = 'blog_like_count_' + storageId;
  var legacyLikedKey = 'blog_like_' + legacySlug;
  var likeTarget = 'like:' + path.toLowerCase().replace(/\/+$/, '') + '/';

  var liked = localStorage.getItem(likedKey) === '1' || localStorage.getItem(legacyLikedKey) === '1';

  // --- Supabase helpers ---
  function getSupabaseConfig() {
    try {
      var analytics = (typeof CONFIG !== 'undefined' && CONFIG.web_analytics) || {};
      var sb = analytics.supabase || {};
      if (sb.url && sb.anon_key) return sb;
    } catch (e) {}
    return null;
  }

  var sbCfg = getSupabaseConfig();

  function sbFetch(method, path, data) {
    var headers = {
      'apikey': sbCfg.anon_key,
      'Authorization': 'Bearer ' + sbCfg.anon_key,
      'Content-Type': 'application/json'
    };
    return fetch(sbCfg.url + path, {
      method: method,
      headers: headers,
      body: data ? JSON.stringify(data) : undefined
    }).then(function(resp) {
      if (!resp.ok) throw new Error('Supabase error: ' + resp.status);
      return resp.json();
    });
  }

  function fetchLikeCount() {
    if (!sbCfg) return Promise.resolve(null);
    return sbFetch('GET', '/rest/v1/likes?select=count&target=eq.' + encodeURIComponent(likeTarget))
      .then(function(data) {
        if (data && data.length > 0) return data[0].count || 0;
        return 0;
      })
      .catch(function() {
        return null; // fallback to localStorage
      });
  }

  function incrementLike() {
    if (!sbCfg) return Promise.resolve();
    return sbFetch('POST', '/rest/v1/rpc/increment_like', { target_text: likeTarget })
      .then(function(data) {
        return data;
      })
      .catch(function() {
        return null;
      });
  }
  // --- End Supabase helpers ---

  function readLocalCount() {
    var value = parseInt(localStorage.getItem(countKey), 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  var count = 0;

  // --- Build DOM ---
  var wrap = document.createElement('div');
  wrap.className = 'blog-like-wrap';
  wrap.style.cssText = 'text-align:center;padding:2.5rem 0 1.5rem;';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = liked ? 'blog-like-btn liked' : 'blog-like-btn';
  btn.setAttribute('aria-label', '加载中...');
  btn.style.cssText = [
    'display:inline-flex;align-items:center;gap:0.55rem;',
    'min-width:8.5rem;justify-content:center;',
    'padding:0.72rem 1.65rem;font-size:1.05rem;line-height:1;',
    'border:2px solid transparent;border-radius:999px;',
    'cursor:pointer;transition:transform 0.22s ease,background 0.22s ease,border-color 0.22s ease,color 0.22s ease,box-shadow 0.22s ease;',
    'outline:none;font-family:inherit;'
  ].join('');

  var heart = document.createElement('span');
  heart.className = 'blog-like-heart';
  heart.innerHTML = liked ? '&#9829;' : '&#9825;';
  heart.style.cssText = 'font-size:1.38rem;line-height:1;transition:transform 0.3s ease;';

  var text = document.createElement('span');
  text.className = 'blog-like-text';
  text.style.cssText = 'font-weight:600;white-space:nowrap;';
  text.textContent = '加载中...';

  var burst = document.createElement('span');
  burst.setAttribute('aria-hidden', 'true');
  burst.style.cssText = [
    'position:absolute;left:50%;top:50%;width:0;height:0;',
    'pointer-events:none;transform:translate(-50%,-50%);'
  ].join('');

  btn.style.position = 'relative';
  btn.appendChild(heart);
  btn.appendChild(text);
  btn.appendChild(burst);
  wrap.appendChild(btn);

  function isDarkMode() {
    return document.documentElement.getAttribute('data-user-color-scheme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function render() {
    var dark = isDarkMode();
    text.textContent = (liked ? '已赞' : '点赞') + ' · ' + count;
    heart.innerHTML = liked ? '&#9829;' : '&#9825;';
    btn.setAttribute('aria-label', (liked ? '已点赞，共 ' : '点赞，当前 ') + count + ' 个赞');

    if (liked) {
      btn.style.borderColor = '#e74c3c';
      btn.style.color = '#e74c3c';
      btn.style.background = dark ? 'rgba(231,76,60,0.14)' : '#fff5f5';
      btn.style.boxShadow = dark ? '0 0 0 4px rgba(231,76,60,0.08)' : '0 8px 22px rgba(231,76,60,0.12)';
      btn.style.cursor = 'default';
    } else {
      btn.style.borderColor = dark ? '#555' : '#d0d0d0';
      btn.style.color = dark ? '#bbb' : '#777';
      btn.style.background = dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.6)';
      btn.style.boxShadow = 'none';
      btn.style.cursor = 'pointer';
    }
  }

  function pulse() {
    btn.style.transform = 'scale(0.94)';
    window.setTimeout(function() { btn.style.transform = 'scale(1.06)'; }, 90);
    window.setTimeout(function() { btn.style.transform = 'scale(1)'; }, 230);

    heart.style.transform = 'scale(1.35)';
    window.setTimeout(function() { heart.style.transform = 'scale(1)'; }, 300);
  }

  function showBurst() {
    var particleCount = 8;
    burst.innerHTML = '';

    for (var i = 0; i < particleCount; i += 1) {
      var particle = document.createElement('i');
      var angle = (360 / particleCount) * i;
      particle.textContent = '♥';
      particle.style.cssText = [
        'position:absolute;left:0;top:0;font-style:normal;font-size:0.72rem;',
        'color:#e74c3c;opacity:0;transform:translate(-50%,-50%) scale(0.4);',
        'transition:transform 0.55s ease,opacity 0.55s ease;'
      ].join('');
      burst.appendChild(particle);

      window.setTimeout(function(el, deg) {
        var distance = 30 + Math.round(Math.random() * 10);
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%,-50%) rotate(' + deg + 'deg) translateY(-' + distance + 'px) scale(1)';
      }, 10, particle, angle);

      window.setTimeout(function(el) {
        el.style.opacity = '0';
      }, 360, particle);
    }

    window.setTimeout(function() {
      burst.innerHTML = '';
    }, 700);
  }

  btn.addEventListener('mouseenter', function() {
    if (!liked) btn.style.transform = 'translateY(-1px)';
  });

  btn.addEventListener('mouseleave', function() {
    if (!liked) btn.style.transform = 'translateY(0)';
  });

  btn.addEventListener('click', function() {
    if (liked) return;

    liked = true;
    count += 1;

    // Persist liked state locally
    localStorage.setItem(likedKey, '1');
    localStorage.setItem(countKey, String(count));

    // Push to Supabase asynchronously
    incrementLike().catch(function() {
      // Silently fail – count cached in localStorage
    });

    btn.classList.add('liked');
    pulse();
    showBurst();
    render();
  });

  // --- Init: fetch count from Supabase, fall back to localStorage ---
  fetchLikeCount().then(function(remoteCount) {
    if (remoteCount !== null && remoteCount > 0) {
      count = remoteCount;
    } else {
      count = readLocalCount();
    }

    // If user already liked but count is 0, bootstrap with 1
    if (liked && count === 0) {
      count = 1;
      localStorage.setItem(countKey, String(count));
    }

    // Sync localStorage cache with remote
    if (count > 0 && readLocalCount() < count) {
      localStorage.setItem(countKey, String(count));
    }

    render();
  });

  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-user-color-scheme']
  });

  postBody.appendChild(wrap);
})();
