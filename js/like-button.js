(function() {
  'use strict';

  var postBody = document.querySelector('.post-content .markdown-body');
  var config = document.getElementById('blog-like-config');
  if (!postBody || !config) return;

  var postId = config.getAttribute('data-post-id') || '';
  var apiBase = (config.getAttribute('data-api-base') || '').replace(/\/+$/, '');
  var timeout = Number(config.getAttribute('data-timeout')) || 8000;
  var visitorStorageKey = 'blog_like_visitor_v1';
  var state = {
    count: 0,
    liked: false,
    status: 'loading'
  };

  function createVisitorId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    var bytes = new Uint8Array(24);
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.prototype.map.call(bytes, function(byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');
  }

  function getVisitorId() {
    try {
      var stored = localStorage.getItem(visitorStorageKey);
      if (stored) return stored;
      var created = createVisitorId();
      localStorage.setItem(visitorStorageKey, created);
      return created;
    } catch (_error) {
      return createVisitorId();
    }
  }

  var visitorId = getVisitorId();
  var wrap = document.createElement('div');
  wrap.className = 'blog-like-wrap';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'blog-like-btn';

  var heart = document.createElement('span');
  heart.className = 'blog-like-heart';
  heart.setAttribute('aria-hidden', 'true');
  heart.innerHTML = '&#9825;';

  var text = document.createElement('span');
  text.className = 'blog-like-text';
  text.textContent = '正在读取点赞';

  var burst = document.createElement('span');
  burst.className = 'blog-like-burst';
  burst.setAttribute('aria-hidden', 'true');

  btn.appendChild(heart);
  btn.appendChild(text);
  btn.appendChild(burst);
  wrap.appendChild(btn);
  postBody.appendChild(wrap);

  function render() {
    btn.classList.toggle('liked', state.liked);
    btn.classList.toggle('is-loading', state.status === 'loading' || state.status === 'submitting');
    btn.classList.toggle('is-error', state.status === 'error');
    heart.innerHTML = state.liked ? '&#9829;' : '&#9825;';

    if (state.status === 'loading') {
      text.textContent = '正在读取点赞';
      btn.disabled = true;
      btn.setAttribute('aria-label', '正在读取点赞数');
      return;
    }
    if (state.status === 'submitting') {
      text.textContent = '正在提交';
      btn.disabled = true;
      btn.setAttribute('aria-label', '正在提交点赞');
      return;
    }
    if (state.status === 'error') {
      text.textContent = '点赞暂不可用 · 重试';
      btn.disabled = false;
      btn.setAttribute('aria-label', '点赞服务暂不可用，点击重试');
      return;
    }

    text.textContent = (state.liked ? '已赞' : '点赞') + ' · ' + state.count;
    btn.disabled = state.liked;
    btn.setAttribute('aria-label', state.liked
      ? '已点赞，共 ' + state.count + ' 个赞'
      : '点赞，当前 ' + state.count + ' 个赞');
  }

  function apiRequest(method) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = window.setTimeout(function() {
      if (controller) controller.abort();
    }, timeout);

    return fetch(apiBase + '/v1/likes/' + encodeURIComponent(postId), {
      method: method,
      headers: {
        'Accept': 'application/json',
        'X-Like-Visitor': visitorId
      },
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    }).then(function(response) {
      return response.json().catch(function() { return {}; }).then(function(data) {
        if (!response.ok) {
          var error = new Error(data.error || 'like_api_error');
          error.status = response.status;
          throw error;
        }
        return data;
      });
    }).finally(function() {
      window.clearTimeout(timer);
    });
  }

  function applyServerState(data) {
    if (!data || !Number.isFinite(Number(data.count))) throw new Error('invalid_like_response');
    state.count = Math.max(0, Number(data.count));
    state.liked = Boolean(data.liked);
    state.status = 'ready';
    render();
  }

  function loadLikeState() {
    if (!apiBase || !postId) {
      state.status = 'error';
      render();
      return Promise.resolve();
    }

    state.status = 'loading';
    render();
    return apiRequest('GET').then(applyServerState).catch(function() {
      state.status = 'error';
      render();
    });
  }

  function showBurst() {
    burst.innerHTML = '';
    for (var i = 0; i < 8; i += 1) {
      var particle = document.createElement('i');
      particle.textContent = '♥';
      particle.style.setProperty('--like-angle', (i * 45) + 'deg');
      burst.appendChild(particle);
    }
    btn.classList.remove('just-liked');
    void btn.offsetWidth;
    btn.classList.add('just-liked');
    window.setTimeout(function() {
      btn.classList.remove('just-liked');
      burst.innerHTML = '';
    }, 700);
  }

  btn.addEventListener('click', function() {
    if (state.status === 'error') {
      loadLikeState();
      return;
    }
    if (state.status !== 'ready' || state.liked) return;

    state.status = 'submitting';
    render();
    apiRequest('POST').then(function(data) {
      applyServerState(data);
      showBurst();
    }).catch(function() {
      state.status = 'error';
      render();
    });
  });

  render();
  loadLikeState();
})();
