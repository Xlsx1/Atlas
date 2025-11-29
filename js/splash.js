// splash.js (creative) — duration = 4000ms
(function(){
    const SPLASH_MS = 4000; // 4 seconds
    const TICK_MS = 30;
    const splash = document.getElementById('splash');
    const bar = document.querySelector('.progress-bar');
    const taglineEl = document.getElementById('taglineTxt');
  
    const lines = ["لوحات مالية تفاعلية", "عرض مبسط للبيانات", "أرقام، رسومات، وقراءة أسرع"];
    let lineIndex = 0;
  
    // typing effect (cycles through lines)
    function typeLine(text, cb){
      taglineEl.textContent = '';
      const chars = text.split('');
      let i = 0;
      const typer = setInterval(()=>{
        if(i >= chars.length){ clearInterval(typer); setTimeout(cb, 700); return; }
        taglineEl.textContent += chars[i++];
      }, 36);
    }
  
    function startCycle(){
      typeLine(lines[lineIndex], ()=>{
        lineIndex = (lineIndex + 1) % lines.length;
        // schedule next (but overall splash limited by SPLASH_MS)
        setTimeout(()=>{ if(document.getElementById('splash')) typeLine(lines[lineIndex], ()=>{}); }, 900);
      });
    }
  
    // start the typing immediately (first line)
    typeLine(lines[0], ()=>{ setTimeout(()=> startCycle(), 800); });
  
    // progress circle increment
    let elapsed = 0;
    const max = SPLASH_MS;
    const timer = setInterval(()=>{
      elapsed += TICK_MS;
      const pct = Math.min(100, Math.round((elapsed / max) * 100));
      if(bar) bar.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
      if(elapsed >= max){
        clearInterval(timer);
        finishSplash();
      }
    }, TICK_MS);
  
    // gentle breathing motion
    (function logoBreathe(){
      const logo = document.querySelector('.splash-inner');
      if(!logo) return;
      let dir = 1;
      setInterval(()=> {
        if(!document.getElementById('splash')) return;
        logo.style.transform = `translateY(${dir * 1.2}px)`;
        dir = -dir;
      }, 1600);
    })();
  
    function finishSplash(){
      if(bar) bar.setAttribute('stroke-dasharray', `100 0`);
      const inner = document.querySelector('.splash-inner');
      if(inner){
        inner.animate([
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.04)', opacity: 1 },
          { transform: 'scale(.98)', opacity: 0 }
        ], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1)' });
      }
  
      setTimeout(()=>{
        if(splash){
          splash.classList.add('hidden');
          setTimeout(()=> { splash.remove && splash.remove(); }, 650);
        }
        startApp();
      }, 520);
    }
  
    function startApp(){
      if(typeof initApp === 'function'){
        try { initApp(); } catch(e){ console.error('initApp failed:', e); }
      } else {
        if(typeof buildMenu === 'function') buildMenu();
        if(typeof renderSheet === 'function' && typeof DATA !== 'undefined'){
          try{ renderSheet(Object.keys(DATA)[0]); }catch(e){console.error(e)}
        }
      }
    }
  
    // skip on click/tap
    splash.addEventListener && splash.addEventListener('click', ()=>{
      clearInterval(timer);
      finishSplash();
    });
  })();
  