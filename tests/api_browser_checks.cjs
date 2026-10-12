'use strict';
// Run inside the existing dependency-free CDP browser harness.
module.exports = async function apiBrowserChecks({send, evaluate, check, wait, navigate, click, screenshot, base}) {
  const route = async id => {
    await evaluate(`location.hash=${JSON.stringify(id)}`);
    await wait(`location.hash===${JSON.stringify('#'+id)} && !document.getElementById(${JSON.stringify(id)}).closest('.reading').hidden`);
  };
  const reveal = async selector => {
    const id = await evaluate(`document.querySelector(${JSON.stringify(selector)}).closest('.course-content > .reading[hidden]')?.id`);
    if (id) await route(id);
  };
  const set = async (id, value, type = 'change') => {
    await reveal('#'+id);
    return evaluate(`(()=>{const el=document.getElementById(${JSON.stringify(id)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event(${JSON.stringify(type)},{bubbles:true}));})()`);
  };
  const press = async selector => {
    await reveal(selector);
    return evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  };
  const enter = async () => {
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',windowsVirtualKeyCode:13,text:'\r'});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',windowsVirtualKeyCode:13});
  };
  await navigate('index.html');
  await check(`!!document.querySelector('#tu-hoc-api a[href="demo/tu-hoc-api/index.html"]')`, 'Homepage exposes the three-session course');
  await navigate('demo/tu-hoc-api/index.html');
  await wait('document.body.classList.contains("spa-ready")');
  await check('location.hash==="#lo-trinh" && document.querySelectorAll(".course-content > .reading:not([hidden])").length===1 && document.getElementById("lesson-prev").disabled', 'SPA opens only the roadmap and disables previous at the start');
  await evaluate('window.spaToken={};window.initialSpaToken=window.spaToken');
  await press('#lesson-next'); await wait('location.hash==="#ban-do-noi-dung"');
  await check('document.activeElement.id==="title-ban-do-noi-dung" && document.querySelector(".course-toc [aria-current=page]").hash==="#ban-do-noi-dung"', 'Next route announces the active lesson and moves keyboard focus');
  await evaluate('history.back()'); await wait('location.hash==="#lo-trinh"');
  await evaluate('history.forward()'); await wait('location.hash==="#ban-do-noi-dung"');
  await check('window.spaToken===window.initialSpaToken && !document.getElementById("ban-do-noi-dung").hidden', 'Back and Forward update the view without reloading the document');
  await set('lesson-picker','promise'); await wait('location.hash==="#promise" && !document.getElementById("promise").hidden');
  await check('document.title.includes("Promise") && document.getElementById("lesson-status").textContent.includes("Promise")', 'Lesson picker updates the route, document title and status');
  await route('lab-loop');
  await check('!document.getElementById("event-loop").hidden && document.querySelectorAll(".course-content > .reading:not([hidden])").length===1', 'Nested lab links reveal their parent lesson');
  await route('reference');
  await check('document.getElementById("lesson-next").disabled', 'Last route disables next');
  await evaluate('location.hash="missing-lesson"'); await wait('location.hash==="#lo-trinh"');
  await check('!document.getElementById("lo-trinh").hidden', 'Unknown route recovers to the roadmap');
  await evaluate('location.hash="%E0%A4%A"'); await wait('location.hash==="#lo-trinh"');
  await check('!document.getElementById("lo-trinh").hidden', 'Malformed encoded hash recovers without throwing');
  await route('promise');
  await evaluate('document.querySelector(".skip").focus()'); await enter();
  await wait('location.hash==="#main" && document.activeElement.id==="main"');
  await check('!document.getElementById("promise").hidden', 'Keyboard skip link focuses main without discarding the current lesson');
  await route('practice');
  await wait('document.querySelector("#practice iframe").contentDocument?.querySelectorAll("#doctor option").length===7');
  await evaluate('document.querySelector("#practice iframe").contentDocument.getElementById("patient").value="SV SPA"');
  await route('booking'); await route('practice');
  await check('document.querySelector("#practice iframe").contentDocument.getElementById("patient").value==="SV SPA"', 'Practice iframe state survives switching between lessons');
  await send('Emulation.setEmulatedMedia',{media:'print'});
  await check('[...document.querySelectorAll(".course-content > .reading")].every(el=>getComputedStyle(el).display!=="none") && getComputedStyle(document.getElementById("lesson-toolbar")).display==="none"', 'Print includes every lesson while hiding SPA navigation');
  await send('Emulation.setEmulatedMedia',{media:''});
  await route('lo-trinh');
  await check('document.querySelectorAll("[data-reading]").length===17 && document.querySelectorAll("[data-complete]").length===17', 'Course renders all 17 readings and self-checks');
  await screenshot('desktop-api-course');
  await check('document.querySelectorAll(".visual-map").length>=8 && document.querySelectorAll(".reading-coach").length>=14', 'Remaining syllabus has responsive maps and guided observations');
  await evaluate('window.searchOriginalFetch=window.fetch;window.searchRequests=0;window.fetch=(...args)=>{window.searchRequests++;return window.searchOriginalFetch(...args)}');
  await press('#search-load');
  await wait('!document.getElementById("search-load").disabled');
  await check('document.getElementById("search-total").textContent==="6" && document.getElementById("search-matched").textContent==="6" && document.querySelectorAll("#search-results .doctor-card").length===2 && document.getElementById("search-page").textContent.startsWith("1 / 3")', 'Search GET preserves six original doctors and shows two per page');
  await press('#search-next'); await press('#search-next');
  await check('document.getElementById("search-page").textContent.startsWith("3 / 3") && document.getElementById("search-next").disabled && document.getElementById("search-trace").textContent.includes("slice(4, 6)")', 'Pagination respects end boundary and exposes array indices');
  await set('search-specialty', 'Tim mạch');
  await check('document.getElementById("search-total").textContent==="6" && document.getElementById("search-matched").textContent==="2" && document.getElementById("search-page").textContent.startsWith("1 / 1") && document.getElementById("search-prev").disabled', 'Filter resets page without destroying original array');
  await set('search-name', 'không tồn tại', 'input');
  await check('document.getElementById("search-status").textContent.startsWith("empty") && !document.querySelector("#search-results .doctor-card") && document.getElementById("search-next").disabled', 'No match is empty rather than network error');
  await press('#search-clear'); await set('search-name', 'NGUYỄN', 'input');
  await check('document.getElementById("search-matched").textContent==="1" && document.getElementById("search-results").textContent.includes("Nguyễn")', 'Vietnamese search ignores case while keeping accent semantics');
  await check('window.searchRequests===1', 'Client filtering and pagination do not issue new requests');
  await evaluate('window.fetch=async()=>({ok:false,status:503})'); await press('#search-load');
  await wait('!document.getElementById("search-load").disabled');
  await check('document.getElementById("search-status").textContent.includes("503") && document.getElementById("search-name").disabled && !document.querySelector("#search-results .doctor-card")', 'Search load failure clears stale cards and reports retry path');
  await evaluate('window.fetch=async()=>({ok:true,json:async()=>[null]})'); await press('#search-load');
  await wait('!document.getElementById("search-load").disabled');
  await check('document.getElementById("search-status").classList.contains("error")', 'Search rejects malformed schema including null records');
  await evaluate('window.fetch=window.searchOriginalFetch'); await press('#search-clear'); await press('#search-load');
  await wait('document.getElementById("search-total").textContent==="6"');
  await set('search-name', '', 'input'); await set('search-specialty','all');
  await evaluate('document.getElementById("search-pagination").scrollIntoView({block:"start",behavior:"instant"})'); await screenshot('desktop-api-search');
  await press('#component-cards button[data-doctor-id="1"]');
  await check('document.getElementById("component-state").textContent.endsWith("1") && document.getElementById("component-summary").textContent.includes("BS. An") && document.querySelectorAll("#component-cards [aria-pressed=true]").length===1', 'Component event updates shared state and summary');
  await evaluate('document.querySelector(\'#component-cards button[data-doctor-id="2"]\').focus()'); await enter();
  await check('document.activeElement.dataset.doctorId==="2" && document.getElementById("component-summary").textContent.includes("BS. Hà") && document.getElementById("component-props").textContent.includes("id=2, selected=true")', 'Keyboard selection preserves focus and updates derived props');
  await evaluate('document.getElementById("components").scrollIntoView({block:"start",behavior:"instant"})'); await screenshot('desktop-api-components');
  await press('#component-reset');
  await check('document.getElementById("component-state").textContent.endsWith("null") && !document.querySelector("#component-cards [aria-pressed=true]")', 'Component reset clears all derived UI');
  await press('#web-run');
  await wait('document.getElementById("web-log").textContent.includes("4. Timer")');
  await check('document.getElementById("web-board").textContent.includes("đến giờ nhắc")', 'DOM and timer lab completes');
  await press('#web-run'); await press('#web-cancel');
  await check('document.getElementById("web-log").textContent.includes("Đã hủy")', 'Timer can be cancelled');
  await press('#loop-real');
  await wait('!document.getElementById("loop-real").disabled');
  await check(`document.getElementById("loop-log").textContent===${JSON.stringify('A: bắt đầu\nD: kết thúc script\nC: Promise.then\nB: timer 0ms')}`, 'Real browser event loop produces A D C B');
  await press('#loop-reset');
  for (let i=0;i<7;i++) await press('#loop-step');
  const retainedLoop = await evaluate('document.getElementById("loop-log").textContent');
  await route('promise'); await route('event-loop');
  await check(`document.getElementById("loop-log").textContent===${JSON.stringify(retainedLoop)}`, 'Interactive lesson state is retained across route changes');
  await check('document.getElementById("loop-stack").textContent==="(rỗng)" && document.getElementById("loop-log").textContent.includes("B: timer")', 'Step model reaches settled queues');
  await press('#promise-run');
  await check('document.getElementById("promise-state").textContent.startsWith("pending") && document.getElementById("promise-log").textContent.includes("Executor chạy ngay")', 'Promise executor is synchronous and state starts pending');
  await wait('!document.getElementById("promise-run").disabled');
  await check('document.getElementById("promise-state").textContent.startsWith("fulfilled") && document.getElementById("promise-log").textContent.includes("return: 17")', 'Promise fulfillment passes returned value down the chain');
  await set('promise-result', 'error'); await press('#promise-run');
  await wait('!document.getElementById("promise-run").disabled');
  await check('document.getElementById("promise-state").textContent.startsWith("rejected") && document.getElementById("promise-log").textContent.includes("catch nhận lỗi")', 'Promise rejection is handled without unhandled rejection');
  for (const selector of ['#parallel-sequential','#parallel-all']) {
    await press(selector); await wait('!document.getElementById("parallel-all").disabled');
    await check('document.getElementById("parallel-log").textContent.includes("Tổng thời gian")', 'Async composition completes: '+selector);
  }
  await set('http-method','POST'); await press('#http-send');
  await check('document.getElementById("http-output").textContent.includes("201 Created")', 'HTTP simulator creates a resource');
  await set('http-method','PUT'); await press('#http-send');
  await check('document.getElementById("http-output").textContent.includes("Khách thay thế")', 'HTTP simulator replaces a resource');
  await set('http-method','PATCH'); await press('#http-send');
  await check('document.getElementById("http-output").textContent.includes("confirmed")', 'HTTP simulator patches a resource');
  await set('http-method','DELETE'); await press('#http-send');
  await check('document.getElementById("http-output").textContent.includes("204 No Content")', 'HTTP simulator shows a bodyless DELETE response');
  for(const [scenario, state] of [['ok','success'],['empty','empty'],['404','error'],['json','error'],['network','error']]) {
    await set('fetch-scenario',scenario); await press('#fetch-load');
    await check('document.getElementById("fetch-status").dataset.state==="loading" && document.getElementById("fetch-load").disabled', 'Fetch enters loading: '+scenario);
    await wait('!document.getElementById("fetch-load").disabled');
    await check(`document.getElementById("fetch-status").dataset.state===${JSON.stringify(state)} && document.getElementById("fetch-list").getAttribute("aria-busy")==="false"`, 'Fetch ends in '+state+': '+scenario);
    if(scenario==='ok') await check('document.querySelectorAll("#fetch-list .doctor-card").length===6','Real GET renders six doctors');
    if(scenario==='404') await check('document.getElementById("fetch-log").textContent.includes("HTTP 404")','HTTP 404 is observed before the application throws');
    if(scenario==='json') await check('document.getElementById("fetch-log").textContent.includes("SyntaxError")','Malformed body produces a parse error');
  }
  await press('#fetch-retry'); await wait('!document.getElementById("fetch-load").disabled');
  await check('document.getElementById("fetch-status").dataset.state==="error"','Retry preserves the selected failing scenario');
  await set('fetch-scenario','ok'); await press('#fetch-load'); await press('#fetch-cancel');
  await wait('!document.getElementById("fetch-load").disabled');
  await check('document.getElementById("fetch-status").dataset.state==="idle" && document.getElementById("fetch-log").textContent.includes("AbortError")','Abort cancels the pending wait/request and releases controls');
  await press('#race-bad'); await wait('!document.getElementById("race-bad").disabled');
  await check('document.getElementById("race-screen").textContent.includes("cũ, sai")','Race simulator reproduces stale overwrite');
  await press('#race-good'); await wait('!document.getElementById("race-good").disabled');
  await check('document.getElementById("race-screen").textContent.includes("An (đúng)")','Request guard protects the latest result');
  await press('[data-complete="promise"]');
  await navigate('demo/tu-hoc-api/index.html#promise');
  await check('document.querySelector("[data-complete=promise]").checked && document.getElementById("course-progress").textContent.includes("1 / 17")','Reading progress survives navigation');
  await check('!document.getElementById("promise").hidden && document.querySelectorAll(".course-content > .reading:not([hidden])").length===1', 'Reload with a shared lesson URL restores the correct single panel');

  const project = async () => {
    const url=base+'demo/tu-hoc-api/project.html';
    await send('Page.navigate',{url});
    await wait(`location.href===${JSON.stringify(url)} && document.readyState==='complete' && document.querySelectorAll('#doctor option').length===7 && !document.getElementById('reload-doctors').disabled`);
  };
  await evaluate('localStorage.removeItem("cse122-api-lab-appointments-v1")');
  await project();
  await check('document.querySelectorAll("#doctors-list .doctor-card").length===6 && document.getElementById("metric-total").textContent==="0"','Project loads real doctors and starts with an empty dashboard');
  await screenshot('desktop-api-project');
  await evaluate('document.getElementById("booking-next").focus()'); await enter();
  await check('!document.getElementById("booking-error").hidden && document.activeElement.id==="doctor"','Keyboard activation triggers validation and moves focus');
  await press('#booking-next');
  await check('!document.getElementById("booking-error").hidden && document.activeElement.id==="doctor"','Step one validation focuses the missing doctor');
  await set('doctor','1'); await press('#booking-next');
  await press('#booking-next');
  await check('!document.getElementById("booking-error").hidden && document.activeElement.id==="date"','Step two rejects a missing date');
  await evaluate('document.getElementById("date").value=document.getElementById("date").min');
  await press('#booking-next');
  await press('#booking-submit');
  await check('!document.getElementById("booking-error").hidden && document.activeElement.id==="patient"','Step three validates contact details');
  await set('patient','<b>SV An</b>','input'); await set('phone','0900000000','input');
  await press('#booking-back'); await press('#booking-next');
  await check('document.getElementById("patient").value==="<b>SV An</b>"','Back navigation retains form input');
  await press('#simulate-failure'); await press('#booking-submit');
  await check('document.getElementById("booking-submit").disabled && document.getElementById("booking-step-3").disabled','Submission locks controls to prevent duplicates');
  await wait('!document.getElementById("booking-submit").disabled');
  await check('document.getElementById("metric-total").textContent==="0" && document.getElementById("patient").value==="<b>SV An</b>" && !document.getElementById("booking-error").hidden','Failed save retains input and does not create a phantom appointment');
  await press('#simulate-failure'); await press('#booking-submit'); await wait('!document.getElementById("booking-submit").disabled');
  await check('document.getElementById("metric-total").textContent==="1" && document.getElementById("booking-status").textContent.startsWith("saved") && document.getElementById("patient").value===""','Successful local save resets the form and updates dashboard');
  await check('document.activeElement.id==="doctor"','Successful submission returns keyboard focus to a visible control');
  await check('document.querySelector("#appointments-body td").textContent==="<b>SV An</b>" && !document.querySelector("#appointments-body td b")','User input is rendered as text, not HTML');
  await press('#appointments-body button[data-action="confirmed"]');
  await check('document.getElementById("metric-confirmed").textContent==="1" && JSON.parse(localStorage.getItem("cse122-api-lab-appointments-v1"))[0].status==="confirmed"','Dashboard status changes persist');
  await set('dashboard-filter','pending');
  await check('document.querySelectorAll("#appointments-body tr").length===0 && document.getElementById("metric-total").textContent==="1"','Filtering does not mutate source data or global metrics');
  await project();
  await check('document.getElementById("metric-total").textContent==="1" && document.getElementById("metric-confirmed").textContent==="1"','Appointments survive full page reload');
  await set('dashboard-query','missing name','input');
  await check('document.querySelectorAll("#appointments-body tr").length===0','Dashboard name search supports an empty result');
  await set('dashboard-query','sv an','input');
  await check('document.querySelectorAll("#appointments-body tr").length===1','Dashboard name search ignores letter case');
  await set('dashboard-query','','input');
  await set('specialty','Tim mạch');
  await check('document.querySelectorAll("#doctors-list .doctor-card").length===2','Doctor specialty filter works');
  await evaluate('void Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage blocked")}})');
  await press('#appointments-body button[data-action="cancelled"]');
  await check('document.getElementById("metric-confirmed").textContent==="1" && document.getElementById("storage-status").textContent.includes("Chưa lưu")','Blocked storage does not fake a successful dashboard update');
  await project();
  await press('#appointments-body button[data-action="cancelled"]');
  await check('document.getElementById("metric-cancelled").textContent==="1"','Dashboard cancellation updates saved metrics');
  await evaluate('window.originalConfirm=window.confirm;window.confirm=()=>false');
  await press('#appointments-body button[data-action="delete"]');
  await check('document.getElementById("metric-total").textContent==="1"','Declining delete preserves the appointment');
  await evaluate('window.confirm=()=>true'); await press('#appointments-body button[data-action="delete"]');
  await check('document.getElementById("metric-total").textContent==="0" && JSON.parse(localStorage.getItem("cse122-api-lab-appointments-v1")).length===0','Confirmed delete removes only the appointment record');
  await evaluate('window.confirm=window.originalConfirm');
  await evaluate('localStorage.setItem("cse122-api-lab-appointments-v1","broken json")');
  await project();
  await check('document.getElementById("storage-status").classList.contains("error") && localStorage.getItem("cse122-api-lab-appointments-v1")==="broken json"','Corrupt local data is reported and not overwritten');
  await evaluate('localStorage.removeItem("cse122-api-lab-appointments-v1")');
  await project();
  await evaluate('window.originalFetch=window.fetch;window.fetch=async()=>({ok:false,status:503})');
  await press('#reload-doctors'); await wait('!document.getElementById("reload-doctors").disabled');
  await check('document.getElementById("doctors-status").textContent.includes("503") && document.getElementById("booking-next").disabled','Failed project GET reports HTTP error and blocks booking');
  await evaluate('window.fetch=async()=>({ok:true,json:async()=>[]})');
  await press('#reload-doctors'); await wait('!document.getElementById("reload-doctors").disabled');
  await check('document.getElementById("doctors-status").textContent.startsWith("empty") && document.getElementById("booking-next").disabled','Empty doctors response is not treated as a network error');
  await evaluate('window.fetch=async()=>({ok:true,json:async()=>[{id:1,name:"Wrong schema"}]})');
  await press('#reload-doctors'); await wait('!document.getElementById("reload-doctors").disabled');
  await check('document.getElementById("doctors-status").classList.contains("error")','Invalid doctor schema is rejected before rendering');
  await evaluate('window.fetch=window.originalFetch');
  await press('#reload-doctors'); await wait('document.querySelectorAll("#doctors-list .doctor-card").length===6');
  await check('!document.getElementById("booking-next").disabled','Retry recovers project GET and restores booking');

  for(const width of [768,390,320]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
    await navigate('demo/tu-hoc-api/index.html');
    try {
      await wait('document.getElementById("lesson-toolbar").getBoundingClientRect().top >= document.querySelector(".topbar").getBoundingClientRect().bottom');
    } catch (error) {
      console.error('SPA scroll diagnostic:', await evaluate('({hash:location.hash,width:innerWidth,y:scrollY,toolbar:document.getElementById("lesson-toolbar").getBoundingClientRect().toJSON(),header:document.querySelector(".topbar").getBoundingClientRect().toJSON()})'));
      await screenshot('spa-scroll-failure');
      throw error;
    }
    await check('document.getElementById("lesson-toolbar").getBoundingClientRect().top >= document.querySelector(".topbar").getBoundingClientRect().bottom', 'Initial lesson picker label is not obscured by the sticky header at '+width);
    await check('document.documentElement.scrollWidth<=innerWidth+1','Reading has no horizontal page overflow at '+width);
    if(width===390) await screenshot('mobile-api-course');
    await check('!document.querySelector(".course-toc").open && document.getElementById("lesson-picker").getBoundingClientRect().width>0', 'Mobile navigation starts compact with a visible lesson picker at '+width);
    await click('.course-toc summary');
    await check('document.querySelector(".course-toc").open', 'Mobile table of contents opens with real pointer input at '+width);
    await click('.course-toc a[href="#promise"]');
    await wait('location.hash==="#promise" && !document.getElementById("promise").hidden');
    await check('!document.querySelector(".course-toc").open && document.activeElement.id==="title-promise"', 'Mobile TOC navigation closes the menu and focuses the lesson at '+width);
    const panelIds = await evaluate('[...document.querySelectorAll(".course-content > .reading")].map(el=>el.id)');
    for (const id of panelIds) {
      await route(id);
      await check('document.documentElement.scrollWidth<=innerWidth+1 && [...document.querySelectorAll(".reading:not([hidden]) .visual-map,.reading:not([hidden]) .visual-flow li,.reading:not([hidden]) .visual-outcome,.reading:not([hidden]) .coverage-grid article")].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&el.scrollWidth<=el.clientWidth+1})', 'Active SPA lesson and visual cards fit at '+width+': '+id);
    }
    for(const section of ['event-loop','promise','search-pagination','components']) {
      await route(section);
      await evaluate(`document.getElementById(${JSON.stringify(section)}).scrollIntoView({block:'start',behavior:'instant'})`);
      if(width===390 || width===768) await screenshot((width===768?'tablet':'mobile')+'-api-'+section);
      if(width===390) {
        await evaluate(`document.querySelector('#'+${JSON.stringify(section)}+' .visual-map').scrollIntoView({block:'start',behavior:'instant'})`);
        await screenshot('mobile-api-map-'+section);
      }
    }
    await press('#search-load'); await wait('document.getElementById("search-total").textContent==="6"');
    await press('#search-next');
    await check('document.getElementById("search-page").textContent.startsWith("2 / 3") && document.querySelectorAll("#search-results .doctor-card").length===2', 'Pagination works at '+width);
    await press('#component-cards button[data-doctor-id="2"]');
    await check('document.getElementById("component-summary").textContent.includes("BS. Hà")', 'Component shared state works at '+width);
    if(width===390) {
      for(const lab of ['lab-loop','lab-search','lab-component']) {
        await route(lab);
        await evaluate(`document.getElementById(${JSON.stringify(lab)}).scrollIntoView({block:'start',behavior:'instant'})`);
        await screenshot('mobile-api-'+lab);
      }
    }
    await project();
    await check('document.documentElement.scrollWidth<=innerWidth+1','Project has no horizontal page overflow at '+width);
    await check('[...document.querySelectorAll("button")].filter(e=>e.getBoundingClientRect().width>0).every(e=>e.getBoundingClientRect().right<=innerWidth+1)','Project buttons remain reachable at '+width);
    if(width===390) await screenshot('mobile-api-project');
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate('demo/tu-hoc-api/index.html#lab-loop');
  await check('!document.getElementById("event-loop").hidden && document.getElementById("lesson-picker").value==="event-loop"', 'Initial shared nested hash selects its parent lesson');
  await send('Emulation.setScriptExecutionDisabled',{value:true});
  try {
    const url = await evaluate('new URL("index.html",location.href).href');
    await send('Page.navigate',{url});
    await wait('document.readyState==="complete" && !!document.getElementById("reference")');
    await check('!document.body.classList.contains("spa-ready") && [...document.querySelectorAll(".course-content > .reading")].every(el=>!el.hidden && getComputedStyle(el).display!=="none") && document.getElementById("lesson-toolbar").hidden && document.querySelector("noscript p").getBoundingClientRect().height>0', 'No-JavaScript fallback keeps every lesson readable and hides inactive SPA controls');
    await screenshot('desktop-api-nojs');
  } finally {
    await send('Emulation.setScriptExecutionDisabled',{value:false});
  }
};