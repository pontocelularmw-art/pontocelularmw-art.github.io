
// ---------------------------------------------------------
// Cloudflare Pages — limpeza de Service Worker/cache legado
// ---------------------------------------------------------
// O site não depende de Service Worker para funcionar.
// Esta limpeza evita que deployments antigos continuem
// entregando HTML, CSS, JS ou caminhos de imagens desatualizados.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      }
    } catch (error) {
      console.warn("Não foi possível limpar o cache legado do site.", error);
    }
  });
}

"use strict";

// =========================================================
// PONTO CELULAR — SCRIPT PRINCIPAL
// Código comum + recursos específicos detectados pelo DOM.
// =========================================================

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------
// Ano automático
// ---------------------------------------------------------
document.querySelectorAll("#ano").forEach(el => {
  el.textContent = new Date().getFullYear();
});

// ---------------------------------------------------------
// Menu mobile
// ---------------------------------------------------------
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav--open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("nav--open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ---------------------------------------------------------
// Entrada e saída entre páginas internas
// ---------------------------------------------------------
if (!prefersReducedMotion) {
  document.body.classList.add("page-enter");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.remove("page-enter");
  }));
}

document.querySelectorAll("a[href]").forEach(link => {
  link.addEventListener("click", event => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || prefersReducedMotion) return;
    event.preventDefault();
    document.body.classList.add("page-leaving");
    window.setTimeout(() => { window.location.href = url.href; }, 220);
  });
});
window.addEventListener("pageshow", () => document.body.classList.remove("page-leaving"));

// ---------------------------------------------------------
// Reveal ao rolar — leve e reutilizável
// ---------------------------------------------------------
const revealSelectors = [
  ".section__title", ".eyebrow", ".product-card", ".store", ".hours",
  ".footer__inner", ".about-copy", ".about-stats article",
  ".smartphone-section-heading", ".smartphone-brand-card", ".smartphone-profile-card",
  ".smartphone-benefits", ".smartphone-cta", ".services-heading",
  ".service-category-card", ".services-disclaimer", ".accessory-brands-strip__heading",
  ".accessory-brand", ".accessory-stock-heading", ".accessory-sidebar",
  ".accessory-stock-content", ".accessory-stock-disclaimer", ".accessory-contact"
];
const revealElements = [...new Set(revealSelectors.flatMap(sel => [...document.querySelectorAll(sel)]))];
if (prefersReducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach(el => el.classList.add("reveal", "reveal--visible"));
} else {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal--visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
  revealElements.forEach((el, index) => {
    el.classList.add("reveal");
    if (index % 3 === 1) el.classList.add("reveal-delay-1");
    if (index % 3 === 2) el.classList.add("reveal-delay-2");
    observer.observe(el);
  });
}

// =========================================================
// HERO — CARROSSEL DE DESTAQUES COM WEB ANIMATIONS API
// Sem troca de z-index no meio da trajetória.
// =========================================================
const heroOffers = [...document.querySelectorAll(".hero-offer")];
const heroDots = document.getElementById("heroOfferDots");
const heroArea = document.querySelector(".phone-card__screen");
let heroIndex = 0;
let heroTimer = null;
let heroAnimating = false;

function heroNextIndex(i) { return (i + 1) % heroOffers.length; }
function heroBackIndex(i) { return (i + 2) % heroOffers.length; }

function heroApplyState() {
  heroOffers.forEach((offer, i) => {
    offer.classList.remove("card-current", "card-next", "card-back");
    offer.style.removeProperty("z-index");
    if (i === heroIndex) offer.classList.add("card-current");
    else if (i === heroNextIndex(heroIndex)) offer.classList.add("card-next");
    else if (i === heroBackIndex(heroIndex)) offer.classList.add("card-back");
  });
  if (heroDots) {
    heroDots.querySelectorAll(".hero-offers__dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === heroIndex);
      dot.setAttribute("aria-current", i === heroIndex ? "true" : "false");
    });
  }
}

function heroBuildDots() {
  if (!heroDots || !heroOffers.length) return;
  heroDots.innerHTML = "";
  heroOffers.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "hero-offers__dot";
    b.setAttribute("aria-label", `Mostrar destaque ${i + 1}`);
    b.addEventListener("click", () => heroGoTo(i, true));
    heroDots.appendChild(b);
  });
}

async function heroGoTo(newIndex, manual = false) {
  if (!heroOffers.length || newIndex === heroIndex || heroAnimating) return;
  heroAnimating = true;
  const current = heroOffers[heroIndex];
  const incoming = heroOffers[newIndex];

  if (prefersReducedMotion || !current.animate || !incoming.animate) {
    heroIndex = newIndex;
    heroApplyState();
    heroAnimating = false;
    if (manual) heroStart();
    return;
  }

  incoming.style.zIndex = "40";
  current.style.zIndex = "30";

  const outgoingAnimation = current.animate([
    { transform: "translate3d(-5px,-6px,0) rotate(-0.7deg) scale(.988)", opacity: 1 },
    { transform: "translate3d(-28px,-5px,0) rotate(-2.2deg) scale(.978)", opacity: .88, offset: .42 },
    { transform: "translate3d(-82px,12px,0) rotate(-6deg) scale(.945)", opacity: 0 }
  ], { duration: 680, easing: "cubic-bezier(.3,.05,.18,1)", fill: "forwards" });

  const incomingAnimation = incoming.animate([
    { transform: "translate3d(31px,18px,0) rotate(3deg) scale(.94)", opacity: .72 },
    { transform: "translate3d(22px,2px,0) rotate(1.8deg) scale(.962)", opacity: .90, offset: .45 },
    { transform: "translate3d(5px,-7px,0) rotate(.1deg) scale(.986)", opacity: 1, offset: .82 },
    { transform: "translate3d(-5px,-6px,0) rotate(-.7deg) scale(.988)", opacity: 1 }
  ], { duration: 680, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });

  try { await Promise.all([outgoingAnimation.finished, incomingAnimation.finished]); } catch (_) {}
  outgoingAnimation.cancel();
  incomingAnimation.cancel();
  heroIndex = newIndex;
  heroApplyState();
  heroAnimating = false;
  if (manual) heroStart();
}

function heroNext() { heroGoTo(heroNextIndex(heroIndex)); }
function heroPrev() { heroGoTo((heroIndex - 1 + heroOffers.length) % heroOffers.length, true); }
function heroStop() { clearInterval(heroTimer); heroTimer = null; }
function heroStart() {
  heroStop();
  if (heroOffers.length > 1) heroTimer = setInterval(heroNext, 5000);
}

if (heroOffers.length) {
  heroBuildDots();
  heroApplyState();
  heroStart();
  if (heroArea) {
    heroArea.addEventListener("mouseenter", heroStop);
    heroArea.addEventListener("mouseleave", heroStart);
    heroArea.addEventListener("focusin", heroStop);
    heroArea.addEventListener("focusout", heroStart);
    heroArea.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); heroGoTo(heroNextIndex(heroIndex), true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); heroPrev(); }
    });
  }
  document.addEventListener("visibilitychange", () => document.hidden ? heroStop() : heroStart());
}

// =========================================================
// GALERIAS DAS LOJAS
// =========================================================
document.querySelectorAll("[data-store-gallery]").forEach(galleryBox => {
  const slides = [...galleryBox.querySelectorAll(".store-gallery__slide")];
  const dots = [...galleryBox.querySelectorAll(".store-gallery__dot")];
  const prev = galleryBox.querySelector(".store-gallery__nav--prev");
  const next = galleryBox.querySelector(".store-gallery__nav--next");
  let index = 0, timer = null, visible = false;

  const available = i => slides[i] && !slides[i].classList.contains("is-broken");
  function findAvailable(start, direction=1) {
    for (let o=0; o<slides.length; o++) {
      const i=(start + direction*o + slides.length) % slides.length;
      if (available(i)) return i;
    }
    return -1;
  }
  function show(i) {
    if (!slides.length) return;
    const found=findAvailable((i+slides.length)%slides.length,1);
    if (found<0) return;
    index=found;
    slides.forEach((s,j)=>s.classList.toggle("is-active",j===index));
    dots.forEach((d,j)=>{
      d.classList.toggle("is-active",j===index);
      d.classList.toggle("is-disabled",!available(j));
      d.setAttribute("aria-current",j===index?"true":"false");
    });
  }
  function nextPhoto(){ const n=findAvailable(index+1,1); if(n>=0) show(n); }
  function prevPhoto(){ const p=findAvailable(index-1,-1); if(p>=0) show(p); }
  function stop(){ clearInterval(timer); timer=null; }
  function start(){ stop(); if(visible && slides.length>1) timer=setInterval(nextPhoto,5000); }

  slides.forEach((slide,j)=>{
    const img=slide.querySelector("img");
    if(!img) return;
    img.addEventListener("load",()=>slide.classList.remove("is-broken"));
    img.addEventListener("error",()=>{ slide.classList.add("is-broken"); if(j===index) nextPhoto(); });
  });
  next?.addEventListener("click",()=>{nextPhoto();start();});
  prev?.addEventListener("click",()=>{prevPhoto();start();});
  dots.forEach((d,j)=>d.addEventListener("click",()=>{if(available(j)){show(j);start();}}));
  galleryBox.addEventListener("mouseenter",stop);
  galleryBox.addEventListener("mouseleave",start);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries=>entries.forEach(entry=>{
      visible=entry.isIntersecting;
      if(visible){show(index);start();} else stop();
    }),{threshold:.15}).observe(galleryBox);
  } else { visible=true; start(); }
  show(0);
});

// =========================================================
// STATUS AUTOMÁTICO DAS LOJAS — America/Fortaleza
// =========================================================
const horariosLojas = {
  "midway-l1": {0:["13:00","20:00"],1:["10:00","22:00"],2:["10:00","22:00"],3:["10:00","22:00"],4:["10:00","22:00"],5:["10:00","22:00"],6:["10:00","22:00"]},
  "midway-l2": {0:["13:00","20:00"],1:["10:00","22:00"],2:["10:00","22:00"],3:["10:00","22:00"],4:["10:00","22:00"],5:["10:00","22:00"],6:["10:00","22:00"]},
  "midway-l3": {0:["13:00","20:00"],1:["10:00","22:00"],2:["10:00","22:00"],3:["10:00","22:00"],4:["10:00","22:00"],5:["10:00","22:00"],6:["10:00","22:00"]},
  "ponto-midway-l3": {0:["13:00","20:00"],1:["10:00","22:00"],2:["10:00","22:00"],3:["10:00","22:00"],4:["10:00","22:00"],5:["10:00","22:00"],6:["10:00","22:00"]},
  "parnamirim": {0:null,1:["08:00","17:00"],2:["08:00","17:00"],3:["08:00","17:00"],4:["08:00","17:00"],5:["08:00","17:00"],6:["09:00","12:00"]},
  "alecrim": {0:null,1:["08:00","17:00"],2:["08:00","17:00"],3:["08:00","17:00"],4:["08:00","17:00"],5:["08:00","17:00"],6:["09:00","12:00"]},
  "mossoro-boulevard": {0:null,1:["08:00","17:00"],2:["08:00","17:00"],3:["08:00","17:00"],4:["08:00","17:00"],5:["08:00","17:00"],6:["09:00","12:00"]},
  "campina-partage": {0:["13:00","20:00"],1:["10:00","22:00"],2:["10:00","22:00"],3:["10:00","22:00"],4:["10:00","22:00"],5:["10:00","22:00"],6:["10:00","22:00"]},
  "campina-centro": {0:null,1:["08:00","17:00"],2:["08:00","17:00"],3:["08:00","17:00"],4:["08:00","17:00"],5:["08:00","17:00"],6:["08:00","13:00"]}
};
function toMinutes(h){const [hh,mm]=h.split(":").map(Number);return hh*60+mm;}
function nowFortaleza(){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Fortaleza",weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  const v={}; parts.forEach(p=>v[p.type]=p.value);
  const days={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  return {day:days[v.weekday],minutes:Number(v.hour)*60+Number(v.minute)};
}
function updateStoreStatus(){
  const now=nowFortaleza();
  document.querySelectorAll(".store[data-store-id]").forEach(store=>{
    const status=store.querySelector("[data-store-status]"); const agenda=horariosLojas[store.dataset.storeId];
    if(!status||!agenda) return;
    const hours=agenda[now.day]; let open=false;
    if(hours) open=now.minutes>=toMinutes(hours[0]) && now.minutes<toMinutes(hours[1]);
    status.textContent=open?"Aberto agora":"Fechado agora";
    status.classList.toggle("store__status--closed",!open);
  });
}
if(document.querySelector(".store[data-store-id]")){updateStoreStatus();setInterval(updateStoreStatus,60000);}

// =========================================================
// ACESSÓRIOS — filtro de categorias
// =========================================================
const accessoryButtons=[...document.querySelectorAll(".accessory-category-button")];
const accessoryPanels=[...document.querySelectorAll("[data-category-panel]")];
const accessoryTitle=document.getElementById("accessoryCategoryTitle");
const accessoryNames={capinhas:"Capinhas",peliculas:"Películas",carregadores:"Carregadores",cabos:"Cabos",fones:"Fones",powerbanks:"PowerBanks"};
function selectAccessoryCategory(category){
  accessoryButtons.forEach(b=>b.classList.toggle("is-active",b.dataset.category===category));
  accessoryPanels.forEach(p=>p.classList.toggle("is-active",p.dataset.categoryPanel===category));
  if(accessoryTitle) accessoryTitle.textContent=accessoryNames[category]||"Acessórios";
}
accessoryButtons.forEach(b=>b.addEventListener("click",()=>selectAccessoryCategory(b.dataset.category)));

// =========================================================
// ACESSÓRIOS — carrosséis internos de opções
// =========================================================
document.querySelectorAll("[data-accessory-carousel]").forEach(card=>{
  const options=[...card.querySelectorAll(".accessory-option")];
  const dots=[...card.querySelectorAll(".accessory-option-dot")];
  const prev=card.querySelector(".accessory-option-nav--prev");
  const next=card.querySelector(".accessory-option-nav--next");
  let index=0,timer=null,visible=false;
  function show(i){
    if(!options.length)return; index=(i+options.length)%options.length;
    options.forEach((o,j)=>o.classList.toggle("is-active",j===index));
    dots.forEach((d,j)=>{d.classList.toggle("is-active",j===index);d.setAttribute("aria-current",j===index?"true":"false");});
  }
  function stop(){clearInterval(timer);timer=null;}
  function start(){stop();if(visible&&options.length>1)timer=setInterval(()=>show(index+1),5000);}
  prev?.addEventListener("click",()=>{show(index-1);start();});
  next?.addEventListener("click",()=>{show(index+1);start();});
  dots.forEach((d,j)=>d.addEventListener("click",()=>{show(j);start();}));
  card.addEventListener("mouseenter",stop); card.addEventListener("mouseleave",start);
  if("IntersectionObserver" in window){new IntersectionObserver(entries=>entries.forEach(e=>{visible=e.isIntersecting;visible?start():stop();}),{threshold:.18}).observe(card);} else {visible=true;start();}
  show(0);
});


// =========================================================
// PONTO CELULAR — RECURSOS PREMIUM V2
// =========================================================

// ---------------------------------------------------------
// Analytics-ready: eventos vão para dataLayer mesmo antes
// de um ID do Google Analytics ser configurado.
// Ao publicar, instale o GA4 e os eventos já estarão prontos.
// ---------------------------------------------------------
window.dataLayer = window.dataLayer || [];
function trackEvent(eventName, params = {}) {
  window.dataLayer.push({ event: eventName, ...params });
  if (typeof window.gtag === "function") window.gtag("event", eventName, params);
}
document.addEventListener("click", event => {
  const target = event.target.closest("[data-track]");
  if (!target) return;
  trackEvent(target.dataset.track, { label: target.dataset.trackLabel || target.textContent.trim(), page: location.pathname });
});

// ---------------------------------------------------------
// Menu mobile premium + backdrop
// ---------------------------------------------------------
if (navToggle && nav) {
  const backdrop = document.createElement("div");
  backdrop.className = "mobile-nav-backdrop";
  document.body.appendChild(backdrop);
  const syncDrawer = () => {
    const open = nav.classList.contains("nav--open");
    backdrop.classList.toggle("is-open", open);
    document.body.classList.toggle("body-nav-open", open);
  };
  navToggle.addEventListener("click", () => requestAnimationFrame(syncDrawer));
  backdrop.addEventListener("click", () => {
    nav.classList.remove("nav--open"); navToggle.setAttribute("aria-expanded", "false"); syncDrawer();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("nav--open")) {
      nav.classList.remove("nav--open"); navToggle.setAttribute("aria-expanded", "false"); syncDrawer(); navToggle.focus();
    }
  });
}

// ---------------------------------------------------------
// Página ativa no menu
// ---------------------------------------------------------
const currentFile = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav a").forEach(a => {
  const href=(a.getAttribute("href")||"").split("#")[0].split("/").pop();
  if ((currentFile === "index.html" && (!href || href === "index.html")) || href === currentFile) a.classList.add("is-active");
});
if (location.pathname.includes("/lojas/")) { document.querySelectorAll(".nav a").forEach(a => { if ((a.getAttribute("href")||"").includes("#lojas")) a.classList.add("is-active"); }); }

// ---------------------------------------------------------
// Pesquisa interna global
// ---------------------------------------------------------
const SITE_SEARCH_INDEX = [
  { title:"Smartphones", description:"iPhone, Samsung e Motorola", url:(location.pathname.includes("/lojas/")?"../":"")+"smartphones.html", keywords:"celular smartphone iphone apple samsung motorola" },
  { title:"Acessórios", description:"Capinhas, películas, carregadores, cabos, fones e PowerBanks", url:(location.pathname.includes("/lojas/")?"../":"")+"acessorios.html", keywords:"acessorios capinha pelicula carregador cabo fone powerbank geonav rockspace peining" },
  { title:"Serviços", description:"Serviços móveis e residenciais", url:(location.pathname.includes("/lojas/")?"../":"")+"servicos.html", keywords:"servicos movel residencial internet tv streaming" },
  { title:"Loja Midway L1", description:"Natal/RN — Shopping Midway Mall", url:"loja.html?id=midway-l1", keywords:"midway natal loja l1" },
  { title:"Loja Midway L2", description:"Natal/RN — Shopping Midway Mall", url:"loja.html?id=midway-l2", keywords:"midway natal loja l2" },
  { title:"Loja Midway L3", description:"Natal/RN — Shopping Midway Mall", url:"loja.html?id=midway-l3", keywords:"midway natal loja l3" },
  { title:"Ponto Celular Midway", description:"Acessórios — Piso L3", url:"loja.html?id=ponto-midway-l3", keywords:"ponto celular midway acessorios natal" },
  { title:"Loja Parnamirim", description:"Parnamirim/RN", url:"loja.html?id=parnamirim", keywords:"parnamirim rn loja" },
  { title:"Loja Alecrim", description:"Natal/RN", url:"loja.html?id=alecrim", keywords:"alecrim natal rn loja" },
  { title:"Loja Mossoró Boulevard", description:"Mossoró/RN", url:"loja.html?id=mossoro-boulevard", keywords:"mossoro boulevard rn loja" },
  { title:"Loja Campina Grande Partage", description:"Campina Grande/PB", url:"loja.html?id=campina-partage", keywords:"campina grande partage pb loja" },
  { title:"Loja Campina Grande Centro", description:"Campina Grande/PB", url:"loja.html?id=campina-centro", keywords:"campina grande centro pb loja" }
];
function normalizeSearch(s){ return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); }
function buildSearch(){
  const header=document.querySelector(".header__inner");
  if(!header) return;

  // Usa uma única lupa. Se o HTML já tiver uma, reaproveita em vez de criar outra.
  let toggle=header.querySelector(".site-search-toggle");
  header.querySelectorAll(".site-search-toggle").forEach((button,index)=>{
    if(index>0) button.remove();
  });

  if(!toggle){
    toggle=document.createElement("button");
    toggle.type="button";
    toggle.className="site-search-toggle";
    toggle.setAttribute("aria-label","Pesquisar no site");
  }

  // Ícone SVG único, mais coerente com o design do site.
  toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>';
  toggle.removeAttribute("data-site-search");

  // Posiciona a pesquisa antes do botão de WhatsApp.
  const cta=header.querySelector(".header__cta");
  if(cta && toggle.nextElementSibling!==cta) header.insertBefore(toggle,cta);

  let overlay=document.querySelector(".site-search");
  if(!overlay){
    overlay=document.createElement("div");
    overlay.className="site-search";
    overlay.innerHTML='<div class="site-search__panel" role="dialog" aria-modal="true" aria-label="Pesquisa"><div class="site-search__top"><input class="site-search__input" type="search" placeholder="Pesquise: iPhone, capinhas, Midway..." autocomplete="off"><button class="site-search__close" type="button" aria-label="Fechar pesquisa">×</button></div><div class="site-search__results"></div></div>';
    document.body.appendChild(overlay);
  }

  const input=overlay.querySelector("input");
  const results=overlay.querySelector(".site-search__results");
  const close=overlay.querySelector(".site-search__close");
  let previousFocus=null;

  const render=q=>{
    const nq=normalizeSearch(q.trim());
    const found=!nq?SITE_SEARCH_INDEX.slice(0,6):SITE_SEARCH_INDEX.filter(x=>normalizeSearch(`${x.title} ${x.description} ${x.keywords}`).includes(nq));
    results.innerHTML=found.length
      ? found.map(x=>`<a class="search-result" href="${x.url}"><div><strong>${x.title}</strong><span>${x.description}</span></div><small>Abrir →</small></a>`).join("")
      : '<div class="search-empty">Nenhum resultado encontrado. Tente outro termo.</div>';
  };

  const open=()=>{
    previousFocus=document.activeElement;
    overlay.classList.add("is-open");
    document.body.style.overflow="hidden";
    render("");
    setTimeout(()=>input.focus(),60);
    trackEvent("search_open");
  };
  const shut=()=>{
    overlay.classList.remove("is-open");
    document.body.style.overflow="";
    previousFocus?.focus();
  };

  toggle.onclick=open;
  close.onclick=shut;
  overlay.onclick=e=>{if(e.target===overlay) shut();};
  input.oninput=()=>{render(input.value);trackEvent("search_query",{query:input.value});};
  document.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();open();}
    if(e.key==="Escape"&&overlay.classList.contains("is-open")) shut();
  });
}
buildSearch();

// ---------------------------------------------------------
// Voltar ao topo
// ---------------------------------------------------------
const backTop=document.createElement("button"); backTop.type="button"; backTop.className="back-to-top"; backTop.setAttribute("aria-label","Voltar ao topo"); backTop.textContent="↑"; document.body.appendChild(backTop);
window.addEventListener("scroll",()=>backTop.classList.toggle("is-visible",scrollY>600),{passive:true}); backTop.addEventListener("click",()=>window.scrollTo({top:0,behavior:prefersReducedMotion?"auto":"smooth"}));

// ---------------------------------------------------------
// Loja mais próxima (Haversine, sem enviar localização a servidor)
// ---------------------------------------------------------
const STORE_COORDS = [{"id": "midway-l1", "name": "Loja Claro Midway — Piso L1", "short": "Midway L1", "lat": -5.8112867, "lng": -35.2062242, "map": "https://maps.app.goo.gl/dzBti8DR79H8BsKs5", "slug": "midway-l1"}, {"id": "midway-l2", "name": "Loja Claro Midway — Piso L2", "short": "Midway L2", "lat": -5.8112867, "lng": -35.2062242, "map": "https://maps.app.goo.gl/dzBti8DR79H8BsKs5", "slug": "midway-l2"}, {"id": "midway-l3", "name": "Loja Claro Midway — Piso L3", "short": "Midway L3", "lat": -5.8112867, "lng": -35.2062242, "map": "https://maps.app.goo.gl/dzBti8DR79H8BsKs5", "slug": "midway-l3"}, {"id": "ponto-midway-l3", "name": "Ponto Celular Midway (Acessórios) — Piso L3", "short": "Ponto Celular Midway", "lat": -5.8112867, "lng": -35.2062242, "map": "https://maps.app.goo.gl/dzBti8DR79H8BsKs5", "slug": "ponto-midway-acessorios"}, {"id": "parnamirim", "name": "Loja Parnamirim", "short": "Parnamirim", "lat": -5.9180763, "lng": -35.2614352, "map": "https://maps.app.goo.gl/SnGSqGwxsToAKvxD9", "slug": "parnamirim"}, {"id": "alecrim", "name": "Loja Alecrim", "short": "Alecrim", "lat": -5.7965861, "lng": -35.2188769, "map": "https://maps.app.goo.gl/s1C1ZJuaft71H8m66", "slug": "alecrim"}, {"id": "mossoro-boulevard", "name": "Loja Mossoró Boulevard", "short": "Mossoró Boulevard", "lat": -5.1937507, "lng": -37.3455909, "map": "https://maps.app.goo.gl/nuZmmjfgJZY6B1TA8", "slug": "mossoro-boulevard"}, {"id": "campina-partage", "name": "Loja Campina Grande Partage", "short": "Campina Grande Partage", "lat": -7.2359231, "lng": -35.8706626, "map": "https://maps.app.goo.gl/MJYdLDSepykjKDeR9", "slug": "campina-grande-partage"}, {"id": "campina-centro", "name": "Loja Campina Grande Centro", "short": "Campina Grande Centro", "lat": -7.2168859, "lng": -35.8849237, "map": "https://maps.app.goo.gl/9ASvcHY2zcrZMce47", "slug": "campina-grande-centro"}];
function distanceKm(a,b,c,d){const R=6371,rad=x=>x*Math.PI/180,dp=rad(c-a),dl=rad(d-b);const h=Math.sin(dp/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
function nearestStoreModal(store,distance){ let modal=document.querySelector(".nearest-store-result"); if(!modal){modal=document.createElement("div");modal.className="nearest-store-result";document.body.appendChild(modal);} modal.innerHTML=`<div class="nearest-store-result__card" role="dialog" aria-modal="true"><button class="nearest-store-result__close" aria-label="Fechar">×</button><p class="eyebrow">Unidade mais próxima</p><h2>${store.name}</h2><p>A estimativa é calculada diretamente no seu navegador. Nenhuma coordenada é armazenada pelo site.</p><span class="nearest-store-result__distance">aprox. ${distance.toFixed(1).replace('.',',')} km em linha reta</span><div class="nearest-store-result__actions"><a class="btn btn--accent" href="${store.map}" target="_blank" rel="noopener noreferrer">Como chegar</a><a class="btn btn--ghost" href="loja.html?id=${store.id}">Ver unidade</a></div></div>`; modal.classList.add("is-open"); const close=()=>modal.classList.remove("is-open"); modal.querySelector("button").onclick=close; modal.onclick=e=>{if(e.target===modal)close();}; }
const nearestBtn=document.getElementById("nearestStoreBtn"); if(nearestBtn) nearestBtn.addEventListener("click",()=>{ if(!navigator.geolocation){alert("Seu navegador não oferece geolocalização.");return;} nearestBtn.disabled=true; const old=nearestBtn.innerHTML; nearestBtn.textContent="Localizando..."; navigator.geolocation.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;let best=null;STORE_COORDS.forEach(s=>{const d=distanceKm(latitude,longitude,s.lat,s.lng);if(!best||d<best.d)best={s,d};});nearestBtn.disabled=false;nearestBtn.innerHTML=old;nearestStoreModal(best.s,best.d);trackEvent("nearest_store",{store:best.s.short,distance_km:+best.d.toFixed(1)});},()=>{nearestBtn.disabled=false;nearestBtn.innerHTML=old;alert("Não foi possível acessar sua localização. Verifique a permissão do navegador.");},{enableHighAccuracy:false,timeout:8000,maximumAge:300000}); });

// ---------------------------------------------------------
// Página única de loja: loja.html?id=...
// ---------------------------------------------------------
const STORE_DETAILS = {
  "midway-l1": {
    name:"Loja Claro Midway — Piso L1", city:"Natal", state:"RN",
    address:"Avenida Nevaldo Rocha, 3775 — Lagoa Nova", map:"https://maps.app.goo.gl/dzBti8DR79H8BsKs5",
    images:["loja-claro-midway-piso-l1.jpeg","loja-claro-midway-piso-l1-(1).jpeg"],
    hours:["Seg à Sab — 10h às 22h","Dom — 13h às 20h","Feriados — consultar a loja"],
    services:["Smartphones","Serviços móveis","Serviços residenciais"]
  },
  "midway-l2": {
    name:"Loja Claro Midway — Piso L2", city:"Natal", state:"RN",
    address:"Avenida Nevaldo Rocha, 3775 — Lagoa Nova", map:"https://maps.app.goo.gl/dzBti8DR79H8BsKs5",
    images:["loja-claro-midway-piso-l2.jpeg","loja-claro-midway-piso-l2-(2).jpeg","loja-claro-midway-piso-l2-(3).jpeg"],
    hours:["Seg à Sab — 10h às 22h","Dom — 13h às 20h","Feriados — consultar a loja"],
    services:["Smartphones","Serviços móveis","Serviços residenciais"]
  },
  "midway-l3": {
    name:"Loja Claro Midway — Piso L3", city:"Natal", state:"RN",
    address:"Avenida Nevaldo Rocha, 3775 — Lagoa Nova", map:"https://maps.app.goo.gl/dzBti8DR79H8BsKs5",
    images:["loja-claro-midway-piso-l3.jpeg","loja-claro-midway-piso-l3-(1) .jpeg"],
    hours:["Seg à Sab — 10h às 22h","Dom — 13h às 20h","Feriados — consultar a loja"],
    services:["Smartphones","Serviços móveis","Serviços residenciais"]
  },
  "ponto-midway-l3": {
    name:"Ponto Celular Midway (Acessórios) — Piso L3", city:"Natal", state:"RN",
    address:"Avenida Nevaldo Rocha, 3775 — Lagoa Nova", map:"https://maps.app.goo.gl/dzBti8DR79H8BsKs5",
    images:["loja-ponto-celular-midway-(acessorios)-piso-l3.jpeg","loja-ponto-celular-midway-(acessorios)-piso-l3-(1).jpeg"],
    hours:["Seg à Sab — 10h às 22h","Dom — 13h às 20h","Feriados — consultar a loja"],
    services:["Capinhas e películas","Carregadores e cabos","Fones e acessórios"]
  },
  "parnamirim": {
    name:"Loja Parnamirim", city:"Parnamirim", state:"RN",
    address:"Consulte a localização no Google Maps", map:"https://maps.app.goo.gl/SnGSqGwxsToAKvxD9",
    images:["loja-parnamirim.jpeg","loja-parnamirim-(1).jpeg"],
    hours:["Seg à Sex — 08h às 17h","Sab — 09h às 12h","Dom — fechado","Feriados — consultar a loja"],
    services:["Smartphones","Serviços móveis","Serviços residenciais"]
  },
  "alecrim": {
    name:"Loja Alecrim", city:"Natal", state:"RN",
    address:"Consulte a localização no Google Maps", map:"https://maps.app.goo.gl/s1C1ZJuaft71H8m66",
    images:["loja-alecrim.jpeg","loja-alecrim-(1).jpeg"],
    hours:["Seg à Sex — 08h às 17h","Sab — 09h às 12h","Dom — fechado","Feriados — consultar a loja"],
    services:["Smartphones","Serviços móveis","Serviços residenciais"]
  },
  "mossoro-boulevard": {
    name:"Loja Mossoró Boulevard", city:"Mossoró", state:"RN",
    address:"Consulte a localização no Google Maps", map:"https://maps.app.goo.gl/nuZmmjfgJZY6B1TA8",
    images:["loja-mossoro-boulevard.jpeg","loja-mossoro-boulevard-(1).jpeg","loja-mossoro-boulevard-(2).jpeg"],
    hours:["Seg à Sex — 08h às 17h","Sab — 09h às 12h","Dom — fechado","Feriados — consultar a loja"],
    services:["Smartphones","Serviços móveis","Serviços residenciais"]
  },
  "campina-partage": {
    name:"Loja Campina Grande Partage", city:"Campina Grande", state:"PB",
    address:"Consulte a localização no Google Maps", map:"https://maps.app.goo.gl/MJYdLDSepykjKDeR9",
    images:["loja-campina-grande-partage.jpeg","loja-campina-grande-partage-(1).jpeg"],
    hours:["Seg à Sab — 10h às 22h","Dom — 13h às 20h","Feriados — consultar a loja"],
    services:["Smartphones","Serviços móveis","Serviços residenciais"]
  },
  "campina-centro": {
    name:"Loja Campina Grande Centro", city:"Campina Grande", state:"PB",
    address:"Consulte a localização no Google Maps", map:"https://maps.app.goo.gl/9ASvcHY2zcrZMce47",
    images:["loja-campina-grande-centro.jpeg","loja-campina-grande-centro-(1).jpeg"],
    hours:["Seg à Sex — 08h às 17h","Sab — 08h às 13h","Dom — fechado","Feriados — consultar a loja"],
    services:["Smartphones","Serviços móveis","Serviços residenciais"]
  }
};

function initSingleStorePage(){
  const root=document.querySelector('[data-single-store-page]');
  if(!root) return;
  const id=new URLSearchParams(location.search).get('id') || 'midway-l1';
  const store=STORE_DETAILS[id];
  if(!store){
    location.replace('404.html');
    return;
  }

  root.dataset.detailStoreId=id;
  document.body.dataset.storePage=id;
  document.title=`${store.name} | Ponto Celular`;
  document.querySelector('meta[name="description"]')?.setAttribute('content',`Informações, horários e localização da ${store.name}.`);

  const set=(sel,text)=>{const el=document.querySelector(sel);if(el)el.textContent=text;};
  set('[data-store-city]',`${store.city} • ${store.state}`);
  set('[data-store-name]',store.name);
  set('[data-store-address]',store.address);

  document.querySelectorAll('[data-store-map]').forEach(a=>a.href=store.map);
  const message=`Olá! Acessei a página da ${store.name} no site da Ponto Celular e gostaria de atendimento nesta unidade.`;
  document.querySelectorAll('[data-store-whatsapp]').forEach(a=>a.href=`https://wa.me/5584991360505?text=${encodeURIComponent(message)}`);

  const gallery=document.querySelector('[data-store-detail-gallery]');
  if(gallery){
    gallery.innerHTML=store.images.map((file,i)=>`<img src="/imagens/${file}" alt="${store.name} — foto ${i+1}" loading="lazy" decoding="async">`).join('');
  }
  const hours=document.querySelector('[data-store-hours]');
  if(hours) hours.innerHTML=store.hours.map(x=>`<li>${x}</li>`).join('');
  const services=document.querySelector('[data-store-services]');
  if(services) services.innerHTML=store.services.map(x=>`<li>${x}</li>`).join('');
  const share=document.querySelector('[data-share-store]');
  if(share) share.dataset.shareTitle=store.name;
}
initSingleStorePage();

// ---------------------------------------------------------
// Lightbox das lojas
// ---------------------------------------------------------
const lightboxImages=[...document.querySelectorAll(".store-gallery__slide img, .store-detail-gallery img")];
if(lightboxImages.length){let current=0;const lb=document.createElement("div");lb.className="site-lightbox";lb.innerHTML='<figure class="site-lightbox__figure"><button class="site-lightbox__close" type="button" aria-label="Fechar">×</button><button class="site-lightbox__nav site-lightbox__nav--prev" type="button" aria-label="Foto anterior">‹</button><img class="site-lightbox__image" alt=""><figcaption class="site-lightbox__caption"></figcaption><button class="site-lightbox__nav site-lightbox__nav--next" type="button" aria-label="Próxima foto">›</button></figure>';document.body.appendChild(lb);const img=lb.querySelector("img"),cap=lb.querySelector("figcaption");const show=i=>{current=(i+lightboxImages.length)%lightboxImages.length;img.src=lightboxImages[current].src;img.alt=lightboxImages[current].alt;cap.textContent=`${lightboxImages[current].alt} • ${current+1} / ${lightboxImages.length}`;};const open=i=>{show(i);lb.classList.add("is-open");document.body.style.overflow="hidden";lb.querySelector(".site-lightbox__close").focus();};const close=()=>{lb.classList.remove("is-open");document.body.style.overflow="";};lightboxImages.forEach((el,i)=>el.addEventListener("click",()=>open(i)));lb.querySelector(".site-lightbox__close").onclick=close;lb.querySelector(".site-lightbox__nav--prev").onclick=()=>show(current-1);lb.querySelector(".site-lightbox__nav--next").onclick=()=>show(current+1);lb.onclick=e=>{if(e.target===lb)close();};document.addEventListener("keydown",e=>{if(!lb.classList.contains("is-open"))return;if(e.key==="Escape")close();if(e.key==="ArrowRight")show(current+1);if(e.key==="ArrowLeft")show(current-1);});}

// ---------------------------------------------------------

// Status em páginas individuais de loja
// ---------------------------------------------------------
const detailStore=document.querySelector("[data-detail-store-id]");
if(detailStore && typeof horariosLojas!=="undefined"){
  const status=detailStore.querySelector("[data-store-status]"); const id=detailStore.dataset.detailStoreId; const agenda=horariosLojas[id]; if(status&&agenda){const agora=nowFortaleza(),h=agenda[agora.day];let aberta=false;if(h){const a=toMinutes(h[0]),f=toMinutes(h[1]);aberta=agora.minutes>=a&&agora.minutes<f;}status.textContent=aberta?"Aberto agora":"Fechado agora";status.classList.toggle("store__status--closed",!aberta);}
}

// ---------------------------------------------------------
// Consulta de disponibilidade (Acessórios)
// ---------------------------------------------------------
const inventoryForm=document.getElementById("inventoryConsultForm");
if(inventoryForm){const storeSelect=document.getElementById("inventoryStore"),categorySelect=document.getElementById("inventoryCategory");STORE_COORDS.forEach(s=>{const o=document.createElement("option");o.value=s.short;o.textContent=s.short;storeSelect.appendChild(o);});inventoryForm.addEventListener("submit",e=>{e.preventDefault();if(!categorySelect.value||!storeSelect.value)return;const msg=`Olá! Acessei o site da Ponto Celular e gostaria de consultar a disponibilidade de ${categorySelect.value} na unidade ${storeSelect.value}.`;trackEvent("inventory_consult",{category:categorySelect.value,store:storeSelect.value});window.open(`https://wa.me/5584991360505?text=${encodeURIComponent(msg)}`,"_blank","noopener");});}


// =========================================================
// PREMIUM V3 — FILTROS, STATUS DETALHADO, DADOS E PWA
// =========================================================

// Imagens: skeleton simples enquanto carregam
[...document.images].forEach(img=>{img.classList.add('image-loading');const done=()=>{img.classList.remove('image-loading');img.classList.add('image-loaded')};if(img.complete)done();else{img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});}});

// Filtro de lojas
const storeCards=[...document.querySelectorAll('.store[data-store-id]')];
const filterInput=document.getElementById('storeFilterInput');
const filterChips=[...document.querySelectorAll('[data-store-filter]')];
const filterCount=document.getElementById('storeFilterCount');
let activeCity='all';
function applyStoreFilter(){const q=(filterInput?.value||'').trim().toLocaleLowerCase('pt-BR');let visible=0;storeCards.forEach(card=>{const city=card.dataset.city||'';const text=(card.textContent+' '+city).toLocaleLowerCase('pt-BR');const okCity=activeCity==='all'||city===activeCity;const okText=!q||text.includes(q);const show=okCity&&okText;card.classList.toggle('is-filtered-out',!show);if(show)visible++;});if(filterCount)filterCount.textContent=`${visible} ${visible===1?'unidade encontrada':'unidades encontradas'}`;}
filterInput?.addEventListener('input',applyStoreFilter);
filterChips.forEach(btn=>btn.addEventListener('click',()=>{activeCity=btn.dataset.storeFilter;filterChips.forEach(x=>x.classList.toggle('is-active',x===btn));applyStoreFilter();}));
document.querySelectorAll('[data-presence-city]').forEach(btn=>btn.addEventListener('click',()=>{activeCity=btn.dataset.presenceCity;filterChips.forEach(x=>x.classList.toggle('is-active',x.dataset.storeFilter===activeCity));document.getElementById('lojas')?.scrollIntoView({behavior:prefersReducedMotion?'auto':'smooth'});applyStoreFilter();}));
if(storeCards.length)applyStoreFilter();

// Status detalhado: “Aberto • fecha às …” / “Fechado • abre …”
function dayName(day){return ['domingo','segunda','terça','quarta','quinta','sexta','sábado'][day]}
function nextOpening(agenda,day,minutes){for(let offset=0;offset<8;offset++){const d=(day+offset)%7;const h=agenda[d];if(!h)continue;const open=toMinutes(h[0]);if(offset===0&&minutes<open)return `abre hoje às ${h[0]}`;if(offset>0)return `abre ${offset===1?'amanhã':dayName(d)} às ${h[0]}`;}return 'consulte o horário';}
function detailedStoreStatus(){const agora=nowFortaleza();document.querySelectorAll('[data-store-id]').forEach(card=>{const id=card.dataset.storeId,status=card.querySelector('[data-store-status]'),agenda=horariosLojas?.[id];if(!status||!agenda)return;const h=agenda[agora.day];let text='Fechado agora',open=false;if(h){const a=toMinutes(h[0]),f=toMinutes(h[1]);if(agora.minutes>=a&&agora.minutes<f){open=true;text=`Aberto • fecha às ${h[1]}`;}else{text=`Fechado • ${nextOpening(agenda,agora.day,agora.minutes)}`;}}else{text=`Fechado • ${nextOpening(agenda,agora.day,agora.minutes)}`;}status.textContent=text;status.classList.toggle('store__status--closed',!open);});const detail=document.querySelector('[data-detail-store-id]');if(detail){const id=detail.dataset.detailStoreId,status=detail.querySelector('[data-store-status]'),agenda=horariosLojas?.[id];if(status&&agenda){const h=agenda[agora.day];let open=false,text;if(h&&agora.minutes>=toMinutes(h[0])&&agora.minutes<toMinutes(h[1])){open=true;text=`Aberto • fecha às ${h[1]}`;}else{text=`Fechado • ${nextOpening(agenda,agora.day,agora.minutes)}`;}status.textContent=text;status.classList.toggle('store__status--closed',!open);}}}
try{detailedStoreStatus();setInterval(detailedStoreStatus,60000)}catch(e){}

// Compartilhamento nativo das páginas de loja
const shareBtn=document.querySelector('[data-share-store]');
shareBtn?.addEventListener('click',async()=>{const data={title:shareBtn.dataset.shareTitle||document.title,text:'Veja esta unidade da Ponto Celular:',url:location.href};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(location.href);alert('Link da loja copiado!');}}catch(e){}});

// Catálogo de acessórios com imagens reais
const ACCESSORY_CATALOG={
  capinhas:[
    {
      title:'Capinha MagSafe',
      brand:'Peining',
      image:'/imagens/capinha-mag-safe-3-1.png',
      alt:'Capinha MagSafe Peining',
      desc:'Capinha com acabamento moderno e compatibilidade MagSafe para aparelhos compatíveis.',
      specs:[
        'Tecnologia: MagSafe',
        'Compatibilidade: consulte em loja'
      ]
    },
    {
      title:'Capinha MagSafe',
      brand:'Peining',
      image:'/imagens/capinha-mag-safe-3-2.png',
      alt:'Capinha MagSafe Peining segunda opção',
      desc:'Modelo de capinha com proteção e encaixe magnético para uso com acessórios compatíveis.',
      specs:[
        'Proteção para o aparelho',
        'Compatibilidade: consulte em loja'
      ]
    },
    {
      title:'Capinha MagSafe',
      brand:'Peining',
      image:'/imagens/capinha-mag-safe3-3.png',
      alt:'Capinha MagSafe Peining terceira opção',
      desc:'Opção de capinha MagSafe com visual moderno e acabamento voltado para uso diário.',
      specs:[
        'Tecnologia: MagSafe',
        'Cores: consulte disponibilidade'
      ]
    },
    {
      title:'Capinha RockSpace',
      brand:'RockSpace',
      image:'/imagens/capinha-rock-space.png',
      alt:'Capinha RockSpace para smartphone',
      desc:'Capinha RockSpace desenvolvida para proteção e acabamento premium do smartphone.',
      specs:[
        'Proteção para uso diário',
        'Compatibilidade: consulte em loja'
      ]
    },
    {
      title:'Capinha RockSpace',
      brand:'RockSpace',
      image:'/imagens/capinha-rock-space-2.png',
      alt:'Capinha RockSpace segunda opção',
      desc:'Outra opção de proteção RockSpace para diferentes modelos de smartphones.',
      specs:[
        'Modelos variados',
        'Compatibilidade: consulte em loja'
      ]
    }
  ],

  peliculas:[
    {
      title:'Película RockSpace',
      brand:'RockSpace',
      image:'/imagens/pelicula-rock-space-3.png',
      alt:'Película RockSpace para smartphone',
      desc:'Película de proteção para a tela, desenvolvida para reduzir riscos e danos do uso cotidiano.',
      specs:[
        'Proteção de tela',
        'Compatibilidade: consulte em loja'
      ]
    },
    {
      title:'Película de Privacidade',
      brand:'RockSpace',
      image:'/imagens/pelicula-privacidade-rockspace.png',
      alt:'Película de privacidade RockSpace',
      desc:'Película voltada para maior privacidade lateral durante a utilização do smartphone.',
      specs:[
        'Recurso: privacidade lateral',
        'Compatibilidade: consulte em loja'
      ]
    }
  ],

  carregadores:[
    {
      title:'SuperPower 25W',
      brand:'Geonav',
      image:'/imagens/super-power-25w-carregador-usb-c.jpg',
      alt:'Carregador Geonav SuperPower 25W USB-C',
      desc:'Carregador compacto de 25W com conexão USB-C para dispositivos compatíveis.',
      specs:[
        'Potência: 25W',
        'Conexão: USB-C'
      ]
    }
  ],

  cabos:[
    {
      title:'Rock Space S08 USB-C',
      brand:'RockSpace',
      image:'/imagens/rock-space-s08-usb-c.png',
      alt:'Cabo Rock Space S08 USB-C',
      desc:'Cabo para carregamento e transferência de dados em dispositivos compatíveis.',
      specs:[
        'Conexão: USB-C',
        'Compatibilidade: consulte em loja'
      ]
    },
    {
      title:'Cabo Peining',
      brand:'Peining',
      image:'/imagens/cabo-peining.png',
      alt:'Cabo Peining para smartphone',
      desc:'Cabo Peining para carregamento e conexão de dispositivos compatíveis.',
      specs:[
        'Conexão: consulte opções',
        'Compatibilidade: consulte em loja'
      ]
    }
  ],

  fones:[
    {
      title:'Fones Peining',
      brand:'Peining',
      image:'/imagens/fones-peining.png',
      alt:'Fones de ouvido Peining',
      desc:'Fones Peining para música, chamadas e uso cotidiano.',
      specs:[
        'Tipo: consulte opções',
        'Conexão: consulte em loja'
      ]
    }
  ],

  powerbanks:[
    {
      title:'Power Bank 10.000 mAh',
      brand:'Geonav',
      image:'/imagens/power-bank-10.000-mAh.jpg',
      alt:'Power Bank Geonav de 10.000 mAh',
      desc:'Bateria portátil compacta para manter seus dispositivos carregados durante o dia.',
      specs:[
        'Capacidade: 10.000 mAh',
        'Conexões: consulte em loja'
      ]
    },
    {
      title:'Power Bank 20.000 mAh',
      brand:'Geonav',
      image:'/imagens/power-bank-20.000-mAh.jpg',
      alt:'Power Bank Geonav de 20.000 mAh',
      desc:'Maior capacidade de energia para períodos prolongados longe da tomada.',
      specs:[
        'Capacidade: 20.000 mAh',
        'Conexões: consulte em loja'
      ]
    }
  ]
};

function renderAccessoryData(category='capinhas'){
  const mount=document.getElementById('accessoryDataCatalog');
  if(!mount)return;

  const items=ACCESSORY_CATALOG[category]||[];

  mount.innerHTML=items.map(item=>`
    <article class="data-product-card">

      <div class="data-product-card__visual data-product-card__visual--image">
        <div class="data-product-card__image-frame">
          <img
            src="${item.image}"
            alt="${item.alt||item.title}"
            loading="lazy"
            decoding="async"
          >
        </div>
      </div>

      <div class="data-product-card__body">

        ${item.brand?`<span class="data-product-card__brand">${item.brand}</span>`:''}

        <h4>${item.title}</h4>

        <p>${item.desc}</p>

        <div class="data-product-card__specs">
          ${item.specs.map(spec=>`<span>${spec}</span>`).join('')}
        </div>

        <div class="data-product-card__availability">
          <span class="data-product-card__availability-dot" aria-hidden="true"></span>
          Consulte disponibilidade em loja
        </div>

      </div>

    </article>
  `).join('');
}

if(document.getElementById('accessoryDataCatalog')){
  renderAccessoryData('capinhas');

  document.querySelectorAll('.accessory-category-button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const category=btn.dataset.category;

      document.querySelectorAll('.accessory-category-button').forEach(item=>{
        item.classList.toggle('is-active',item===btn);
      });

      const title=document.getElementById('accessoryCategoryTitle');

      if(title){
        title.textContent=({
          capinhas:'Capinhas',
          peliculas:'Películas',
          carregadores:'Carregadores',
          cabos:'Cabos',
          fones:'Fones',
          powerbanks:'PowerBanks'
        })[category]||'Acessórios';
      }

      renderAccessoryData(category);
    });
  });
}

// PWA / instalação
let deferredInstallPrompt=null;const installButtons=[...document.querySelectorAll('[data-install-app]')];
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;installButtons.forEach(b=>b.hidden=false);});
installButtons.forEach(btn=>btn.addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;btn.hidden=true;}));


// ---------------------------------------------------------
// Imagens — fallback e diagnóstico de caminhos
// ---------------------------------------------------------
(function initImagePathRecovery(){
  const aliases = new Map([
    ["/imagens/loja-claro-midway-piso-l3-(1).jpeg", "/imagens/loja-claro-midway-piso-l3-(1) .jpeg"],
    ["/imagens/loja-claro-midway-piso-l3-(1)%20.jpeg", "/imagens/loja-claro-midway-piso-l3-(1) .jpeg"]
  ]);

  function normalizeAssetUrl(value){
    if (!value) return value;

    try {
      const url = new URL(value, location.origin);

      // Em produção no Pages, todos os assets ficam na raiz /imagens/.
      if (url.pathname.includes("/imagens/")) {
        const relative = url.pathname.slice(url.pathname.indexOf("/imagens/"));
        return relative + url.search;
      }
    } catch (_) {}

    return value;
  }

  document.querySelectorAll("img").forEach(img => {
    const normalized = normalizeAssetUrl(img.getAttribute("src"));

    if (normalized && normalized !== img.getAttribute("src")) {
      img.setAttribute("src", normalized);
    }

    img.addEventListener("error", () => {
      if (img.dataset.pathRecoveryTried === "true") return;
      img.dataset.pathRecoveryTried = "true";

      const current = decodeURI(new URL(img.src, location.origin).pathname);
      const alias = aliases.get(current);

      if (alias) {
        img.src = alias;
        return;
      }

      // O atributo visual deixa claro no DevTools qual arquivo falhou.
      img.dataset.assetError = current;
      console.error("Imagem não encontrada no Cloudflare Pages:", current);
    });
  });
})();
