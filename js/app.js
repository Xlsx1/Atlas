
const menuEl = document.getElementById('menuList');
const sheetNames = Object.keys(DATA);
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
    closePanel(false);
  });
});

renderSheet(sheetNames[0]);

document.getElementById('searchInput').addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('#menuList li').forEach(li=> li.style.display = li.textContent.toLowerCase().includes(q) ? 'flex' : 'none');
});

document.getElementById('toggleSample').addEventListener('click', ()=> {
  const idx = sheetNames.findIndex(n => n === document.querySelector('#menuList li.active').dataset.sheet);
  const next = (idx + 1) % sheetNames.length;
  document.querySelectorAll('#menuList li').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('#menuList li')[next].classList.add('active');
  renderSheet(sheetNames[next]);
});

function renderSheet(sheetName){
  const sheet = DATA[sheetName];
  document.getElementById('mainTitle').textContent = sheet.title || sheetName;
  document.getElementById('subtitle').textContent = `Sheet: ${sheetName}`;
  // periods
  const periodsEl = document.getElementById('periods'); periodsEl.innerHTML = '';
  (sheet.periods || []).forEach(p => {
    const d = document.createElement('div'); d.className='small'; d.innerHTML = p; periodsEl.appendChild(d);
  });
  // table header
  const th = document.getElementById('tableHead'); th.innerHTML = '';
  const tr = document.createElement('tr'); const th0 = document.createElement('th'); th0.textContent='البند'; tr.appendChild(th0);
  const n = Math.max((sheet.periods||[]).length,4);
  for(let i=0;i<n;i++){ const thd=document.createElement('th'); thd.textContent = sheet.periods[i] || `Period ${i+1}`; tr.appendChild(thd); }
  th.appendChild(tr);
  // body
  const tbody = document.getElementById('tableBody'); tbody.innerHTML='';
  (sheet.rows || []).forEach((row, idx)=>{
    const tr = document.createElement('tr');
    const td0 = document.createElement('td'); td0.className='label'; td0.textContent = row.item || '';
    tr.appendChild(td0);
    const count = Math.max((sheet.periods||[]).length,4);
    for(let i=0;i<count;i++){
      const td = document.createElement('td'); td.textContent = (row.v && row.v[i] !== undefined && row.v[i] !== null) ? row.v[i] : '';
      tr.appendChild(td);
    }
    tr.addEventListener('click', ()=> openDetail(row, sheet));
    tbody.appendChild(tr);
  });
}

function formatNumber(n){ if(n===null||n===undefined||n==='') return ''; if(typeof n==='number') return n.toLocaleString('en-US'); return String(n); }

let miniChart = null;
function openDetail(row, sheet){
  const panel = document.getElementById('detailPanel'); panel.classList.add('open'); panel.setAttribute('aria-hidden','false');
  document.getElementById('detailTitle').textContent = row.item || '-';
  for(let i=0;i<4;i++){
    document.getElementById('p'+i+'name').textContent = (sheet.periods && sheet.periods[i]) ? sheet.periods[i] : `Period ${i+1}`;
    document.getElementById('val'+i).textContent = formatNumber(row.v[i]);
  }
  document.getElementById('noteArea').textContent = row.note || '';
  document.getElementById('detailedNote').textContent = row.note || '—';
  document.getElementById('breakdown').textContent = row.breakdown ? Object.entries(row.breakdown).map(kv=>kv[0]+': '+formatNumber(kv[1])).join(' • ') : 'غير متاح';
  const a = Number(String(row.v[2]||0).replace(/,/g,'')); const b = Number(String(row.v[3]||0).replace(/,/g,''));
  document.getElementById('delta').textContent = (!isNaN(a) && !isNaN(b)) ? ((a-b)>=0? '+'+(a-b).toLocaleString('en-US') : (a-b).toLocaleString('en-US')) : '—';
  const ctx = document.getElementById('miniChart').getContext('2d');
  const labels = (sheet.periods && sheet.periods.length) ? sheet.periods.slice(0,4) : ['P1','P2','P3','P4'];
  const data = [row.v[0]||null, row.v[1]||null, row.v[2]||null, row.v[3]||null].map(v => { const num = Number(String(v||'').replace(/,/g,'')); return !isNaN(num)?num:null; });
  if(miniChart) miniChart.destroy();
  if(typeof Chart !== 'undefined'){ miniChart = new Chart(ctx,{ type:'bar', data:{ labels, datasets:[{ label: row.item, data, borderRadius:6, barThickness:18 }]}, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:'#f3f7fe'}} } } }); }
}

function closePanel(){ const panel=document.getElementById('detailPanel'); panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); }

document.getElementById('closePanel').addEventListener('click', ()=> { closePanel(); });

document.getElementById('exportCsv').addEventListener('click', ()=>{
  const title = document.getElementById('detailTitle').textContent.replace(/,/g,'');
  const rows = [['Period', ...( ( (DATA[Object.keys(DATA)[0]] || {}).periods || ['P1','P2','P3','P4']).slice(0,4) )], [title, document.getElementById('val0').textContent, document.getElementById('val1').textContent, document.getElementById('val2').textContent, document.getElementById('val3').textContent]];
  const csv = rows.map(r => r.join(',')).join('\n'); const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'}); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${title}.csv`; link.click(); URL.revokeObjectURL(link.href);
});

const accHead = document.getElementById('accHead'); const accBody = document.getElementById('accBody');
accHead.addEventListener('click', ()=>{ const open = accBody.classList.toggle('open'); document.getElementById('accToggle').textContent = open ? 'اخفاء' : 'عرض'; });
