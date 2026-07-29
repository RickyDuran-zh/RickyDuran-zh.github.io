(function() {
  'use strict';

  var modal = document.getElementById('post-share-modal');
  var qrContainer = document.getElementById('post-share-qr');
  var title = document.getElementById('post-share-title');
  var brand = document.getElementById('post-share-brand');
  var buttons = document.querySelectorAll('[data-share-channel]');
  if (!modal || !qrContainer || !title || !brand || !buttons.length) return;
  document.body.appendChild(modal);

  var qrScriptPromise;

  function loadQrLibrary() {
    if (window.QRCode) return Promise.resolve();
    if (qrScriptPromise) return qrScriptPromise;

    qrScriptPromise = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return qrScriptPromise;
  }

  function renderQr() {
    qrContainer.innerHTML = '';
    new window.QRCode(qrContainer, {
      text: window.location.href.split('#')[0],
      width: 220,
      height: 220,
      colorDark: '#172033',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.H
    });
  }

  function openModal(channel) {
    var isWechat = channel === 'wechat';
    modal.classList.toggle('is-qq', !isWechat);
    title.textContent = isWechat ? '微信扫码分享' : 'QQ 扫码分享';
    brand.innerHTML = isWechat
      ? '<i class="fa-brands fa-weixin" aria-hidden="true"></i>'
      : '<i class="fa-brands fa-qq" aria-hidden="true"></i>';
    qrContainer.innerHTML = '<span class="post-share-loading">二维码生成中…</span>';
    modal.hidden = false;
    document.body.classList.add('post-share-open');

    loadQrLibrary().then(renderQr).catch(function() {
      qrContainer.innerHTML = '<span class="post-share-error">二维码加载失败，请稍后重试</span>';
    });
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('post-share-open');
  }

  buttons.forEach(function(button) {
    button.addEventListener('click', function() {
      openModal(button.getAttribute('data-share-channel'));
    });
  });

  modal.querySelectorAll('[data-share-close]').forEach(function(button) {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });
})();
