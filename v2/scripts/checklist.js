const key='pm88-check';
async function load(){
  const res=await fetch('data/checklist.json');
  const data=await res.json();
  const tabs=document.getElementById('stage-tabs');
  const content=document.getElementById('stage-content');
  const state=JSON.parse(localStorage.getItem(key)||'{}');

  function render(stage){
    content.innerHTML='';
    stage.items.forEach(it=>{
      const row=document.createElement('div'); row.className='item';
      const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!!state[it.id];
      cb.onchange=()=>{state[it.id]=cb.checked;localStorage.setItem(key,JSON.stringify(state));};
      const body=document.createElement('div');
      body.innerHTML=`<strong>${it.title}</strong><br><small>${it.tip}</small>`;
      row.append(cb,body); content.append(row);
    });
  }

  data.stages.forEach((s,i)=>{
    const b=document.createElement('button'); b.className='stage-btn'+(i===0?' active':''); b.textContent=s.name;
    b.onclick=()=>{document.querySelectorAll('.stage-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(s)};
    tabs.append(b);
  });
  render(data.stages[0]);
}
load();
