gsap.registerPlugin(ScrollTrigger);

/* respect OS-level reduced motion: collapse all GSAP tween durations instead of skipping them,
   so content still ends in its correct final state without the motion */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(prefersReducedMotion){ gsap.globalTimeline.timeScale(60); }

/* skip expensive pointer-following effects on touch devices — no mouse, no benefit, only battery cost */
const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* mobile nav toggle */
const burgerBtn = document.getElementById('burgerBtn');
const mobileNav = document.getElementById('mobileNav');
if(burgerBtn){
  burgerBtn.addEventListener('click', ()=>{
    burgerBtn.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
  mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    burgerBtn.classList.remove('open');
    mobileNav.classList.remove('open');
  }));
}

/* Locations dropdown — CSS hover covers desktop mouse users, but touch devices and any
   pointer without true hover (tablets, some trackpads) never get a hover state at all,
   so the trigger link would just navigate away on first tap and the panel never opens.
   Toggling an "open" class on click/tap fixes that everywhere, on every page, since this
   script and its markup structure are shared identically across all 4 pages. */
document.querySelectorAll('.nav-drop').forEach(drop => {
  const trigger = drop.querySelector(':scope > a');
  if(!trigger) return;
  trigger.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-drop.open').forEach(d => { if(d !== drop) d.classList.remove('open'); });
    drop.classList.toggle('open');
  });
});
document.addEventListener('click', e => {
  document.querySelectorAll('.nav-drop.open').forEach(drop => {
    if(!drop.contains(e.target)) drop.classList.remove('open');
  });
});

/* booking modal */
const bookingModal = document.getElementById('bookingModal');
const modalClose = document.getElementById('modalClose');
document.querySelectorAll('.open-booking').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault();
    bookingModal.classList.add('open');
    document.getElementById('bookingForm').style.display='block';
    document.getElementById('bookingSuccess').style.display='none';
  });
});
function closeModal(){ bookingModal.classList.remove('open'); }
modalClose.addEventListener('click', closeModal);
bookingModal.addEventListener('click', e=>{ if(e.target === bookingModal) closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeModal(); });

/* Booking channel: WhatsApp instead of mailto.
   Why: this is a local Indian salon — clients already default to WhatsApp/calling
   a salon, not emailing one. A mailto: link depends on the visitor having a mail
   client configured on that device, which a huge share of mobile visitors don't;
   the request silently fails to send and nobody notices. wa.me works from any
   device with just a browser (opens the app if installed, falls back to
   web.whatsapp.com otherwise), and it's how these customers actually communicate.
   Email is kept as a one-tap fallback link, not the primary path. */
const LOUNGE_PHONES = {
  'Surat': '+919638470000',
  'Ahmedabad (Gulbai Tekra)': '+919638370000',
  'Ahmedabad (Sindhu Bhavan)': '+919638270000',
};

function resolveBookingPhone(lounge){
  return bookingModal.dataset.phone || LOUNGE_PHONES[lounge] || '';
}

/* populate the modal from data attributes on #bookingModal so this exact script
   works unmodified on every page — branch pages set data-email/data-phone/data-branch,
   the home page leaves data-phone empty and resolves it from the lounge dropdown instead */
(function initBookingModal(){
  const email = bookingModal.dataset.email;
  document.getElementById('successMsg').innerHTML =
    `WhatsApp should now open with your request pre-filled — hit send and our team will confirm your slot.`;
  document.getElementById('bookingFallback').innerHTML = email
    ? `Prefer email? Write to <a href="mailto:${email}">${email}</a> instead.`
    : `Prefer email? Find your lounge's address in the <a href="#visit">Locations</a> section below.`;
})();

/* real submission: no backend exists, so this opens WhatsApp with the request
   pre-filled to the right lounge's number — an actual message gets sent to a
   real person, not just a UI fake-out */
document.getElementById('bookForm').addEventListener('submit', e=>{
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[type="text"]').value;
  const clientPhone = form.querySelector('input[type="tel"]').value;
  const loungeField = form.querySelector('select[name="lounge"]');
  const lounge = loungeField ? loungeField.value : bookingModal.dataset.branch;
  const service = form.querySelector('select[name="service"]').value;
  const date = form.querySelector('input[type="date"]').value;

  const salonPhone = resolveBookingPhone(lounge).replace(/[^\d]/g,''); // wa.me needs digits only
  const message = encodeURIComponent(
    `Hi CHER! I'd like to book an appointment.\n\nName: ${name}\nPhone: ${clientPhone}\nLounge: ${lounge}\nService: ${service}\nPreferred date: ${date}`
  );
  if(salonPhone){
    window.open(`https://wa.me/${salonPhone}?text=${message}`, '_blank', 'noopener');
  }
  document.getElementById('bookingForm').style.display='none';
  document.getElementById('bookingSuccess').style.display='block';
});

/* newsletter — inline confirmation, no backend */
const newsletterForm = document.getElementById('newsletterForm');
newsletterForm.addEventListener('submit', e=>{
  e.preventDefault();
  newsletterForm.classList.add('sent');
  document.getElementById('newsletterNote').classList.add('show');
});

/* preloader — with a hard fallback so a throttled/backgrounded tab can never
   leave a visitor stuck on a black screen forever. GSAP's ticker relies on
   requestAnimationFrame, which browsers freeze almost completely when a tab
   isn't the visible/active one (e.g. opened in a background tab, or the
   device throttles it) — without this, the reveal tween could stall
   indefinitely and the whole site would just never appear. */
let siteRevealed = false;
function revealSite(){
  if(siteRevealed) return;
  siteRevealed = true;
  const preloaderEl = document.getElementById('preloader');
  if(preloaderEl) preloaderEl.style.display = 'none';
  playHero();
}

window.addEventListener('load', () => {
  const bar = document.querySelector('#preloader .bar span');
  const pct = document.querySelector('#preloader .pct');
  let p = {v:0};
  gsap.to(p,{v:100,duration:1.8,ease:'power2.inOut',onUpdate:()=>{
    bar.style.width = p.v+'%';
    pct.textContent = Math.round(p.v)+'%';
  },onComplete:()=>{
    gsap.to('#preloader',{yPercent:-100,duration:1,ease:'power4.inOut',delay:.15,onComplete:revealSite});
  }});
});

/* safety net: force the site visible after 4s no matter what state the
   preloader animation is in — a backgrounded/throttled tab should never
   be a single point of failure for content actually showing up */
setTimeout(revealSite, 4000);

function playHero(){
  const tl = gsap.timeline({defaults:{ease:'power4.out'}});
  tl.to('.hero-bg img',{clipPath:'circle(75% at 50% 45%)',duration:2.2,ease:'power3.out'},0)
    .to('.eyebrow-pill',{opacity:1,duration:.8},.1)
    .to('.hero h1 .line span',{yPercent:0,duration:1.1,stagger:.12},'-=.4')
    .to('.hero p.sub',{opacity:1,duration:1},'-=.6')
    .to('.hero-chips',{opacity:1,duration:1},'-=.7')
    .to('.hero-cta',{opacity:1,duration:1},'-=.7')
    .to('.hero-badge',{opacity:1,duration:1,stagger:.15},'-=.8')
    .to('.scroll-cue',{opacity:1,duration:1},'-=.6')
    .add(animateCounters,'-=.6');

  gsap.fromTo('.chip',{y:16,opacity:0},{y:0,opacity:1,duration:.7,stagger:.08,delay:1.9,ease:'power3.out'});
}

/* animated counters in hero badges */
function animateCounters(){
  document.querySelectorAll('.counter').forEach(el=>{
    const target = parseFloat(el.dataset.target);
    const decimal = parseInt(el.dataset.decimal || 0);
    const suffix = el.dataset.suffix || '';
    let obj = {v:0};
    gsap.to(obj,{v:target,duration:1.8,ease:'power2.out',onUpdate:()=>{
      el.textContent = obj.v.toFixed(decimal) + suffix;
    }});
  });
}

/* scroll progress ring in hero cue */
gsap.to('.cue-ring .prog',{
  strokeDashoffset:0,ease:'none',
  scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}
});
gsap.to('.scroll-cue',{opacity:0,scrollTrigger:{trigger:'.hero',start:'top top',end:'40% top',scrub:true}});

/* mouse parallax across hero — skipped on touch, where there's no pointer to track */
const heroSection = document.querySelector('.hero');
if(heroSection && hasHover){
  heroSection.addEventListener('mousemove', e=>{
    const r = heroSection.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - 0.5;
    const py = (e.clientY - r.top)/r.height - 0.5;
    gsap.to('.hero-bg img',{x:px*30,y:py*20,duration:1,ease:'power2.out'});
    gsap.to('.hero-glow',{left:e.clientX - r.left,top:e.clientY - r.top,duration:.6,ease:'power2.out'});
    gsap.to('.badge-legacy',{x:px*-16,y:py*-12,duration:.8,ease:'power2.out'});
    gsap.to('.badge-clients',{x:px*16,y:py*12,duration:.8,ease:'power2.out'});
    gsap.to('h1',{x:px*-10,y:py*-6,duration:1,ease:'power2.out'});
  });
  heroSection.addEventListener('mouseleave', ()=>{
    gsap.to(['.hero-bg img','.badge-legacy','.badge-clients','h1'],{x:0,y:0,duration:1,ease:'power3.out'});
  });
}

/* custom cursor — only on devices with a real pointer; on touch it's dead weight */
if(hasHover){
  const cursor = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  let mx=0,my=0,rx=0,ry=0;
  window.addEventListener('mousemove', e=>{
    mx=e.clientX; my=e.clientY;
    cursor.style.left=mx+'px'; cursor.style.top=my+'px';
  });
  gsap.ticker.add(()=>{
    rx += (mx-rx)*0.14; ry += (my-ry)*0.14;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
  });
  document.querySelectorAll('a,button,input,select,.svc-card,.g-item,.testi-card,.chip,.hero-badge,.team-card').forEach(el=>{
    el.addEventListener('mouseenter',()=>ring.classList.add('big'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('big'));
  });
} else {
  document.querySelector('.cursor').style.display='none';
  document.querySelector('.cursor-ring').style.display='none';
}

/* header shrink on scroll */
ScrollTrigger.create({
  start: 50,
  onUpdate: self => {
    document.querySelector('header').style.padding = self.direction === 1 || window.scrollY>50 ? '10px 24px' : '14px 26px';
  }
});

/* parallax blobs */
gsap.to('.blob1',{y:150,x:60,scrollTrigger:{trigger:'body',start:'top top',end:'bottom bottom',scrub:1}});
gsap.to('.blob2',{y:-120,x:-40,scrollTrigger:{trigger:'body',start:'top top',end:'bottom bottom',scrub:1}});
gsap.to('.blob3',{y:100,x:-80,scrollTrigger:{trigger:'body',start:'top top',end:'bottom bottom',scrub:1}});

/* generic reveal */
document.querySelectorAll('.reveal').forEach(el=>{
  gsap.to(el,{
    opacity:1,y:0,duration:1.2,ease:'power3.out',
    scrollTrigger:{trigger:el,start:'top 88%'}
  });
});

/* about image scale-in */
gsap.to('.about-img img',{
  scale:1,duration:1.6,ease:'power3.out',
  scrollTrigger:{trigger:'.about-img',start:'top 80%'}
});

/* stagger service cards */
gsap.utils.toArray('.svc-card').forEach((c,i)=>{
  gsap.to(c,{opacity:1,y:0,duration:1,delay:i*0.06,ease:'power3.out',
    scrollTrigger:{trigger:c,start:'top 90%'}});
});

/* magnetic buttons + card tilt — pointer-only, both are no-ops without a mouse */
if(hasHover){
  document.querySelectorAll('.btn,.nav-cta').forEach(btn=>{
    btn.addEventListener('mousemove', e=>{
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      gsap.to(btn,{x:x*0.3,y:y*0.4,duration:.4,ease:'power2.out'});
    });
    btn.addEventListener('mouseleave', ()=> gsap.to(btn,{x:0,y:0,duration:.5,ease:'elastic.out(1,0.4)'}));
  });

  document.querySelectorAll('.svc-card').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX-r.left)/r.width - 0.5;
      const py = (e.clientY-r.top)/r.height - 0.5;
      gsap.to(card,{rotateY:px*8,rotateX:-py*8,duration:.5,ease:'power2.out',transformPerspective:800});
    });
    card.addEventListener('mouseleave', ()=> gsap.to(card,{rotateY:0,rotateX:0,duration:.6,ease:'power3.out'}));
  });
}
