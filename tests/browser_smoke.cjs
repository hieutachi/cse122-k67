'use strict';
// Real Chromium regression checks via CDP. Node 24 built-ins only; no npm packages.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = process.env.CSE122_BROWSER || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find(p => fs.existsSync(p));
if (!browser) throw new Error('Set CSE122_BROWSER to a Chromium executable.');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png'};
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/cse122-k67/')) {res.writeHead(404).end();return;}
    const relative = pathname.slice('/cse122-k67/'.length) || 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
    const body = await fsp.readFile(file);
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}).end(body);
  } catch {res.writeHead(404).end();}
});

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/cse122-k67/`;
  let ws, send, id = 0, checks = 0;
  const exceptions = [];
  // Launch headless Chromium and wait for its DevTools port. Slow CI runners
  // occasionally need >10s, so allow 30s and retry the whole launch once.
  const launchBrowser = async () => {
    const profile = await fsp.mkdtemp(path.join(os.tmpdir(), 'cse122-browser-'));
    const proc = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], {stdio:['ignore','ignore','pipe']});
    let stderr = '';
    proc.stderr.on('data', chunk => {stderr += chunk;});
    let port;
    for (let i=0; i<300; i++) {
      try {port = (await fsp.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]; break;} catch {await sleep(100);}
    }
    if (!port) {
      try {proc.kill('SIGKILL');} catch {}
      await fsp.rm(profile, {recursive:true, force:true}).catch(() => {});
      throw new Error('Browser debugging port not started within 30s. stderr: ' + stderr.slice(-1500));
    }
    return {proc, profile, port};
  };
  let proc = null, profile = null;
  try {
    let launched;
    try {launched = await launchBrowser();}
    catch (firstError) {console.error('First browser launch failed:', firstError.message); launched = await launchBrowser();}
    proc = launched.proc; profile = launched.profile;
    const port = launched.port;
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve,reject) => {ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
    const pending = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
      if (message.id && pending.has(message.id)) {
        const {resolve,reject,timer} = pending.get(message.id);pending.delete(message.id);clearTimeout(timer);
        message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
      }
    });
    send = (method,params={}) => new Promise((resolve,reject) => {
      const requestId=++id;
      const timer=setTimeout(()=>{pending.delete(requestId);reject(new Error('CDP timeout: '+method));},15000);
      pending.set(requestId,{resolve,reject,timer});ws.send(JSON.stringify({id:requestId,method,params}));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const check = async (expression,label) => {
      const value=await evaluate(expression);
      if(value!==true)console.error('Browser diagnostic:',await evaluate('({url:location.href,active:document.activeElement.outerHTML.slice(0,300),answered:document.querySelectorAll(".answered").length,feedback:document.querySelector(".quiz-feedback")?.textContent})'));
      assert.equal(value,true,label);checks++;
    };
    const wait = async expression => {
      for(let i=0;i<150;i++){if(await evaluate(expression))return;await sleep(100);}
      throw new Error('Page condition timed out: '+expression);
    };
    const navigate = async file => {
      await send('Page.navigate',{url:base+file});
      await wait(`location.href === ${JSON.stringify(base+file)} && document.readyState !== 'loading' && typeof initQuiz === 'function' && document.querySelector('#year')?.textContent !== ''`);
    };
    const key = async (value,modifiers=0) => {
      const code={Enter:13,Tab:9,Escape:27,ArrowLeft:37,ArrowRight:39,PageDown:34,PageUp:33,' ':32}[value] || 0;
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:value,modifiers,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code,...(value==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:value,modifiers,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code});
    };
    const click = async selector => {
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
      await sleep(400); // Let lazy images and reveal transitions settle before physical input.
      const point=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
      await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
    };
    const screenshot = async name => {
      const dir=path.join(root,'.preview');await fsp.mkdir(dir,{recursive:true});
      const image=await send('Page.captureScreenshot',{format:'png'});
      await fsp.writeFile(path.join(dir,name+'.png'),Buffer.from(image.data,'base64'));
    };
    await send('Runtime.enable');await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    const quiz = JSON.parse(await fsp.readFile(path.join(root,'data/quiz.json'),'utf8')).chapters;
    for(let chapter=1;chapter<=9;chapter++) {
      await navigate(`ebook/chuong-${chapter}.html`);await wait('document.querySelectorAll(".quiz-q").length===3');
      await check('document.querySelectorAll(".learning-path li").length===4','Chapter learning route');
      if(chapter<=5) {
        await check('document.querySelectorAll(".chapter-guide .practice-steps li").length>=3 && !!document.querySelector("#chapter-checklist")','Guided practice and acceptance criteria for chapter '+chapter);
        await check('document.querySelector(".learning-path li:nth-child(3) a").hash==="#chapter-practice" && !document.querySelector(".chapter-guide img,.chapter-guide form,.chapter-guide iframe")','Practice route and literal HTML examples for chapter '+chapter);
        await screenshot('desktop-chapter-'+chapter);
      }
      if(chapter===2) await check('[...document.querySelectorAll(".quiz-opts button")].some(b=>b.textContent.endsWith("<img>")) && !document.querySelector(".quiz-opts img")','HTML tag displayed as text');
      const answers=quiz[chapter].map(item=>item.opts[item.a]);
      await evaluate(`(()=>{const answers=${JSON.stringify(answers)};document.querySelectorAll('.quiz-q').forEach((box,i)=>{const button=[...box.querySelectorAll('button')].find(b=>b.textContent.slice(3)===answers[i]);button.click();button.click();});})()`);
      await check(`document.querySelector('.quiz-feedback').textContent.includes('3/3') && localStorage.getItem('cse122-quiz-${chapter}')==='3/3' && document.querySelectorAll('.quiz-explanation a').length===3`,'Correct scoring and feedback across shuffled answers');
      await click('.quiz-retry');
      await check('!document.querySelector(".answered") && !document.querySelector(".quiz-feedback") && document.activeElement===document.querySelector(".quiz-opts button")','Retry resets and restores keyboard focus');
      await evaluate(`(()=>{const answers=${JSON.stringify(answers)};document.querySelectorAll('.quiz-q').forEach((box,i)=>[...box.querySelectorAll('button')].find(b=>b.textContent.slice(3)!==answers[i]).click());})()`);
      await check('document.querySelector(".quiz-feedback").textContent.includes("0/3") && document.querySelectorAll(".wrong").length===3 && document.querySelectorAll(".correct").length===3','Wrong answers score zero and expose correct answer');
    }
    await navigate('ebook/chuong-2.html');await wait('document.querySelectorAll(".quiz-q").length===3');
    await screenshot('desktop-chapter');
    await evaluate(`window.originalFetch=window.fetch;window.fetch=async()=>({ok:true,json:async()=>({chapters:{'2':[{q:'<img src=x onerror="window.quizInjected=1">',opts:['<form>','<svg onload="window.quizInjected=1">','<b>','<script>'],a:0,explanation:'<img src=x onerror="window.quizInjected=1">',review:{href:'chuong-2.html#main',label:'<form>'}}]}})});initQuiz()`);
    await click('.quiz-opts button');
    await check('!window.quizInjected && !document.querySelector("#quiz-body img,#quiz-body svg,#quiz-body form,#quiz-body script,#quiz-body b") && document.querySelector(".quiz-explanation").textContent.includes("<img")','Hostile question/option/explanation text never becomes markup');
    await evaluate('window.fetch=async()=>({ok:false,status:503});initQuiz()');
    await check('!!document.querySelector("#quiz-body [role=alert]") && !!document.querySelector(".quiz-retry")','HTTP failure has accessible retry');
    await evaluate('window.fetch=window.originalFetch');await click('.quiz-retry');await wait('document.querySelectorAll(".quiz-q").length===3');
    await evaluate('document.querySelector(".quiz-opts button").focus()');await key('Enter');
    await check('document.querySelectorAll(".answered").length===1','Quiz can be answered using keyboard');
    await screenshot('desktop-quiz-feedback');

    for(let cycle=0;cycle<3;cycle++) {
      await click('.slide-grid figure');
      await check('document.activeElement.classList.contains("lb-close") && document.querySelector("main").inert','Modal focuses close and makes background inert');
      await key('ArrowRight');await check('LB.idx===1','Arrow navigation after open/reopen');
      await key('PageDown');await check('LB.idx===2','PageDown navigation');
      await key('ArrowLeft');await check('LB.idx===1','ArrowLeft navigation');
      await key('Tab',8);await check('document.activeElement.classList.contains("lb-next")','Shift+Tab stays in modal');
      await key('Tab');await check('document.activeElement.classList.contains("lb-close")','Tab wraps within modal');
      await key('Escape');
      await check('!document.querySelector(".lightbox") && !document.querySelector("main").inert && document.activeElement===document.querySelector(".slide-grid figure")','Close returns focus and restores page');
    }
    const lesson='baidoc/09-javascript-basics-array-methods-c-t-loi.html';
    await evaluate('localStorage.setItem("cse122-done",JSON.stringify(["09-javascript-basics-array-methods-c-t-loi.html"]));localStorage.setItem("cse122-last","chuong-1")');
    await navigate(lesson);
    await check('document.querySelector(".lesson-toc").compareDocumentPosition(document.querySelector(".lesson-body"))&Node.DOCUMENT_POSITION_FOLLOWING ? true:false','TOC precedes body in real DOM');
    await check('document.querySelector("[data-done-toggle]").getAttribute("aria-pressed")==="true"','Legacy completion data retained');
    await evaluate('document.querySelector("[data-done-toggle]").focus()');await key('ArrowRight');
    await check(`location.href===${JSON.stringify(base+lesson)}`,'Lesson arrow shortcut does not hijack focused controls');
    await evaluate('document.querySelector(".lesson-toc summary").focus()');await key('Enter');
    await check('document.querySelector(".lesson-toc").open===false','TOC is keyboard operable');
    await evaluate('Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage blocked")}});undefined');
    await click('[data-done-toggle]');
    await check('document.querySelector(".toast").textContent.includes("Không lưu được")','Blocked storage reports failed save, not false success');
    for(const index of ['baidoc/index.html','index.html','ebook/index.html']) {
      await navigate(index);
      await check(`document.querySelector('[data-last-lesson]').href===${JSON.stringify(base+lesson)} && JSON.parse(localStorage.getItem('cse122-resume-v1')).path===${JSON.stringify(lesson)}`,'Resume preserved across indexes');
    }
    await navigate('ebook/chuong-4.html');await navigate('index.html');
    await check(`document.querySelector('[data-last-lesson]').href===${JSON.stringify(base+'ebook/chuong-4.html')}`,'Most recent chapter replaces older lesson');
    await evaluate('Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage blocked")}});initLastLesson();updateLessonProgress()');

    // Interactive syllabus (demo/de-cuong): rendered from embedded JSON, filters, self-check progress, deep links.
    await navigate('demo/de-cuong/index.html');
    await wait('document.querySelectorAll(".dc-item").length===126');
    await check('document.querySelectorAll(".dc-tab").length===11 && document.querySelectorAll(".dc-sec").length===14 && document.querySelectorAll(".dc-chap").length===9','Syllabus renders 14 sections, 9 chapters and 11 filters');
    await check('new Set([...document.querySelectorAll(".dc-item")].map(e=>e.id)).size===126','Every syllabus chunk has a unique deep-link id');
    await check('document.querySelector("#dccount").textContent.includes("126") && document.querySelector("#dcprogress").textContent.includes("0 / 126")','Chunk count and self-check progress initialised');
    await check('[...document.querySelectorAll(".dc-pill")].every(p=>p.getBoundingClientRect().height<=34)','Chapter pills render as single-line chips');
    await screenshot('desktop-syllabus');
    await click('.dc-tab[data-tab="c8"]');
    await check('[...document.querySelectorAll(".dc-item")].filter(e=>!e.parentNode.hidden).length===8 && document.querySelector("#g-thong-tin").hidden && [...document.querySelectorAll(".dc-chap")].filter(c=>!c.hidden).length===1','Chapter filter isolates chapter 8');
    await click('.dc-tab[data-tab="all"]');
    await check('[...document.querySelectorAll(".dc-item")].filter(e=>!e.parentNode.hidden).length===126','All-chunks filter restores every chunk');
    await evaluate('(()=>{const q=document.querySelector("#dcq");q.value="RUBRIC";q.dispatchEvent(new Event("input"));})()');
    await wait('[...document.querySelectorAll(".dc-item")].filter(e=>!e.parentNode.hidden).length<126');
    await check('[...document.querySelectorAll(".dc-item")].filter(e=>!e.parentNode.hidden).every(e=>e.open&&e.dataset.search.includes("rubric"))','Search ignores case and diacritics, auto-opening matches');
    await evaluate('(()=>{const q=document.querySelector("#dcq");q.value="";q.dispatchEvent(new Event("input"));})()');
    await wait('[...document.querySelectorAll(".dc-item")].filter(e=>!e.parentNode.hidden).length===126');
    await check('[...document.querySelectorAll(".dc-item")].every(e=>!e.open)','Clearing the query closes auto-opened chunks');
    await click('.dc-item summary');
    await check('document.querySelector(".dc-item").open && document.querySelector(".dc-item .dc-seen").getBoundingClientRect().height>0','Chunk opens on click and reveals its actions');
    await click('.dc-item .dc-seen:not(.dc-copy)');
    await check('document.querySelector(".dc-item").classList.contains("seen") && document.querySelector("#dcprogress").textContent.includes("1 / 126") && JSON.parse(localStorage.getItem("cse122-syllabus-v1")).seen["dc-s1-1-1"]===1','Marking a chunk as seen persists to localStorage');
    await evaluate('document.querySelector(".dc-item summary").focus()');
    await key('Enter');
    await check('document.querySelector(".dc-item").open===false && document.activeElement===document.querySelector(".dc-item summary")','Chunk is keyboard operable and keeps focus');
    await navigate('index.html');
    await navigate('demo/de-cuong/index.html#dc-c7-7-2');
    await wait('document.getElementById("dc-c7-7-2")?.open===true');
    await check('document.querySelector(".dc-tab[data-tab=c7]").getAttribute("aria-pressed")==="true"','Deep link switches to the owning chapter filter');
    await check('document.querySelector("#dcprogress").textContent.includes("1 / 126") && !!document.querySelector(".dc-item.seen")','Deep link reload keeps saved self-check progress');
    await wait('(()=>{const e=document.getElementById("dc-c7-7-2");if(!e)return false;const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()');
    await check('(()=>{const r=document.getElementById("dc-c7-7-2").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()','Deep-linked chunk is scrolled into view');
    await screenshot('desktop-syllabus-deeplink');

    for(const width of [390,320]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
      await navigate('demo/de-cuong/index.html');
      await wait('document.querySelectorAll(".dc-item").length===126');
      await check('document.documentElement.scrollWidth<=innerWidth+1','No horizontal overflow on the syllabus at '+width);
      await check('[...document.querySelectorAll(".dc-toolbar button,.dc-tab,.dc-stats span")].every(b=>b.getBoundingClientRect().right<=innerWidth+1)','Syllabus controls stay inside the viewport at '+width);
      await check('(()=>{const c=[...document.querySelectorAll(".dc-tab")];return c.length===11&&c.every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.height>=40})})()','All 11 filter chips are tappable targets inside the viewport');
      await click('.dc-tab[data-tab="c9"]');
      await check('[...document.querySelectorAll(".dc-item")].filter(e=>!e.parentNode.hidden).length===7','Touch filter works at '+width);
      if(width===390)await screenshot('mobile-syllabus');
    }

    for(const width of [390,320]) {
      await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
      for(const file of ['index.html',...Array.from({length:5},(_,i)=>`ebook/chuong-${i+1}.html`),lesson]) {
        await navigate(file);
        if(file.includes('ebook/'))await wait('document.querySelectorAll(".quiz-q").length===3');
        await check('document.documentElement.scrollWidth<=innerWidth+1','No horizontal page overflow at '+width);
        await check('document.querySelector(".nav").getBoundingClientRect().right<=innerWidth+1','Mobile navigation stays in viewport');
        await check('[...document.querySelectorAll(".nav a")].every(a=>a.getBoundingClientRect().right<=innerWidth+1)','Every mobile navigation item is visible');
        if(file===lesson)await check('document.querySelector(".lesson-toc").open===false','TOC compact on mobile');
        if(file.includes('ebook/')) {
          await check('getComputedStyle(document.querySelector(".practice-steps")).display==="block"','Practice steps remain a readable list at '+width);
          await click('.learning-path li:nth-child(3) a');
          await check('location.hash==="#chapter-practice"','Mobile practice route reaches chapter task');
        }
        if(width===390)await screenshot(file===lesson?'mobile-lesson':file.includes('ebook')?'mobile-'+path.basename(file,'.html'):'mobile-home');
      }
      await navigate('ebook/chuong-2.html');await click('.slide-grid figure');await key('ArrowRight');
      await check('LB.idx===1 && document.querySelector(".lb-close").getBoundingClientRect().right<=innerWidth','Mobile lightbox controls reachable');
      await key('Escape');
    }
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await navigate('ebook/chuong-3.html');await wait('document.querySelectorAll(".quiz-q").length===3');
    await check('getComputedStyle(document.documentElement).scrollBehavior==="auto"','Reduced-motion preference respected');
    await evaluate('document.querySelector(".quiz-opts button").click();document.querySelector(".quiz-panel").scrollIntoView({block:"start",behavior:"instant"})');
    await screenshot('mobile-quiz-feedback');
    assert.deepEqual(exceptions, [], 'No uncaught JavaScript exceptions');
    const report={browser:await send('Browser.getVersion'),checks,viewports:['1440x1000','390x844','320x844'],result:'PASS',date:new Date().toISOString()};
    await fsp.writeFile(path.join(root,'.preview/browser-results.json'),JSON.stringify(report,null,2));
    console.log(`PASS: ${checks} real-browser assertions; desktop, mobile, keyboard, quiz, resume and lightbox.`);
  } finally {
    if(send)try{await send('Browser.close');}catch{}
    ws?.close();proc?.kill();server.close();
    await sleep(500);await fsp.rm(profile,{recursive:true,force:true,maxRetries:6,retryDelay:300}).catch(()=>{});
  }
}
main().catch(error=>{console.error(error);server.close();process.exitCode=1;});