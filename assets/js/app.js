let q=(s,c=document)=>c.querySelector(s),qa=(s,c=document)=>[...c.querySelectorAll(s)];
function filterChapters(){let k=(q('#q')?.value||'').toLowerCase().trim();let nk=normalizeVietnamese(k);qa('#grid .card').forEach(c=>{let t=normalizeVietnamese(c.textContent.toLowerCase());c.style.display=(!k||t.includes(nk))?'':'none'});let n=qa('#grid .card').filter(c=>c.style.display!=='none').length;let e=q('#count');if(e)e.textContent=n+'/9 chương';}
function normalizeVietnamese(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');}
document.addEventListener('DOMContentLoaded',()=>{q('#q')?.addEventListener('input',filterChapters);filterChapters();let y=q('#year');if(y)y.textContent=new Date().getFullYear();
// Lightbox for slide galleries
qa('.slide-grid figure img').forEach(img=>{img.closest('figure').style.cursor='zoom-in';img.closest('figure').addEventListener('click',ev=>{ev.preventDefault();let lb=document.createElement('div');lb.className='lightbox';lb.innerHTML='<img src="'+img.src+'" alt=""><figcaption>'+(img.alt||'')+'</figcaption>';lb.addEventListener('click',()=>lb.remove());document.addEventListener('keydown',function esc(e){if(e.key==='Escape'){lb.remove();document.removeEventListener('keydown',esc);}});document.body.appendChild(lb);});});});
function toggleToc(){document.body.classList.toggle('toc-open')}
