// El muñeco de Claude en 3D, hecho con CSS (sin librerías, unos pocos KB).
// Al cargar está a la derecha de la portada; al bajar, se va a la parte de abajo de la pantalla
// y camina de lado a lado según lo que bajas o subes. Parpadea, respira y salta si lo tocas.
// Con ratón, se gira hacia él y mueve los ojos para mirarlo (Mikel, 21/11/2026).
(function () {
  if (!document.body || document.querySelector('.mascota')) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var U = 10; // px por unidad; el tamaño final se da con la escala

  var COL = { cara: '#D97757', lado: '#B85E41', alto: '#EC9A7E', bajo: '#8F4530', ojo: '#1B1B1F', ojoLado: '#000' };

  // Un cubo con sus seis caras; w, h y d en unidades
  function cubo(w, h, d, c) {
    var el = document.createElement('div');
    el.className = 'mc-cubo';
    var W = w * U, H = h * U, D = d * U;
    var caras = [
      [W, H, 'translateZ(' + D / 2 + 'px)', c.cara],
      [W, H, 'rotateY(180deg) translateZ(' + D / 2 + 'px)', c.lado],
      [D, H, 'rotateY(90deg) translateZ(' + W / 2 + 'px)', c.lado],
      [D, H, 'rotateY(-90deg) translateZ(' + W / 2 + 'px)', c.lado],
      [W, D, 'rotateX(90deg) translateZ(' + H / 2 + 'px)', c.alto],
      [W, D, 'rotateX(-90deg) translateZ(' + H / 2 + 'px)', c.bajo]
    ];
    caras.forEach(function (f) {
      var s = document.createElement('i');
      s.style.cssText = 'width:' + f[0] + 'px;height:' + f[1] + 'px;margin:' + (-f[1] / 2) + 'px 0 0 ' + (-f[0] / 2) + 'px;transform:' + f[2] + ';background:' + f[3];
      el.appendChild(s);
    });
    return el;
  }

  // Una pieza colocada en (x, y, z) unidades respecto al centro del cuerpo
  function pieza(x, y, z, hijo, origenArriba) {
    var p = document.createElement('div');
    p.className = 'mc-pieza';
    p.style.transform = 'translate3d(' + x * U + 'px,' + y * U + 'px,' + z * U + 'px)';
    if (origenArriba) {
      // la pierna gira desde arriba: el cubo baja media altura dentro de un pivote
      var piv = document.createElement('div');
      piv.className = 'mc-pieza';
      hijo.style.transform = 'translateY(' + origenArriba * U + 'px)';
      piv.appendChild(hijo);
      p.appendChild(piv);
      p.piv = piv;
    } else {
      p.appendChild(hijo);
    }
    return p;
  }

  var raiz = document.createElement('div');
  raiz.className = 'mascota';
  raiz.setAttribute('aria-hidden', 'true');
  raiz.title = 'Hola';
  var escena = document.createElement('div'); escena.className = 'mc-escena';
  var mundo = document.createElement('div'); mundo.className = 'mc-mundo';
  var salto = document.createElement('div'); salto.className = 'mc-salto';
  var cuerpoW = document.createElement('div'); cuerpoW.className = 'mc-cuerpo';

  // Cuerpo, ojos y brazos
  cuerpoW.appendChild(pieza(0, 0, 0, cubo(16, 10, 8, COL)));
  var ojos = [];
  [-4, 4].forEach(function (x) {
    var o = pieza(x, -1.2, 4.1, cubo(1.8, 3, 0.4, { cara: COL.ojo, lado: COL.ojoLado, alto: COL.ojoLado, bajo: COL.ojoLado }));
    o.classList.add('mc-ojo'); o.baseX = x; ojos.push(o); cuerpoW.appendChild(o);
  });
  [-9.5, 9.5].forEach(function (x) { cuerpoW.appendChild(pieza(x, 0.5, 0, cubo(3, 2.6, 3.4, COL))); });
  salto.appendChild(cuerpoW);

  // Cuatro patas en fila, como el de Claude Code
  var patas = [-6, -2, 2, 6].map(function (x) {
    var p = pieza(x, 5, 0, cubo(2, 4, 2.4, COL), 2);
    salto.appendChild(p);
    return p;
  });

  mundo.appendChild(salto); escena.appendChild(mundo); raiz.appendChild(escena);
  document.body.appendChild(raiz);

  // Estado
  var x = null, y = null, esc = null, giro = 20, cabeceo = -18, paso = 0, dir = 1;
  var parpadeo = performance.now() + 2500;

  // Mira al ratón: el cuerpo se gira hacia él (también andando) y los ojos se mueven dentro de la cara
  var raton = null, mirX = 0, mirY = 0;
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    addEventListener('mousemove', function (ev) { raton = [ev.clientX, ev.clientY]; }, { passive: true });
    document.addEventListener('mouseleave', function () { raton = null; });
  }

  function medidas() {
    var vw = innerWidth, vh = innerHeight, grande = vw >= 1100;
    var escAbajo = vw < 700 ? 0.42 : 0.62;
    var escArriba = grande ? 1.25 : escAbajo;
    return { vw: vw, vh: vh, grande: grande, escAbajo: escAbajo, escArriba: escArriba };
  }

  function objetivo() {
    var m = medidas(), s = scrollY;
    var k = m.grande ? Math.min(1, s / 520) : 1;              // 0 en la portada, 1 ya abajo
    var e = m.escArriba + (m.escAbajo - m.escArriba) * k;
    var ancho = 22 * U * e, alto = 18 * U * e;
    var margen = Math.max(16, m.vw * 0.04);
    // Camina de lado a lado: una ida cada 1.300 px de scroll, empezando a la derecha
    var P = 1300, f = (s / P) % 2, t = f < 1 ? f : 2 - f;
    var xMin = margen + ancho / 2, xMax = m.vw - margen - ancho / 2;
    var xAbajo = xMax - t * (xMax - xMin);
    var xArriba = m.grande ? Math.min(m.vw - margen - ancho / 2, m.vw * 0.5 + 560) : xAbajo;
    var yArriba = m.vh * 0.5, yAbajo = m.vh - alto / 2 - 14;
    return {
      x: xArriba + (xAbajo - xArriba) * k,
      y: yArriba + (yAbajo - yArriba) * k,
      e: e
    };
  }

  function pinta(now) {
    var o = objetivo();
    if (x === null) { x = o.x; y = o.y; esc = o.e; }
    var dx = o.x - x;
    x += dx * 0.12; y += (o.y - y) * 0.12; esc += (o.e - esc) * 0.12;
    var vel = Math.abs(dx);
    if (vel > 0.4) dir = dx > 0 ? 1 : -1;
    var anda = Math.min(1, vel / 6);
    paso += vel * 0.06 + (anda > 0.05 ? 0.12 : 0);
    var giroObj = anda > 0.08 ? dir * 55 : 20, cabObj = -18, ojoX = 0, ojoY = 0;
    if (raton) {
      var rx = raton[0] - x, ry = raton[1] - y;
      // hacia el ratón; andando, un poco ladeado hacia donde va para que se note que camina
      var haciaRaton = Math.max(-60, Math.min(60, Math.atan2(rx, 420) * 180 / Math.PI));
      giroObj = haciaRaton + (anda > 0.08 ? dir * 15 * anda : 0);
      cabObj = -18 - Math.max(-11, Math.min(22, Math.atan2(ry, 520) * 180 / Math.PI)); // hacia arriba poco, para que no se vea plano
      ojoX = Math.max(-1, Math.min(1, rx / 500)); ojoY = Math.max(-1, Math.min(1, ry / 400));
    }
    giro += (giroObj - giro) * 0.1; cabeceo += (cabObj - cabeceo) * 0.1;
    mirX += (ojoX - mirX) * 0.2; mirY += (ojoY - mirY) * 0.2;
    ojos.forEach(function (o) {
      o.style.transform = 'translate3d(' + (o.baseX + mirX * 1.3) * U + 'px,' + (-1.2 + mirY * 1.1) * U + 'px,' + 4.1 * U + 'px)';
    });

    var piernas = Math.sin(paso) * 32 * anda;
    patas.forEach(function (p, i) { p.piv.style.transform = 'rotateX(' + ((i % 2 ? 1 : -1) * piernas) + 'deg)'; });
    var bote = -Math.abs(Math.sin(paso)) * 1.1 * U * anda;
    var respira = 1 + Math.sin(now / 650) * 0.018 * (1 - anda);
    cuerpoW.style.transform = 'translateY(' + bote + 'px) scaleY(' + respira + ')';

    if (now > parpadeo) {
      ojos.forEach(function (o) { o.classList.add('cierra'); });
      setTimeout(function () { ojos.forEach(function (o) { o.classList.remove('cierra'); }); }, 140);
      parpadeo = now + 2200 + Math.random() * 3200;
    }

    raiz.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + esc + ')';
    mundo.style.transform = 'rotateX(' + cabeceo + 'deg) rotateY(' + giro + 'deg)';
    if (!document.hidden) requestAnimationFrame(pinta);
  }

  raiz.addEventListener('click', function () {
    salto.classList.remove('salta'); void salto.offsetWidth; salto.classList.add('salta');
  });

  if (quieto) {
    var o = objetivo();
    raiz.style.transform = 'translate3d(' + o.x + 'px,' + o.y + 'px,0) scale(' + o.e + ')';
    mundo.style.transform = 'rotateX(-18deg) rotateY(20deg)';
    addEventListener('scroll', function () { var q = objetivo(); raiz.style.transform = 'translate3d(' + q.x + 'px,' + q.y + 'px,0) scale(' + q.e + ')'; }, { passive: true });
    return;
  }
  requestAnimationFrame(pinta);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) requestAnimationFrame(pinta); });
})();
