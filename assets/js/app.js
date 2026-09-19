let q=(s,c=document)=>c.querySelector(s),qa=(s,c=document)=>[...c.querySelectorAll(s)];
function filterChapters(){let k=(q('#q')?.value||'').toLowerCase().trim();qa('#grid .card').forEach(c=>{c.style.display=(!k||c.textContent.toLowerCase().includes(k))?'':'none'});let n=qa('#grid .card').filter(c=>c.style.display!=='none').length;let e=q('#count');if(e)e.textContent=n+'/9 chương';}
document.addEventListener('DOMContentLoaded',()=>{q('#q')?.addEventListener('input',filterChapters);filterChapters();let y=q('#year');if(y)y.textContent=new Date().getFullYear();});
function toggleToc(){document.body.classList.toggle('toc-open')}
