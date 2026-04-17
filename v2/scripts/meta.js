async function loadJson(path){
  const res = await fetch(path);
  return await res.json();
}

function parseDate(s){
  // expects YYYY-MM-DD
  if(!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(d){
  const y=d.getUTCFullYear();
  const m=String(d.getUTCMonth()+1).padStart(2,'0');
  const day=String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

async function renderLastUpdated(){
  const elUp = document.getElementById('last-updated');
  if(!elUp) return;

  const paths = [
    'data/checklist.json',
    'data/subsidy.json',
    'data/vaccine.json',
    'data/ai.json'
  ];

  const dates = [];
  for(const p of paths){
    try{
      const j = await loadJson(p);
      const d = parseDate(j.updated);
      if(d) dates.push(d);
    }catch(e){
      // ignore
    }
  }

  if(!dates.length){
    elUp.textContent = '—';
    return;
  }

  const latest = dates.sort((a,b)=>b-a)[0];
  elUp.textContent = fmtDate(latest);
}

renderLastUpdated();
