'use strict';
let q=(s,c=document)=>c.querySelector(s),qa=(s,c=document)=>[...c.querySelectorAll(s)];
function toast(msg){let t=q('.toast');if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);}t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200);}
function normVn(s){return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');}
function filterChapters(){
  let inp=q('#q');if(!inp)return;
  let k=inp.value.toLowerCase().trim(),nk=normVn(k);
  let cards=qa('#grid .card'),items=qa('.lesson-list li');
  let targets=cards.length?cards:items;
  targets.forEach(el=>{let t=normVn(el.textContent.toLowerCase());el.style.display=(!k||t.includes(nk))?'':'none';});
  qa('.lesson-mod').forEach(m=>{let vis=qa('li',m).some(li=>li.style.display!=='none');m.style.display=vis?'':'none';});
  qa('.lesson-ch').forEach(ch=>{let vis=qa('.lesson-mod',ch).some(m=>m.style.display!=='none');ch.style.display=(k&&!vis)?'none':'';});
  let n=targets.filter(el=>el.style.display!=='none').length;
  let e=q('#count');if(e)e.textContent=k?(n+' kết quả'):((cards.length?n+'/9 chương':n+' bài'));
}
function initChrome(){
  let bar=q('.topbar');
  let onScroll=()=>{if(bar)bar.classList.toggle('scrolled',window.scrollY>8);};
  document.addEventListener('scroll',onScroll,{passive:true});onScroll();
  let path=location.pathname.replace(/\\/g,'/');
  qa('.nav a').forEach(a=>{
    let href=a.getAttribute('href')||'';
    if(path.endsWith('/'+href)||path.endsWith(href))a.setAttribute('aria-current','page');
  });
}
function initProgress(){
  let bar=q('#readbar');if(!bar)return;let tick=false;
  let up=()=>{tick=false;let h=document.documentElement;let max=h.scrollHeight-h.clientHeight;bar.style.width=(max>0?(h.scrollTop/max*100):0)+'%';};
  document.addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(up);}},{passive:true});up();
}
async function copyText(t,btn,okMsg){
  try{await navigator.clipboard.writeText(t);let o=btn.textContent;btn.textContent=okMsg||'Đã copy ✓';toast(okMsg||'Đã sao chép');setTimeout(()=>btn.textContent=o,1800);}
  catch(e){let ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Đã sao chép');}catch(_){toast('Không sao chép được');}ta.remove();}
}
function initCopyCode(){
  qa('pre').forEach(pre=>{
    if(q('.copy-btn',pre.parentNode))return;
    let btn=document.createElement('button');btn.className='copy-btn';btn.type='button';btn.textContent='Copy';
    btn.setAttribute('aria-label','Sao chép đoạn code');
    btn.addEventListener('click',()=>copyText(pre.innerText,btn));
    if(getComputedStyle(pre.parentNode).position==='static')pre.parentNode.style.position='relative';
    pre.parentNode.appendChild(btn);
  });
  qa('.prompt-card').forEach(card=>{
    if(q('.copy-prompt',card))return;
    let btn=document.createElement('button');btn.className='copy-prompt';btn.type='button';btn.textContent='Copy prompt';
    btn.addEventListener('click',()=>copyText(card.innerText.replace('Copy prompt','').trim(),btn,'Đã copy prompt ✓'));
    card.appendChild(btn);
  });
}
function initBackToTop(){
  let b=q('#totop');if(!b)return;
  let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('scroll',()=>{b.classList.toggle('show',window.scrollY>400)},{passive:true});
  b.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'}));
}
function initLesson(){
  let lesson=q('.lesson');if(!lesson)return;
  let size=100;try{size=parseInt(localStorage.getItem('cse122-font')||'100',10)||100;}catch(e){}
  let apply=()=>{lesson.style.fontSize=(17.5*size/100).toFixed(1)+'px';};
  apply();
  qa('[data-font]').forEach(b=>b.addEventListener('click',()=>{
    size=Math.min(130,Math.max(85,size+(b.getAttribute('data-font')==='inc'?8:-8)));
    try{localStorage.setItem('cse122-font',String(size));}catch(e){}apply();
  }));
  let file=location.pathname.split('/').pop();
  let key='cse122-done';
  let get=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]');}catch(e){return[];}};
  let btn=q('[data-done-toggle]');
  let paint=()=>{let done=get().includes(file);if(btn){btn.setAttribute('aria-pressed',done?'true':'false');btn.textContent=done?'✓ Đã học — bấm để bỏ đánh dấu':'Đánh dấu đã học ✓';}};
  paint();
  if(btn)btn.addEventListener('click',()=>{let d=get();let i=d.indexOf(file);if(i>=0)d.splice(i,1);else d.push(file);try{localStorage.setItem(key,JSON.stringify(d));}catch(e){}paint();updateLessonProgress();toast(i>=0?'Đã bỏ đánh dấu':'Tuyệt! Đã ghi nhận tiến độ');});
  let cp=q('[data-copylink]');if(cp)cp.addEventListener('click',()=>copyText(location.href,cp,'Đã copy link bài ✓'));
  let links=qa('.lesson-toc a');if(links.length&&'IntersectionObserver' in window){
    let map={};links.forEach(a=>map[a.getAttribute('href').slice(1)]=a);
    let obs=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){links.forEach(a=>a.classList.remove('active'));let a=map[en.target.id];if(a)a.classList.add('active');}});},{rootMargin:'-20% 0px -70% 0px'});
    Object.keys(map).forEach(id=>{let h=document.getElementById(id);if(h)obs.observe(h);});
  }
  document.addEventListener('keydown',e=>{
    if(/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      let nav=q('[data-prevnext]');if(!nav)return;
      let la=qa('a',nav);let t=e.key==='ArrowRight'?la[la.length-1]:la[0];
      if(t&&t.getAttribute('href'))location.href=t.getAttribute('href');
    }
  });
}
function updateLessonProgress(){
  let box=q('#lesson-progress');if(!box)return;
  let done=[];try{done=JSON.parse(localStorage.getItem('cse122-done')||'[]');}catch(e){}
  let total=qa('.lesson-list li').length||64;
  box.textContent=done.length?('Bạn đã hoàn thành '+done.length+'/'+total+' bài — cố lên nhé!'):'Mỗi bài chỉ 3–8 phút — đánh dấu đã học để theo dõi tiến độ.';
  qa('.lesson-list li').forEach(li=>{let f=li.getAttribute('data-lesson');if(f&&done.includes(f))li.classList.add('done');});
}
function initLastLesson(){
  let m=location.pathname.match(/ebook\/(chuong-\d+)\.html/);
  let lm=location.pathname.match(/baidoc\/(.+)\.html/);
  try{
    if(m)localStorage.setItem('cse122-last',m[1]);
    if(lm)localStorage.setItem('cse122-last-lesson',lm[1]);
  }catch(e){}
  let link=q('[data-last-lesson]');
  if(link){
    let slug=null,ll=null;try{slug=localStorage.getItem('cse122-last');ll=localStorage.getItem('cse122-last-lesson');}catch(e){}
    let cur=location.pathname.split('/').pop();
    if(ll&&ll+'.html'!==cur&&location.pathname.includes('baidoc')){
      link.href=ll+'.html';link.querySelector('span').textContent='Tiếp tục bài: '+ll.replace(/-/g,' ').slice(0,40)+'…';link.classList.remove('hidden');
    }else if(slug&&slug+'.html'!==cur){
      let onIndex=!location.pathname.includes('ebook/');
      link.href=(onIndex?'ebook/':'')+slug+'.html';
      link.querySelector('span').textContent='Tiếp tục học: Chương '+slug.replace('chuong-','');
      link.classList.remove('hidden');
    }
  }
}
function initSearchHotkey(){
  document.addEventListener('keydown',e=>{
    if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){
      let s=q('#q');if(s){e.preventDefault();s.focus();s.select();}
    }
  });
}
function toggleToc(){document.body.classList.toggle('toc-open');}
function initReveal(){
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let obs=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');obs.unobserve(en.target);}});},{threshold:.08});
  qa('.card,.lesson-ch,.quiz-panel').forEach(el=>{el.classList.add('reveal');obs.observe(el);});
}
const LB={items:[],idx:0,zoom:false,el:null,img:null,cap:null,cnt:null,keyHandler:null};
function lbRender(){
  let it=LB.items[LB.idx];if(!it)return;
  LB.img.src=it.src;LB.img.alt=it.alt||'';
  LB.cap.textContent=it.cap||it.alt||'';
  LB.cnt.textContent=(LB.idx+1)+'/'+LB.items.length;
  LB.el.classList.toggle('zoomed',LB.zoom);
}
function lbNav(d){LB.idx=(LB.idx+d+LB.items.length)%LB.items.length;LB.zoom=false;lbRender();let n=LB.items[(LB.idx+1)%LB.items.length];if(n){let im=new Image();im.src=n.src;}}
function lbClose(){
  if(LB.el&&LB.el.parentNode)LB.el.remove();
  document.body.style.overflow='';
  if(LB.keyHandler){document.removeEventListener('keydown',LB.keyHandler);LB.keyHandler=null;}
}
function lbOpen(items,idx){
  LB.items=items;LB.idx=idx;LB.zoom=false;
  if(!LB.el){
    LB.el=document.createElement('div');LB.el.className='lightbox';LB.el.setAttribute('role','dialog');LB.el.setAttribute('aria-modal','true');LB.el.setAttribute('aria-label','Xem ảnh lớn');
    LB.el.innerHTML='<button class="lb-btn lb-close" aria-label="Đóng">×</button>'+
      '<button class="lb-btn lb-prev" aria-label="Ảnh trước">‹</button>'+
      '<img src="" alt=""><div class="lb-zoom-hint">Cuộn chuột / nhấp đôi để phóng to — Esc để đóng</div>'+
      '<button class="lb-btn lb-next" aria-label="Ảnh sau">›</button>'+
      '<div class="lb-counter"></div><div class="lb-caption"></div>';
    LB.img=LB.el.querySelector('img');LB.cap=LB.el.querySelector('.lb-caption');LB.cnt=LB.el.querySelector('.lb-counter');
    LB.el.querySelector('.lb-close').addEventListener('click',e=>{e.stopPropagation();lbClose();});
    LB.el.querySelector('.lb-prev').addEventListener('click',e=>{e.stopPropagation();lbNav(-1);});
    LB.el.querySelector('.lb-next').addEventListener('click',e=>{e.stopPropagation();lbNav(1);});
    LB.el.addEventListener('click',e=>{if(e.target===LB.el)lbClose();});
    LB.img.addEventListener('dblclick',e=>{e.preventDefault();LB.zoom=!LB.zoom;LB.el.classList.toggle('zoomed',LB.zoom);});
    LB.el.addEventListener('wheel',e=>{e.preventDefault();LB.zoom=e.deltaY<0;LB.el.classList.toggle('zoomed',LB.zoom);},{passive:false});
    let tx=null;
    LB.el.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});
    LB.el.addEventListener('touchend',e=>{if(tx===null)return;let dx=e.changedTouches[0].clientX-tx;tx=null;if(Math.abs(dx)>50)lbNav(dx<0?1:-1);},{passive:true});
    LB.keyHandler=e=>{if(e.key==='Escape')lbClose();else if(e.key==='ArrowLeft'||e.key==='PageUp')lbNav(-1);else if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' ')lbNav(1);};
    document.addEventListener('keydown',LB.keyHandler);
  }
  lbRender();document.body.appendChild(LB.el);document.body.style.overflow='hidden';
  let cl=LB.el.querySelector('.lb-close');if(cl)cl.focus();
}
function initLightbox(){
  qa('.slide-grid').forEach(grid=>{
    let figs=qa('figure',grid);if(!figs.length)return;
    let items=figs.map(f=>{let im=q('img',f);return{src:im.src,alt:im.alt,cap:(q('figcaption',f)||{}).textContent||''};});
    figs.forEach((f,i)=>{f.style.cursor='zoom-in';f.setAttribute('tabindex','0');f.setAttribute('role','button');f.setAttribute('aria-label','Xem ảnh '+(i+1));f.addEventListener('click',ev=>{ev.preventDefault();lbOpen(items,i);});f.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();lbOpen(items,i);}});});
  });
}
function initQuiz(){
  let panel=q('#quiz');if(!panel)return;
  let ch=panel.getAttribute('data-chapter');
  let depth=location.pathname.includes('/ebook/')?'../':'';
  fetch(depth+'data/quiz.json').then(r=>r.json()).then(d=>{
    let qs=(d.chapters||{})[ch];let body=q('#quiz-body',panel);
    if(!qs||!qs.length){body.innerHTML='<p class="meta">Chưa có câu hỏi cho chương này.</p>';return;}
    let render=()=>{
      let score=0,done=0,total=qs.length;body.innerHTML='';
      qs.forEach((item,qi)=>{
        let box=document.createElement('div');box.className='quiz-q';
        let opts=item.opts.map((o,oi)=>'<button type="button" data-oi="'+oi+'">'+String.fromCharCode(65+oi)+'. '+o+'</button>').join('');
        box.innerHTML='<p class="quiz-qt">Câu '+(qi+1)+'. '+item.q+'</p><div class="quiz-opts">'+opts+'</div>';
        let btns=qa('button',box);
        btns.forEach(b=>b.addEventListener('click',()=>{
          if(box.classList.contains('answered'))return;
          box.classList.add('answered');
          let oi=+b.getAttribute('data-oi');
          btns[+item.a].classList.add('correct');
          if(oi!==+item.a)b.classList.add('wrong');else score++;
          done++;
          if(done===total){
            let fb=document.createElement('div');fb.className='quiz-feedback '+(score===total?'all':'');
            fb.innerHTML='<strong>Kết quả: '+score+'/'+total+'.</strong> '+(score===total?'Xuất sắc! Bạn nắm chắc chương này.':'Xem lại phần sai, sau đó cuộn xuống slide trực quan để củng cố nhé.');
            body.appendChild(fb);
            let re=document.createElement('button');re.className='quiz-retry';re.type='button';re.textContent='Làm lại ↻';
            re.addEventListener('click',render);body.appendChild(re);
            try{localStorage.setItem('cse122-quiz-'+ch,score+'/'+total);}catch(e){}
          }
        }));
        body.appendChild(box);
      });
    };render();
  }).catch(()=>{let b=q('#quiz-body',panel);if(b)b.innerHTML='<p class="meta">Không tải được câu hỏi.</p>';});
}
document.addEventListener('DOMContentLoaded',()=>{
  initChrome();
  q('#q')?.addEventListener('input',filterChapters);filterChapters();updateLessonProgress();
  let y=q('#year');if(y)y.textContent=new Date().getFullYear();
  initLightbox();initProgress();initCopyCode();initBackToTop();initLesson();initLastLesson();initSearchHotkey();initQuiz();initReveal();
});
function toggleToc(){document.body.classList.toggle('toc-open');}
