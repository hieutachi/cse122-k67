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
  let toc=q('.lesson-toc',lesson);if(toc&&matchMedia('(max-width: 720px)').matches)toc.open=false;
  let size=100;try{size=parseInt(localStorage.getItem('cse122-font')||'100',10)||100;}catch(e){}
  let apply=()=>{lesson.style.fontSize=(17.5*size/100).toFixed(1)+'px';};
  apply();
  qa('[data-font]').forEach(b=>b.addEventListener('click',()=>{
    size=Math.min(130,Math.max(85,size+(b.getAttribute('data-font')==='inc'?8:-8)));
    try{localStorage.setItem('cse122-font',String(size));}catch(e){}apply();
  }));
  let file=location.pathname.split('/').pop();
  let key='cse122-done';
  let get=()=>readDoneLessons();
  let btn=q('[data-done-toggle]');
  let paint=()=>{let done=get().includes(file);if(btn){btn.setAttribute('aria-pressed',done?'true':'false');btn.textContent=done?'✓ Đã học — bấm để bỏ đánh dấu':'Đánh dấu đã học ✓';}};
  paint();
  if(btn)btn.addEventListener('click',()=>{let d=get();let i=d.indexOf(file);if(i>=0)d.splice(i,1);else d.push(file);try{localStorage.setItem(key,JSON.stringify(d));}catch(e){toast('Không lưu được tiến độ. Hãy kiểm tra quyền lưu trữ của trình duyệt.');return;}paint();updateLessonProgress();toast(i>=0?'Đã bỏ đánh dấu':'Tuyệt! Đã ghi nhận tiến độ');});
  let cp=q('[data-copylink]');if(cp)cp.addEventListener('click',()=>copyText(location.href,cp,'Đã copy link bài ✓'));
  let links=qa('.lesson-toc a');if(links.length&&'IntersectionObserver' in window){
    let map={};links.forEach(a=>map[a.getAttribute('href').slice(1)]=a);
    let obs=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){links.forEach(a=>a.classList.remove('active'));let a=map[en.target.id];if(a)a.classList.add('active');}});},{rootMargin:'-20% 0px -70% 0px'});
    Object.keys(map).forEach(id=>{let h=document.getElementById(id);if(h)obs.observe(h);});
  }
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||LB.el?.isConnected)return;
    if(document.activeElement?.closest('input,textarea,select,button,a,summary,[contenteditable]'))return;
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
      let nav=q('[data-prevnext]');if(!nav)return;
      let t=q(e.key==='ArrowRight'?'a[rel="next"]':'a[rel="prev"]',nav);
      if(t&&t.getAttribute('href')){e.preventDefault();location.href=t.getAttribute('href');}
    }
  });
}
function readDoneLessons(){
  try{let value=JSON.parse(localStorage.getItem('cse122-done')||'[]');return Array.isArray(value)?[...new Set(value.filter(v=>typeof v==='string'))]:[];}catch(e){return[];}
}
function updateLessonProgress(){
  let box=q('#lesson-progress');if(!box)return;
  let done=readDoneLessons(),items=qa('.lesson-list li');
  let count=items.filter(li=>done.includes(li.getAttribute('data-lesson'))).length;
  box.textContent='Bạn đã tự đánh dấu đã học '+count+'/'+items.length+' bài. Tiến độ chỉ lưu trên trình duyệt này, không phải điểm đánh giá.';
  items.forEach(li=>li.classList.toggle('done',done.includes(li.getAttribute('data-lesson'))));
}
function validResume(value){
  return value&&typeof value.path==='string'&&/^(ebook\/chuong-[1-9]|baidoc\/(?:0[1-9]|1[0-3])-[a-z0-9-]+)\.html$/.test(value.path);
}
function initLastLesson(){
  let key='cse122-resume-v1',saved=null;
  let root=new URL('../../',q('script[src*="assets/js/app.js"]').src);
  let current=location.pathname.slice(root.pathname.length);
  try{
    try{saved=JSON.parse(localStorage.getItem(key)||'null');}catch(e){}
    if(!validResume(saved)){
      let lesson=localStorage.getItem('cse122-last-lesson'),chapter=localStorage.getItem('cse122-last');
      // Legacy keys had no timestamps: prefer an actual lesson, never the index.
      let oldLesson={path:'baidoc/'+lesson+'.html'},oldChapter={path:'ebook/'+chapter+'.html'};
      saved=validResume(oldLesson)?oldLesson:validResume(oldChapter)?oldChapter:null;
    }
    if(validResume({path:current}))saved={path:current,title:q('h1')?.textContent.trim()||''};
    if(validResume(saved))localStorage.setItem(key,JSON.stringify(saved));
  }catch(e){}
  qa('[data-last-lesson]').forEach(link=>{
    if(!validResume(saved)||saved.path===current)return;
    link.href=new URL(saved.path,root).href;
    let label=typeof saved.title==='string'&&saved.title?saved.title:(saved.path.startsWith('ebook/')?'Chương '+saved.path.match(/\d+/)[0]:'bài đọc gần nhất');
    q('span',link).textContent='Tiếp tục học: '+label;link.classList.remove('hidden');
  });
}
function initSearchHotkey(){
  document.addEventListener('keydown',e=>{
    if(e.defaultPrevented||LB.el?.isConnected||e.altKey||e.ctrlKey||e.metaKey)return;
    if(e.key==='/'&&!document.activeElement?.closest('input,textarea,select,[contenteditable]')){
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
const LB={items:[],idx:0,zoom:false,el:null,img:null,cap:null,cnt:null,keyHandler:null,trigger:null,overflow:'',background:[]};
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
  document.body.style.overflow=LB.overflow;
  if(LB.keyHandler)document.removeEventListener('keydown',LB.keyHandler);
  LB.background.forEach(([el,inert])=>el.inert=inert);LB.background=[];
  if(LB.trigger?.isConnected)LB.trigger.focus();
}
function lbOpen(items,idx,trigger=document.activeElement){
  if(!items.length)return;
  if(!LB.el?.isConnected){
    LB.trigger=trigger;LB.overflow=document.body.style.overflow;
    LB.background=[...document.body.children].map(el=>[el,el.inert]);
    LB.background.forEach(([el])=>el.inert=true);
  }
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
    LB.keyHandler=e=>{
      if(e.altKey||e.ctrlKey||e.metaKey)return;
      if(e.key==='Tab'){
        let buttons=qa('button',LB.el),first=buttons[0],last=buttons[buttons.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        return;
      }
      if(e.key==='Escape'){e.preventDefault();lbClose();}
      else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();lbNav(-1);}
      else if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();lbNav(1);}
      else if(e.key===' '&&document.activeElement.tagName!=='BUTTON'){e.preventDefault();lbNav(1);}
    };
  }
  document.addEventListener('keydown',LB.keyHandler);
  lbRender();document.body.appendChild(LB.el);document.body.style.overflow='hidden';
  let cl=LB.el.querySelector('.lb-close');if(cl)cl.focus();
}
function initLightbox(){
  qa('.slide-grid').forEach(grid=>{
    let figs=qa('figure',grid);if(!figs.length)return;
    let items=figs.map(f=>{let im=q('img',f);return{src:im.src,alt:im.alt,cap:(q('figcaption',f)||{}).textContent||''};});
    figs.forEach((f,i)=>{f.style.cursor='zoom-in';f.setAttribute('tabindex','0');f.setAttribute('role','button');f.setAttribute('aria-label','Xem slide '+(items[i].cap||i+1));f.addEventListener('click',ev=>{ev.preventDefault();lbOpen(items,i,f);});f.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();lbOpen(items,i,f);}});});
  });
}
function quizOptions(item,random=Math.random){
  let options=item.opts.map((text,index)=>({text,correct:index===item.a}));
  for(let i=options.length-1;i>0;i--){let j=Math.floor(random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
  return options;
}
function quizElement(tag,className,text){
  let el=document.createElement(tag);if(className)el.className=className;
  if(text!==undefined)el.textContent=text;return el;
}
async function initQuiz(){
  let panel=q('#quiz');if(!panel)return;
  let ch=panel.getAttribute('data-chapter'),body=q('#quiz-body',panel);
  let depth=location.pathname.includes('/ebook/')?'../':'';
  body.replaceChildren(quizElement('p','meta','Đang tải câu hỏi…'));
  try{
    let response=await fetch(depth+'data/quiz.json');if(!response.ok)throw new Error('Quiz HTTP '+response.status);
    let d=await response.json(),qs=(d.chapters||{})[ch];
    if(!Array.isArray(qs)||!qs.length){body.replaceChildren(quizElement('p','meta','Chưa có câu hỏi cho chương này.'));return;}
    let render=(focus=false)=>{
      let score=0,done=0,total=qs.length;body.replaceChildren();
      qs.forEach((item,qi)=>{
        let box=quizElement('div','quiz-q'),title=quizElement('p','quiz-qt','Câu '+(qi+1)+'. '+item.q);
        title.id='quiz-q-'+qi;box.setAttribute('role','group');box.setAttribute('aria-labelledby',title.id);
        let options=quizOptions(item),opts=quizElement('div','quiz-opts');
        let btns=options.map((option,index)=>{
          let button=quizElement('button','',String.fromCharCode(65+index)+'. '+option.text);button.type='button';opts.appendChild(button);return button;
        });
        let explanation=quizElement('div','quiz-explanation');explanation.setAttribute('role','status');
        box.append(title,opts,explanation);
        btns.forEach((b,index)=>b.addEventListener('click',()=>{
          if(box.classList.contains('answered'))return;
          box.classList.add('answered');
          let correctIndex=options.findIndex(option=>option.correct),correct=options[index].correct;
          btns[correctIndex].classList.add('correct');
          btns.forEach(button=>button.setAttribute('aria-disabled','true'));
          if(!correct)b.classList.add('wrong');else score++;
          explanation.appendChild(quizElement('p','', (correct?'Đúng. ':'Chưa đúng. ')+'Đáp án: '+String.fromCharCode(65+correctIndex)+'. '+options[correctIndex].text));
          explanation.appendChild(quizElement('p','',item.explanation));
          let review=quizElement('a','','Đọc lại: '+item.review.label);review.href=item.review.href;explanation.appendChild(review);
          done++;
          if(done===total){
            let fb=quizElement('div','quiz-feedback '+(score===total?'all':''),'Kết quả: '+score+'/'+total+'. '+(score===total?'Bạn đã trả lời đúng bộ câu hỏi này. Hãy thử bài thực hành để củng cố.':'Đọc giải thích và các mục liên quan trước khi thử lại nhé.'));
            fb.setAttribute('role','status');body.appendChild(fb);
            let re=quizElement('button','quiz-retry','Làm lại ↻');re.type='button';
            re.addEventListener('click',()=>render(true));body.appendChild(re);
            try{localStorage.setItem('cse122-quiz-'+ch,score+'/'+total);}catch(e){}
          }
        }));
        body.appendChild(box);
      });
      if(focus)q('button',body)?.focus();
    };render();
  }catch(e){
    let message=quizElement('p','meta','Không tải được câu hỏi. Kiểm tra kết nối rồi thử lại.');message.setAttribute('role','alert');
    let retry=quizElement('button','quiz-retry','Tải lại câu hỏi');retry.type='button';retry.addEventListener('click',initQuiz);
    body.replaceChildren(message,retry);
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  initChrome();
  q('#q')?.addEventListener('input',filterChapters);filterChapters();updateLessonProgress();
  let y=q('#year');if(y)y.textContent=new Date().getFullYear();
  initLightbox();initProgress();initCopyCode();initBackToTop();initLesson();initLastLesson();initSearchHotkey();initQuiz();initReveal();
});
function toggleToc(){document.body.classList.toggle('toc-open');}
