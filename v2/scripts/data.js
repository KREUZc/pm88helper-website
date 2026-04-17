async function loadJson(path){
  const res = await fetch(path);
  return await res.json();
}

function el(tag, attrs={}, children=[]){
  const n=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') n.className=v;
    else if(k==='html') n.innerHTML=v;
    else n.setAttribute(k,v);
  });
  children.forEach(c=> n.append(c));
  return n;
}

function renderUpdatedLine(updated){
  if(!updated) return null;
  return el('div',{class:'muted',html:`更新：${updated}`});
}

async function renderSubsidy(){
  const wrap=document.getElementById('subsidy-content');
  if(!wrap) return;
  const data=await loadJson('data/subsidy.json');
  wrap.innerHTML='';

  const updatedLine = renderUpdatedLine(data.updated);
  if(updatedLine){
    updatedLine.style.margin='0 0 8px';
    wrap.append(updatedLine);
  }

  if(data.central){
    const srcLinks=(data.central.sources||[])
      .filter(x=>x.url)
      .map(x=> el('a',{href:x.url,target:'_blank',rel:'noopener',class:'pill',html:x.label||'來源'}));
    wrap.append(el('div',{class:'mini-block'},[
      el('div',{class:'mini-title',html:data.central.title||'中央'}),
      el('div',{class:'mini-summary',html:data.central.summary||''}),
      el('div',{class:'mini-links'},srcLinks)
    ]));
  }

  (data.locals||[]).forEach(it=>{
    const links=[];
    if(it.official_url){
      links.push(el('a',{href:it.official_url,target:'_blank',rel:'noopener',class:'pill',html:'官方來源'}));
    }
    const block=el('div',{class:'mini-block'},[
      el('div',{class:'mini-title',html:`${it.city}｜${it.has_local_subsidy||''}`}),
      el('div',{class:'mini-summary',html:it.summary||''}),
      el('div',{class:'mini-links'},links)
    ]);
    wrap.append(block);
  });

  const notes=(data.notes||[]).map(t=> el('li',{html:t}));
  if(notes.length){
    wrap.append(el('ul',{class:'mini-notes'},notes));
  }
}

async function renderVaccine(){
  const wrap=document.getElementById('vaccine-content');
  if(!wrap) return;
  const data=await loadJson('data/vaccine.json');
  wrap.innerHTML='';

  const updatedLine = renderUpdatedLine(data.updated);
  if(updatedLine){
    updatedLine.style.margin='0 0 8px';
    wrap.append(updatedLine);
  }

  const srcWrap = document.createElement('div');
  srcWrap.className = 'mini-links';
  (data.sources||[]).filter(x=>x.url).forEach(s=>{
    const a=document.createElement('a');
    a.className='pill'; a.href=s.url; a.target='_blank'; a.rel='noopener'; a.textContent=s.label||'來源';
    srcWrap.append(a);
  });
  if(srcWrap.childNodes.length){
    wrap.append(el('div',{class:'mini-block'},[
      el('div',{class:'mini-title',html:'官方來源'}),
      srcWrap
    ]));
  }

  (data.timeline||[]).forEach(row=>{
    const items=(row.items||[]).map(t=> el('li',{html:t}));
    wrap.append(el('div',{class:'mini-block'},[
      el('div',{class:'mini-title',html:row.age}),
      el('ul',{class:'mini-list'},items)
    ]));
  });

  const notes=(data.notes||[]).map(t=> el('li',{html:t}));
  if(notes.length){
    wrap.append(el('ul',{class:'mini-notes'},notes));
  }
}

renderSubsidy();
renderVaccine();
