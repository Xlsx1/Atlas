// عناصر DOM الأساسية
const menuEl = document.getElementById('menuList');
const mobileSelect = document.getElementById('mobileSheetSelect');
const sheetNames = Object.keys(DATA);

/* ====== BUILD MENU (يعمر القائمة و mobile select) ====== */
function buildMenu(){
  menuEl.innerHTML = '';
  mobileSelect.innerHTML = '';

  sheetNames.forEach((name,i)=>{
    const li = document.createElement('li');
    li.dataset.sheet = name;
    li.innerHTML = `<span>${name}</span><span class="badge">${i+1}</span>`;
    if(i===0) li.classList.add('active');
    menuEl.appendChild(li);

    li.addEventListener('click', ()=> {
      document.querySelectorAll('#menuList li').forEach(x=>x.classList.remove('active'));
      li.classList.add('active');
      renderSheet(name);
      closePanel();

      if(window.innerWidth <= 980){
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('open');
      }
    });

    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if(i===0) opt.selected = true;
    mobileSelect.appendChild(opt);
  });

  mobileSelect.addEventListener('change', (e)=> {
    const name = e.target.value;
    document.querySelectorAll('#menuList li')
      .forEach(x=>x.classList.toggle('active', x.dataset.sheet === name));
    renderSheet(name);
    closePanel();
  });
}

/* ====== RENDER SHEET (يبني الجدول) ====== */
function renderSheet(sheetName){
  const sheet = DATA[sheetName];
  document.getElementById('mainTitle').textContent = sheet.title || sheetName;
  document.getElementById('subtitle').textContent = `Sheet: ${sheetName}`;

  const periodsEl = document.getElementById('periods');
  periodsEl.innerHTML = '';
  (sheet.periods || []).forEach(p => {
    const d = document.createElement('div');
    d.className='small';
    d.innerHTML = p;
    periodsEl.appendChild(d);
  });

  const th = document.getElementById('tableHead');
  th.innerHTML = '';
  const headerTr = document.createElement('tr');
  const th0 = document.createElement('th');
  th0.textContent='البند';
  headerTr.appendChild(th0);

  const n = Math.max((sheet.periods||[]).length,4);
  for(let i=0;i<n;i++){
    const thd=document.createElement('th');
    thd.textContent = sheet.periods[i] || `Period ${i+1}`;
    headerTr.appendChild(thd);
  }
  th.appendChild(headerTr);

  const tbody = document.getElementById('tableBody');
  tbody.innerHTML='';
  (sheet.rows || []).forEach((row)=>{
    const tr = document.createElement('tr');
    const td0 = document.createElement('td');
    td0.className='label';
    td0.textContent = row.item || '';
    tr.appendChild(td0);

    const count = Math.max((sheet.periods||[]).length,4);
    for(let i=0;i<count;i++){
      const td = document.createElement('td');
      td.textContent = (row.v && row.v[i] !== undefined && row.v[i] !== null) ? row.v[i] : '';
      tr.appendChild(td);
    }
    tr.addEventListener('click', ()=> openDetail(row, sheet));
    tbody.appendChild(tr);
  });

  try{ mobileSelect.value = sheetName; }catch(e){}
}

/* ====== UTIL ====== */
function formatNumber(n){
  if(n===null||n===undefined||n==='') return '';
  if(typeof n==='number') return n.toLocaleString('en-US');
  return String(n);
}

/* ====== DETAIL PANEL + CHART ====== */
let miniChart = null;

function openDetail(row, sheet){
  const panel = document.getElementById('detailPanel');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');

  document.getElementById('detailTitle').textContent = row.item || '-';

  for(let i=0;i<4;i++){
    document.getElementById('p'+i+'name').textContent =
      (sheet.periods && sheet.periods[i]) ? sheet.periods[i] : `Period ${i+1}`;
    document.getElementById('val'+i).textContent = formatNumber(row.v[i]);
  }

  document.getElementById('noteArea').textContent = row.note || '';
  document.getElementById('detailedNote').textContent = row.note || '—';
  document.getElementById('breakdown').textContent =
    row.breakdown
      ? Object.entries(row.breakdown)
          .map(kv=>kv[0] + ': ' + formatNumber(kv[1]))
          .join(' • ')
      : 'غير متاح';

  const a = Number(String(row.v[2]||0).toString().replace(/,/g,''));
  const b = Number(String(row.v[3]||0).toString().replace(/,/g,''));
  document.getElementById('delta').textContent =
    (!isNaN(a) && !isNaN(b))
      ? ((a-b)>=0 ? '+'+(a-b).toLocaleString('en-US') : (a-b).toLocaleString('en-US'))
      : '—';

  const ctx = document.getElementById('miniChart').getContext('2d');
  const labels = (sheet.periods && sheet.periods.length)
    ? sheet.periods.slice(0,4)
    : ['P1','P2','P3','P4'];
  const data = [row.v[0]||null, row.v[1]||null, row.v[2]||null, row.v[3]||null]
    .map(v => {
      const num = Number(String(v||'').replace(/,/g,''));
      return !isNaN(num)?num:null;
    });

  if(miniChart){
    try{ miniChart.destroy(); }catch(e){}
  }

  if(typeof Chart !== 'undefined'){
    miniChart = new Chart(ctx,{
      type:'bar',
      data:{
        labels,
        datasets:[{
          label: row.item,
          data,
          borderRadius:6,
          barThickness:18
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          x:{grid:{display:false}},
          y:{grid:{color:'#f3f7fe'}}
        }
      }
    });
  }
}

function closePanel(){
  const panel=document.getElementById('detailPanel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
}

/* ====== EVENTS (اللي ممكن شغاله قبل initApp) ====== */
document.getElementById('closePanel').addEventListener('click', closePanel);

document.getElementById('exportCsv').addEventListener('click', ()=>{
  const title = document.getElementById('detailTitle')
    .textContent.replace(/,/g,'');
  const rows = [
    ['Period', ...(((DATA[Object.keys(DATA)[0]] || {}).periods || ['P1','P2','P3','P4']).slice(0,4))],
    [
      title,
      document.getElementById('val0').textContent,
      document.getElementById('val1').textContent,
      document.getElementById('val2').textContent,
      document.getElementById('val3').textContent
    ]
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${title}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

const accHead = document.getElementById('accHead');
const accBody = document.getElementById('accBody');
accHead.addEventListener('click', ()=>{
  const open = accBody.classList.toggle('open');
  document.getElementById('accToggle').textContent = open ? 'اخفاء' : 'عرض';
});

document.getElementById('searchInput').addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('#menuList li')
    .forEach(li=> li.style.display =
      li.textContent.toLowerCase().includes(q) ? 'flex' : 'none'
    );
});

document.getElementById('toggleSample').addEventListener('click', ()=>{
  const activeLi = document.querySelector('#menuList li.active');
  if(!activeLi) return;
  const idx = sheetNames.findIndex(n => n === activeLi.dataset.sheet);
  const next = (idx + 1) % sheetNames.length;
  document.querySelectorAll('#menuList li').forEach(x=>x.classList.remove('active'));
  const nextLi = document.querySelectorAll('#menuList li')[next];
  if(nextLi){
    nextLi.classList.add('active');
    renderSheet(sheetNames[next]);
  }
});

document.getElementById('mobileHamburger').addEventListener('click', ()=>{
  const sidebar = document.getElementById('sidebar');
  if(!sidebar.classList.contains('overlay')){
    sidebar.classList.add('overlay');
  }
  sidebar.classList.toggle('open');
});

document.getElementById('mobileToggleDetail').addEventListener('click', ()=>{
  const panel = document.getElementById('detailPanel');
  panel.classList.toggle('open');
  panel.setAttribute('aria-hidden', !panel.classList.contains('open'));
});

document.addEventListener('click', (e)=>{
  const sidebar = document.getElementById('sidebar');
  if(window.innerWidth <= 980 && sidebar.classList.contains('overlay') && sidebar.classList.contains('open')){
    const inside =
      sidebar.contains(e.target) ||
      document.getElementById('mobileHamburger').contains(e.target) ||
      document.getElementById('mobileSheetSelect').contains(e.target);
    if(!inside){
      sidebar.classList.remove('open');
    }
  }
});

window.addEventListener('resize', ()=>{
  const sidebar = document.getElementById('sidebar');
  if(window.innerWidth > 980){
    sidebar.classList.remove('overlay','open');
  }
});

/* ====== exposed init for splash to call ===== */
function initApp(){
  buildMenu();
  renderSheet(sheetNames[0]);
  // ensure sidebar overlay closed on start
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.remove('overlay','open');
}
