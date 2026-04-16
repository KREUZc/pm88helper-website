async function renderAi(){
  const wrap=document.getElementById('ai-links');
  if(!wrap) return;
  const res=await fetch('data/ai.json');
  const data=await res.json();
  wrap.innerHTML='';

  const meta=document.createElement('div');
  meta.className='muted';
  meta.style.margin='0 0 8px';
  meta.textContent = data.updated ? `更新：${data.updated}` : '';
  if(meta.textContent) wrap.append(meta);

  const btnRow=document.createElement('div');
  btnRow.className='btns';

  (data.links||[]).forEach(l=>{
    const a=document.createElement('a');
    a.className='btn';
    a.textContent=l.url ? l.label : (l.label + '（待填）');
    if(l.url){
      a.href=l.url;
      a.target='_blank';
      a.rel='noopener';
    }else{
      a.href='#';
      a.setAttribute('aria-disabled','true');
      a.classList.add('btn-disabled');
    }
    btnRow.append(a);
  });
  wrap.append(btnRow);

  if((data.notes||[]).length){
    const ul=document.createElement('ul');
    ul.className='mini-notes';
    (data.notes||[]).forEach(t=>{
      const li=document.createElement('li');
      li.textContent=t;
      ul.append(li);
    });
    wrap.append(ul);
  }
}
renderAi();
