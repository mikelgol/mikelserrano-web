// Web de Mikel Serrano: muro de palabras, deslizador, cuentas, filtros, copiar y vídeo de YouTube. Sin librerías.
(function () {
  // Muro de palabras: cada palabra lleva a su página; al pasar el ratón, debajo sale qué te llevas
  var datos = document.getElementById('palabras');
  if (datos) {
    var ps = JSON.parse(datos.textContent);
    var bs = document.querySelectorAll('.muro-palabras a');
    var tipo = document.getElementById('l-tipo'), frase = document.getElementById('l-frase');
    var precio = document.getElementById('l-precio'), ir = document.getElementById('l-ir');
    var elige = function (i) {
      var d = ps[i];
      bs.forEach(function (b) { b.classList.toggle('activa', b.dataset.i == i); });
      tipo.textContent = d.t; frase.textContent = d.f; precio.textContent = d.c;
      ir.href = d.h; ir.textContent = 'Abrir ' + d.p;
      if (d.x) { ir.target = '_blank'; ir.rel = 'noopener'; } else { ir.removeAttribute('target'); ir.removeAttribute('rel'); }
    };
    bs.forEach(function (b) {
      b.addEventListener('mouseenter', function () { if (matchMedia('(hover:hover)').matches) elige(+b.dataset.i); });
      b.addEventListener('focus', function () { elige(+b.dataset.i); });
    });
  }

  // Deslizador bruto / editado
  document.querySelectorAll('.comparar').forEach(function (c) {
    var r = c.querySelector('input');
    var pon = function () { c.style.setProperty('--x', r.value + '%'); };
    r.addEventListener('input', pon); pon();
    // Los dos vídeos van a la vez: si el de arriba se adelanta o se atrasa, se cuadra con el de abajo
    var ed = c.querySelector('video.editado'), br = c.querySelector('video.bruto');
    if (ed && br) {
      var cuadra = function () { if (Math.abs(br.currentTime - ed.currentTime) > 0.08) br.currentTime = ed.currentTime; };
      ed.addEventListener('timeupdate', cuadra);
      ed.addEventListener('play', function () { br.currentTime = ed.currentTime; var p = br.play(); if (p) p.catch(function () {}); });
      ed.addEventListener('pause', function () { br.pause(); });
    }
  });

  // Cuentas: lo que cuesta un editor al mes
  var calc = document.getElementById('calc-videos');
  if (calc) {
    var out = document.getElementById('calc-out'), ed = document.getElementById('calc-editor');
    var fmt = function (n) { return n.toLocaleString('es-ES', { useGrouping: 'always' }); };
    var pinta = function () { var n = +calc.value; out.textContent = n; ed.textContent = fmt(n * 25) + '-' + fmt(n * 50) + ' €'; };
    calc.addEventListener('input', pinta); pinta();
  }

  // Filtros del catálogo
  var fs = document.querySelectorAll('.filtros button');
  if (fs.length) {
    var filas = document.querySelectorAll('.indice a[data-f]');
    var aplica = function (f) {
      fs.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.f === f ? 'true' : 'false'); });
      filas.forEach(function (a) { a.hidden = !(f === 'todo' || (' ' + a.dataset.f + ' ').indexOf(' ' + f + ' ') >= 0); });
    };
    fs.forEach(function (b) {
      b.addEventListener('click', function () {
        aplica(b.dataset.f);
        history.replaceState(null, '', b.dataset.f === 'todo' ? location.pathname : '#' + b.dataset.f);
      });
    });
    var h = location.hash.replace('#', '');
    if (h && document.querySelector('.filtros button[data-f="' + h + '"]')) aplica(h);
  }

  // Copiar una skill o un prompt
  document.querySelectorAll('[data-copiar]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.dataset.copiar).textContent;
      var st = b.parentNode.querySelector('.estado');
      var ok = function () {
        if (st) st.textContent = 'Copiado. Pégalo en tu Claude Code y envíalo.';
        b.textContent = 'Copiado';
        setTimeout(function () { b.textContent = b.dataset.label; }, 2500);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, function () { copia(t); ok(); });
      else { copia(t); ok(); }
    });
  });
  function copia(t) { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); }

  // YouTube: la portada primero, el reproductor solo al pulsar
  document.querySelectorAll('.yt button').forEach(function (b) {
    b.addEventListener('click', function () {
      var w = b.parentNode, f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + w.dataset.id + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = w.dataset.titulo || 'Vídeo';
      w.innerHTML = ''; w.appendChild(f);
    });
  });
})();

// Testimonios: en el móvil se ven 4 capturas y el resto con un botón, siempre hacia abajo.
(function () {
  var b = document.getElementById('ver-mas'), c = document.getElementById('capturas');
  if (!b || !c) return;
  b.addEventListener('click', function () { c.classList.remove('recogidas'); b.hidden = true; });
})();

// Animados: la vista previa solo se mueve cuando se ve; al tocarla, el vídeo entero con sonido y controles.
(function () {
  var figs = document.querySelectorAll('.animado');
  if (!figs.length) return;
  var mira = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      var v = en.target.querySelector('video');
      if (en.target.classList.contains('suena')) return;
      if (en.isIntersecting) { var p = v.play(); if (p) p.catch(function () {}); } else { v.pause(); }
    });
  }, { threshold: 0.3 }) : null;
  figs.forEach(function (f) {
    if (mira) mira.observe(f);
    var b = f.querySelector('button'), v = f.querySelector('video');
    b.addEventListener('click', function () {
      if (f.classList.contains('suena')) return;
      document.querySelectorAll('.animado.suena video').forEach(function (o) { o.pause(); });
      f.classList.add('suena');
      v.src = b.dataset.video; v.muted = false; v.loop = false; v.controls = true; v.preload = 'auto';
      b.replaceWith(v);
      var p = v.play(); if (p) p.catch(function () {});
    });
  });
})();

