/* 와인 포도 품종 250 · 모바일 사전 (PDF 스타일) */
const DATA = window.WINE_DATA, REF = window.WINE_REF;
const CHO=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JAMO=new Set('ㄱㄲㄳㄴㄵㄶㄷㄸㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅃㅄㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split(''));
function choseong(s){let o='';for(const ch of s){const c=ch.charCodeAt(0);
  if(c>=0xAC00&&c<=0xD7A3)o+=CHO[Math.floor((c-0xAC00)/588)];else if(ch.trim())o+=ch;}return o;}
function isChoseongQuery(s){const t=s.replace(/\s/g,'');return t.length>0&&[...t].every(c=>JAMO.has(c));}
const SEG=['#6E1F2A','#8C2D39','#A8505B','#C07F88','#D6A9AF','#E3C3C7','#EAD2D7'];
const AXIS={'당도':'#E6D5B8','산도':'#D0D6B9','타닌':'#D3C2C8','바디':'#D3B4B3','알코올':'#E9CFB4'};
const SAXES=['당도','산도','타닌','바디','알코올'];
const LEVELS=['낮음','중간','높음'], AXES=['당도','산도','타닌','바디'];

const state={tab:'dict',q:'',f:{'당도':new Set(),'산도':new Set(),'타닌':new Set(),'바디':new Set()},
  mode:'AND',pair:null,ref:'terms'};

/* 포도 SVG (사진 대체) */
function grapeSVG(v){
  const red=v.color==='레드';
  const berry=red?'#7B1E2B':'#C8B24B', dark=red?'#4E1122':'#9A8A2E', hi=red?'#A64A63':'#E4DC9A';
  const leaf=red?'#5f7a44':'#6f8f4e';
  const pos=[[44,40],[60,40],[76,40],[52,55],[68,55],[60,70],[36,42],[84,42],[60,26]];
  let b='';for(const [x,y] of pos){b+=`<circle cx="${x}" cy="${y}" r="10" fill="${berry}" stroke="${dark}" stroke-width="1"/><circle cx="${x-3}" cy="${y-3}" r="3" fill="${hi}" opacity=".7"/>`;}
  return `<svg viewBox="0 0 120 120"><path d="M60 18 q-6 -10 -20 -12 q10 6 12 16 q6 -2 8 -4z" fill="${leaf}"/><rect x="58.5" y="8" width="3" height="14" rx="1.5" fill="#6b4a2b"/>${b}</svg>`;
}

/* 사진: 위키피디아 API (사용자 브라우저에서 실행) */
async function loadPhoto(v,el,mode){
  const key='wimg:'+v.q;let cached=null;try{cached=localStorage.getItem(key);}catch(e){}
  if(cached==='NONE')return;
  if(cached){applyImg(el,cached,v,mode);return;}
  try{
    const url='https://en.wikipedia.org/w/api.php?action=query&titles='+encodeURIComponent(v.q)+
      '&prop=pageimages&piprop=thumbnail&pithumbsize='+(mode==='big'?640:200)+'&format=json&origin=*&redirects=1';
    const r=await fetch(url);const j=await r.json();
    const pages=j.query&&j.query.pages;const p=pages&&Object.values(pages)[0];
    const src=p&&p.thumbnail&&p.thumbnail.source;
    if(src){try{localStorage.setItem(key,src);}catch(e){}applyImg(el,src,v,mode);}
    else{try{localStorage.setItem(key,'NONE');}catch(e){}}
  }catch(e){}
}
function applyImg(el,src,v,mode){
  if(!el)return;const img=new Image();
  img.onload=()=>{ if(mode==='big'){el.src=src;el.classList.add('show');}
    else{el.innerHTML='';const im=new Image();im.src=src;im.alt=v.ko;el.appendChild(im);} };
  img.onerror=()=>{};img.src=src;
}

/* 검색 + 필터 */
function matches(v){
  const q=state.q.trim();
  if(q){const ql=q.toLowerCase();let ok=false;
    if(v.ko.includes(q))ok=true;
    else if(v.en.toLowerCase().includes(ql))ok=true;
    else if(isChoseongQuery(q)&&v.cho.replace(/\s/g,'').includes(q.replace(/\s/g,'')))ok=true;
    if(!ok)return false;}
  const active=AXES.filter(a=>state.f[a].size>0);
  if(active.length===0)return true;
  const hits=active.map(a=>state.f[a].has(v.lv[a]));
  return state.mode==='AND'?hits.every(Boolean):hits.some(Boolean);
}
function results(){return DATA.filter(matches);}
const byNo=n=>DATA.find(v=>v.no===n);

/* 검색바 */
function renderSearch(){
  const el=document.getElementById('topsearch');
  if(state.tab!=='dict'){el.innerHTML='';return;}
  el.innerHTML=`
  <div class="search"><span class="ic">🔍</span>
    <input id="q" placeholder="한글·원문·초성(ㅋㅂㄹㄴ) 검색" value="${state.q.replace(/"/g,'&quot;')}" autocomplete="off">
    ${state.q?'<button class="clr" id="clr">×</button>':''}</div>
  <div class="filters">
    ${AXES.map(a=>`<div class="frow"><span class="axis">${a}</span>
      ${LEVELS.map(l=>`<span class="chip ${state.f[a].has(l)?'on':''}" data-ax="${a}" data-lv="${l}">${l}</span>`).join('')}</div>`).join('')}
    <div class="fmeta">
      <div class="mode"><button data-mode="AND" class="${state.mode==='AND'?'on':''}">모든 조건</button>
        <button data-mode="OR" class="${state.mode==='OR'?'on':''}">하나라도</button></div>
      <button class="reset" id="reset">필터 초기화</button></div>
  </div>`;
  const q=document.getElementById('q');
  q.oninput=e=>{state.q=e.target.value;renderList();syncClear();};
  const clr=document.getElementById('clr');if(clr)clr.onclick=()=>{state.q='';renderSearch();renderList();};
  el.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{const a=c.dataset.ax,l=c.dataset.lv;const s=state.f[a];s.has(l)?s.delete(l):s.add(l);renderSearch();renderList();});
  el.querySelectorAll('.mode button').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;renderSearch();renderList();});
  document.getElementById('reset').onclick=()=>{AXES.forEach(a=>state.f[a].clear());renderSearch();renderList();};
}
function syncClear(){const has=!!document.getElementById('clr');if(!!state.q!==has)renderSearch();}

/* 목록 */
function cardHTML(v){
  const cls=v.color==='레드'?'red':'white';
  return `<div class="card" data-no="${v.no}">
    <div class="chead">
      <div class="thumb" data-photo="${v.no}">${grapeSVG(v)}</div>
      <div class="ct">
        <div class="cn"><span class="cno">No.${v.no}</span> <span class="dot ${cls}">●</span> ${v.ko}
          <span class="badge ${cls}">${v.color}</span></div>
        <div class="cen">${v.en}</div>
        <div class="ctag">${v.tagline}</div>
        <div class="pillrow">
          <span class="pill">당도 ${v.lv['당도']}</span><span class="pill">산도 ${v.lv['산도']}</span>
          <span class="pill">타닌 ${v.lv['타닌']}</span><span class="pill">바디 ${v.lv['바디']}</span>
          <span class="pill">${v.serving}</span></div>
      </div></div></div>`;
}
function renderList(){
  if(state.tab!=='dict')return;
  const r=results();const view=document.getElementById('view');
  view.innerHTML=`<div class="count">${r.length}개 품종</div>`+
    (r.length?r.map(cardHTML).join(''):'<div class="empty">검색 결과가 없습니다.<br>필터를 조정해 보세요.</div>');
  view.querySelectorAll('.card').forEach(c=>c.onclick=()=>openDetail(+c.dataset.no));
  view.querySelectorAll('.thumb[data-photo]').forEach(t=>loadPhoto(byNo(+t.dataset.photo),t,'thumb'));
}

/* 상세 — PDF 카드 스타일 */
function structBars(v){
  return SAXES.map(k=>{const val=v.structure[k];const w=Math.max(3,Math.min(100,val));
    return `<div class="srow"><div class="sfill" style="width:${w}%;background:${AXIS[k]}"></div>
      <span class="slab"><b>${k}</b> ${val}</span></div>`;}).join('');
}
function detailHTML(v){
  const cls=v.color==='레드'?'red':'white';
  const abar=v.aromas.map((a,i)=>`<i style="width:${a.pct}%;background:${SEG[i%SEG.length]}"></i>`).join('');
  const leg=v.aromas.map((a,i)=>`<span><i style="background:${SEG[i%SEG.length]}"></i>${a.label} ${a.pct}%</span>`).join('');
  const kv=(k,val)=>`<div class="kv"><span class="k">${k}</span><span class="v">${val}</span></div>`;
  return `<div class="shead">
    <div class="thumb" data-photo="${v.no}">${grapeSVG(v)}</div>
    <div class="ct"><div class="cn"><span class="cno">No.${v.no}</span> <span class="dot ${cls}">●</span> ${v.ko}
      <span class="badge ${cls}">${v.color}</span></div><div class="cen">${v.en}</div></div>
    <button class="x" id="closeM">×</button></div>
  <div class="sbody">
    <img class="photo" id="bigphoto" alt="${v.ko}">
    <div class="stag">${v.tagline}</div>
    <div class="two">
      <div class="col"><div class="sect">구조 <span class="mini">0-100</span></div>${structBars(v)}</div>
      <div class="col"><div class="sect">맛·향 구성 <span class="mini">합 100%</span></div>
        <div class="abar">${abar}</div><div class="legend">${leg}</div></div>
    </div>
    <div class="sect">품종 정보</div>
    ${kv('고향',v.origin)}${kv('유래',v.lineage)}${kv('주요 산지',v.regions)}${kv('마리아주',v.mariage)}${kv('시음 온도',v.serving)}
    <div class="cbox"><b>재배방식</b> ${v.cultivation}</div>
    <div class="cbox"><b>떼루아</b> ${v.terroir}</div>
    <div class="sect">특징 · 식별 단서</div>
    <div class="feat">${v.feature}</div>
  </div>`;
}
function openDetail(no){
  const v=byNo(no);const m=document.getElementById('modal'),s=document.getElementById('sheet');
  s.innerHTML=detailHTML(v);m.classList.add('open');s.scrollTop=0;
  document.getElementById('closeM').onclick=closeDetail;
  const t=s.querySelector('.thumb[data-photo]');if(t)loadPhoto(v,t,'thumb');
  const big=document.getElementById('bigphoto');if(big)loadPhoto(v,big,'big');
}
function closeDetail(){document.getElementById('modal').classList.remove('open');}
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeDetail();};

/* 마리아주 추천 */
const PAIRS=[
  {n:'스테이크·소고기',e:'🥩',kw:['스테이크','소고기','비프','뵈프','굴라시','소갈비','갈비','티본'],color:'레드',body:'높음'},
  {n:'양고기',e:'🐑',kw:['양고기','양갈비','양','램','케밥','호로바츠','수블라키'],color:'레드',body:'높음'},
  {n:'돼지고기·샤퀴테리',e:'🥓',kw:['돼지','포크','삼겹','베이컨','소시지','살시차','살루미','샤퀴테리','이베리코','초리소','은두야','소브라사다','미치','살라미','프로슈토','하몽'],color:'레드',body:'중간'},
  {n:'닭·오리 가금류',e:'🍗',kw:['닭','치킨','오리','가금','가금류','로스트'],color:'레드',body:'중간'},
  {n:'해산물·조개',e:'🦪',kw:['해산물','조개','굴','문어','새우','오징어','보타르가','정어리','참치','게'],color:'화이트',body:'낮음'},
  {n:'생선구이',e:'🐟',kw:['생선','흰살','흰살생선','연어','민물생선','훈제 생선','카르파초','그릴 생선'],color:'화이트',body:'중간'},
  {n:'파스타·토마토',e:'🍝',kw:['파스타','라구','토마토','미트소스','볼로','스파게티','리소토'],color:'레드',body:'중간'},
  {n:'치즈',e:'🧀',kw:['치즈','경성치즈','블루치즈','염소','페타','할루미','브리','카초','그라비에라','페코리노','모차렐라','라클레트','퐁뒤','에푸아스','프리코'],color:null,body:null},
  {n:'매운·향신료',e:'🌶️',kw:['매운','향신료','케밥','굴라시','아시아','홍샤오','매운 스튜','커리','쿠스쿠스'],color:null,body:null},
  {n:'디저트·초콜릿',e:'🍫',kw:['디저트','초콜릿','견과','캐러멜','꿀','과일 디저트','페이스트리','블루치즈','푸아그라','말린 과일'],color:null,body:null},
  {n:'샐러드·채소',e:'🥗',kw:['샐러드','채소','그릴 채소','아스파라거스','라타투이','카포나타','올리브','메제','가지'],color:'화이트',body:'낮음'},
  {n:'버섯·트러플',e:'🍄',kw:['버섯','트러플','송로','리소토'],color:null,body:null},
];
function scoreVariety(v,cat){
  let sc=0;for(const k of cat.kw){if(v.mariage.includes(k))sc+=3;}
  if(sc===0)return null;
  if(cat.color&&v.color===cat.color)sc+=1.2;
  if(cat.body&&v.lv['바디']===cat.body)sc+=1;
  if(cat.n.includes('디저트')&&(v.tagline.includes('스위트')||v.tagline.includes('주정강화')||v.structure['당도']>=30))sc+=1.5;
  return {v,sc};
}
function renderPair(){
  const view=document.getElementById('view');
  let html=`<div class="count">음식을 고르면 어울리는 품종 <b>Top 3</b>를 추천합니다</div>
    <div class="pcats">${PAIRS.map((p,i)=>`<div class="pcat ${state.pair===i?'on':''}" data-p="${i}"><span class="pe">${p.e}</span>${p.n}</div>`).join('')}</div>`;
  if(state.pair!==null){
    const cat=PAIRS[state.pair];
    let list=DATA.map(v=>scoreVariety(v,cat)).filter(Boolean).sort((a,b)=>b.sc-a.sc).slice(0,3);
    const medals=['🥇','🥈','🥉'];
    html+=`<div class="crurank">${cat.e} ${cat.n} · 추천 Top 3</div>`;
    html+=list.map((r,i)=>{const v=r.v;const cls=v.color==='레드'?'red':'white';
      return `<div class="rank" data-no="${v.no}"><div class="medal">${medals[i]}</div>
        <div class="thumb" data-photo="${v.no}" style="width:46px;height:46px;flex:0 0 46px">${grapeSVG(v)}</div>
        <div class="ct"><div class="cn" style="font-size:15px">${v.ko} <span class="badge ${cls}">${v.color}</span></div>
          <div class="cen">${v.en} · ${v.serving}</div><div class="why">${v.mariage}</div></div></div>`;}).join('');
    if(!list.length)html+='<div class="empty">해당 음식에 매칭되는 품종이 없습니다.</div>';
  }
  view.innerHTML=html;
  view.querySelectorAll('.pcat').forEach(c=>c.onclick=()=>{state.pair=+c.dataset.p;renderPair();});
  view.querySelectorAll('.rank').forEach(c=>c.onclick=()=>openDetail(+c.dataset.no));
  view.querySelectorAll('.thumb[data-photo]').forEach(t=>loadPhoto(byNo(+t.dataset.photo),t,'thumb'));
}

/* 용어·등급·Cru */
function renderRef(){
  const view=document.getElementById('view');
  const tabs=[['terms','용어집'],['class','등급제'],['regions','지역별'],['crus','Cru 순위']];
  let html=`<div class="reftabs">${tabs.map(t=>`<span class="reftab ${state.ref===t[0]?'on':''}" data-r="${t[0]}">${t[1]}</span>`).join('')}</div>`;
  if(state.ref==='terms'){
    html+=REF.terms.map(t=>`<div class="term"><b>${t[0]}</b> <span class="en">${t[1]}</span><p>${t[2]}</p></div>`).join('');
  }else if(state.ref==='class'){
    for(const c of [REF.class_fr,REF.class_it,REF.class_de]){
      html+=`<div class="refhd">${c.title}</div><div class="term"><p>${c.intro}</p></div>`;
      const blk=(title,arr)=>{if(!arr)return '';return `<div class="crurank">${title}</div>`+arr.map(a=>`<div class="term"><b>${a[0]}</b><p>${a[1]}</p></div>`).join('');};
      html+=blk('전국 품질 등급',c.national)+blk('지역 등급·표기',c.regional)+blk('Prädikat 6단계',c.pradikat)+blk('VDP 분류·당도',c.vdp);
    }
  }else if(state.ref==='regions'){
    html+=`<div class="refhd">CHAPTER 5 · FRANCE</div>`+REF.fr_regions.map(r=>`<div class="term"><b>${r[0]}</b><p>${r[1]}</p></div>`).join('');
  }else{
    for(const c of REF.crus){
      html+=`<div class="refhd">${c.region}</div><div class="term"><p>${c.note}</p></div>`;
      for(const [rank,items] of c.ranks){
        html+=`<div class="crurank">${rank}</div>`+items.map(a=>`<div class="term"><b>${a[0]}</b><p>${a[1]}</p></div>`).join('');
      }
    }
  }
  view.innerHTML=html;
  view.querySelectorAll('.reftab').forEach(t=>t.onclick=()=>{state.ref=t.dataset.r;renderRef();window.scrollTo(0,0);});
}

function render(){
  renderSearch();
  if(state.tab==='dict')renderList();
  else if(state.tab==='pair')renderPair();
  else renderRef();
}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('nav button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');state.tab=b.dataset.tab;window.scrollTo(0,0);render();});

render();
if('serviceWorker'in navigator&&location.protocol.startsWith('http')){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
