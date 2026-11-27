// Kreator planu: 7 kroków (cel, poziom, partie z priorytetami, dni i czas, sprzęt, ograniczenia, podgląd) i opcjonalne dopracowanie przez AI.
// Korzysta z globalnych danych i funkcji aplikacji (S, ui, DB, DB_FLAT, EQUIP, SUBGROUPS, leadSub, loadOf, findEx, save, render, toast, esc, uid, norm).
(function(){
const GOALS={
  masa:{l:'Masa mięśniowa',d:'Więcej mięśni. 8–12 powtórzeń, przerwy ok. 1,5 min.',reps:10,range:'8–12',rest:90,spe:3},
  sila:{l:'Siła',d:'Większe ciężary. 3–6 powtórzeń w głównych bojach, przerwy 2–3 min.',reps:5,acc:8,range:'3–6',rest:180,spe:4},
  rzezba:{l:'Rzeźba',d:'Utrzymanie mięśni przy redukcji. 12–15 powtórzeń, krótkie przerwy.',reps:12,range:'12–15',rest:60,spe:3},
  forma:{l:'Ogólna forma',d:'Zdrowie i sprawność. 10–15 powtórzeń, umiarkowana objętość.',reps:12,range:'10–15',rest:60,spe:3}
};
const LEVELS={
  pocz:{l:'Początkujący',d:'Do roku regularnych treningów.',cap:12,min:4},
  sred:{l:'Średniozaawansowany',d:'1–3 lata, znasz technikę podstawowych ćwiczeń.',cap:18,min:6},
  zaaw:{l:'Zaawansowany',d:'Ponad 3 lata, potrzebujesz większej objętości.',cap:24,min:8}
};
const SPLITS={
  fbw:{l:'FBW (całe ciało)',days:n=>Array.from({length:n},(_,i)=>({name:'FBW '+'ABC'[i%3],groups:'all'}))},
  gd:{l:'Góra / Dół',days:n=>Array.from({length:n},(_,i)=>({name:(i%2?'Dół':'Góra')+' '+'AB'[Math.floor(i/2)%2],groups:i%2?'lower':'upper'}))},
  ppl:{l:'Push / Pull / Nogi',days:n=>{const b=[{name:'Push',groups:'push'},{name:'Pull',groups:'pull'},{name:'Nogi',groups:'legs'}];
    if(n===5)return[...b,{name:'Góra',groups:'upper'},{name:'Dół',groups:'lower'}];
    return Array.from({length:n},(_,i)=>({...b[i%3],name:b[i%3].name+(n>3?' '+'AB'[Math.floor(i/3)]:'')}))}}
};
const DAYGROUPS={
  upper:['Chest','Back','Shoulders','Biceps','Triceps','Forearms'],
  lower:['Quads','Hamstrings & Glutes','Calves','Core','Full Body & Conditioning'],
  push:['Chest','Shoulders','Triceps'],pull:['Back','Biceps','Forearms'],
  legs:['Quads','Hamstrings & Glutes','Calves','Core','Full Body & Conditioning']
};
const INJ=[
  ['bark','Bark',(i,l)=>(l.df||0)>=3||(l.ds||0)>=3||/nad głow|żołniersk|zza karku|na rękach|rwanie|podrzut|push press|arnold|poręcz/i.test(i.pl)],
  ['lokiec','Łokieć',(i,l)=>(i.groupEn==='Biceps'||i.groupEn==='Triceps')&&/francusk|JM|nad głow|wąsko|modlitewn|sztang/i.test(i.pl)],
  ['nadgarstek','Nadgarstek',(i,l)=>i.groupEn==='Forearms'||/nadgarst|przedni|pompki|farmer|zarzut|rwanie|podrzut|stani/i.test(i.pl)],
  ['ledzwie','Dolny odcinek pleców',(i,l)=>(l.er||0)>=3||/martwy|dzień dobry|wiosłowanie sztangą|pendlay|swing|good morning|zarzut|rwanie/i.test(i.pl)],
  ['kolano','Kolano',(i,l)=>/przysiad|wykrok|bułgarsk|skok|pistolet|sissy|prostowanie nóg|wejścia|thruster|burpee/i.test(i.pl)],
  ['biodro','Biodro',(i,l)=>/sumo|odwodzenie|przywodzenie|wykrok|bułgarsk|pistolet/i.test(i.pl)]
];
// mięśnie: 1 = odciąż (pomijam ćwiczenia, w których mięsień pracuje jako główny), 2 = omijaj (pomijam też te, w których pomaga)
const MUSC=[['klatka','Klatka piersiowa',['cu','cm','cl']],['barki','Naramienne (barki)',['df','ds','dr']],['kaptury','Czworoboczny (kaptury)',['tu','tm','tl']],
  ['najszerszy','Najszerszy grzbietu',['la']],['rotatory','Rotatory barku',['ro']],['biceps','Biceps i ramienny',['bl','bs','br']],['triceps','Triceps',['tlo','tla','tme']],
  ['przedramie','Przedramię',['ff','fe','brr']],['prostownik','Prostownik grzbietu',['er']],['brzuch','Brzuch i skośne',['ab','ob']],['posladki','Pośladki',['gx','gm']],
  ['czworoglowy','Czworogłowy uda',['rf','vl','vm']],['dwuglowy','Dwugłowy uda (tył uda)',['bf','se']],['przywodziciele','Przywodziciele',['ad']],['lydki','Łydki',['gmd','glt','so','ti']]];
const MUS_L={1:'Odciąż',2:'Omijaj'};
const PRESETS=[['silownia','Pełna siłownia',[]],['dom','Dom z hantlami',['sztanga','wyciąg','maszyna']],['bw','Masa ciała',['sztanga','hantle','kettlebell','wyciąg','maszyna','inne']]];

function fresh(){return{step:1,goal:'masa',level:'sred',pr:{},days:3,min:60,split:null,noEq:[],inj:[],mus:{},noEx:[],plan:null,name:'',active:true,swap:null,wish:'',busy:false,err:'',aiNote:''}}
const W=()=>ui.wiz;
const recSplit=n=>n<=3?'fbw':n===4?'gd':'ppl';

/* ---------- priorytety partii (suma 100) ---------- */
function normalize(pr,fixed){
  const keys=Object.keys(pr);if(!keys.length)return pr;
  const others=keys.filter(k=>k!==fixed),left=100-(fixed?pr[fixed]:0),sum=others.reduce((s,k)=>s+pr[k],0);
  others.forEach(k=>pr[k]=sum>0?pr[k]*left/sum:left/others.length);
  keys.forEach(k=>pr[k]=Math.max(0,Math.round(pr[k])));
  const diff=100-keys.reduce((s,k)=>s+pr[k],0);
  if(diff){const t=(others.length?others:keys).slice().sort((a,b)=>pr[b]-pr[a])[0];pr[t]=Math.max(0,pr[t]+diff)}
  return pr;
}
function toggleGroup(en){const w=W();if(en in w.pr)delete w.pr[en];else{const n=Object.keys(w.pr).length+1;w.pr[en]=100/n}normalize(w.pr,(en in w.pr)?en:null);w.plan=null}

/* ---------- dobór ćwiczeń ---------- */
function allowed(){
  const w=W(),no=new Set(w.noEx.map(norm)),inj=INJ.filter(x=>w.inj.includes(x[0])),mus=MUSC.filter(m=>w.mus?.[m[0]]);
  const hitM=l=>mus.some(m=>m[2].some(id=>(l[id]||0)>=(w.mus[m[0]]===2?2:3)));
  return DB_FLAT.filter(i=>{if(w.noEq.includes(i.eq)||no.has(norm(i.pl)))return false;const l=loadOf(i.pl)||{};return !inj.some(x=>x[2](i,l))&&!hitM(l)});
}
function score(i,goal){const l=loadOf(i.pl)||{};const big=Object.values(l).filter(v=>v>=2).length;return big+(goal==='sila'&&i.eq==='sztanga'?3:0)+(i.eq==='maszyna'||i.eq==='wyciąg'?-.5:0)}
function build(){
  const w=W(),g=GOALS[w.goal],lv=LEVELS[w.level],split=w.split||recSplit(w.days);
  const days=SPLITS[split].days(w.days).map(d=>({...d,groups:d.groups==='all'?Object.keys(w.pr):DAYGROUPS[d.groups].filter(x=>x in w.pr),ex:[]}));
  // partie bez dnia (np. wybrany tylko „Brzuch” przy PPL) dopisujemy do dnia z najmniejszą liczbą partii
  Object.keys(w.pr).forEach(en=>{if(!days.some(d=>d.groups.includes(en)))days.slice().sort((a,b)=>a.groups.length-b.groups.length)[0].groups.push(en)});
  const perSession=Math.max(8,Math.floor((w.min-8)*60/(g.rest+40))),total=perSession*w.days;
  const weekly={};Object.entries(w.pr).forEach(([en,p])=>{if(p<=0)return;weekly[en]=Math.min(lv.cap,Math.max(lv.min,Math.round(total*p/100)))});
  const pool=allowed(),used={};
  for(const [en,sets] of Object.entries(weekly)){
    const ds=days.filter(d=>d.groups.includes(en));if(!ds.length)continue;
    const cand=pool.filter(i=>i.groupEn===en).sort((a,b)=>score(b,w.goal)-score(a,w.goal));if(!cand.length)continue;
    const per=Math.floor(sets/ds.length),extra=sets%ds.length;
    ds.forEach((d,di)=>{
      let s=per+(di<extra?1:0);if(s<=0)return;
      const n=Math.max(1,Math.round(s/g.spe)),subs=new Set();
      for(let e=0;e<n;e++){
        const pick=cand.slice().sort((a,b)=>(used[a.pl]||0)-(used[b.pl]||0)||(subs.has(leadSub(a,en))?1:0)-(subs.has(leadSub(b,en))?1:0)||score(b,w.goal)-score(a,w.goal)).find(i=>!d.ex.some(x=>x.name===i.pl));
        if(!pick)break;used[pick.pl]=(used[pick.pl]||0)+1;subs.add(leadSub(pick,en));
        const ss=Math.round(s/(n-e));s-=ss;
        const main=w.goal==='sila'&&e===0&&score(pick,w.goal)>=5;
        d.ex.push({name:pick.pl,group:en,sets:ss,reps:w.goal==='sila'&&!main?g.acc:g.reps,rest:w.goal==='sila'&&!main?120:g.rest,sc:score(pick,w.goal)});
      }
    });
  }
  days.forEach(d=>sortDay(d.ex));
  w.plan={split,days:days.map(d=>({name:d.name,ex:d.ex}))};
  if(!w.name)w.name=`${GOALS[w.goal].l} · ${SPLITS[split].l.split(' (')[0]} ${w.days}×`;
}
// kolejność w dniu: partiami, od dużych do małych (np. Push: klatka, barki, triceps), w partii od ćwiczeń wielostawowych
const ORDER=['Chest','Back','Quads','Hamstrings & Glutes','Shoulders','Triceps','Biceps','Forearms','Calves','Core','Full Body & Conditioning'];
const gOf=e=>findEx(e.name)?.groupEn||e.group;
function sortDay(ex){const sc=e=>e.sc??score(findEx(e.name)||{pl:e.name},W().goal);return ex.sort((a,b)=>ORDER.indexOf(gOf(a))-ORDER.indexOf(gOf(b))||sc(b)-sc(a))}
function alternatives(name,groupEn){
  const it=findEx(name),sub=it?leadSub(it,groupEn):-1,inPlan=new Set(W().plan.days.flatMap(d=>d.ex.map(e=>e.name)));
  return allowed().filter(i=>i.groupEn===groupEn&&!inPlan.has(i.pl)).sort((a,b)=>(leadSub(b,groupEn)===sub)-(leadSub(a,groupEn)===sub)||score(b,W().goal)-score(a,W().goal)).slice(0,6);
}
const weeklySets=()=>{const o={};W().plan.days.forEach(d=>d.ex.forEach(e=>{const g=findEx(e.name)?.groupEn||e.group;o[g]=(o[g]||0)+e.sets}));return o};
const minutes=d=>Math.round(8+d.ex.reduce((s,e)=>s+e.sets*((e.rest||90)+40),0)/60);

/* ---------- widok ---------- */
const STEPS=['Cel','Poziom','Partie','Dni i czas','Sprzęt','Ograniczenia','Podgląd'];
const opt=(act,val,on,title,desc)=>`<button class="wz-opt${on?' on':''}" data-act="${act}" data-v="${esc(val)}" aria-pressed="${on}"><b>${title}</b>${desc?`<small>${desc}</small>`:''}</button>`;
function stepBody(){
  const w=W();
  if(w.step===1)return `<h3>Jaki jest Twój cel?</h3><p class="muted wz-p">Od celu zależą zakresy powtórzeń i długość przerw.</p><div class="wz-opts">${Object.entries(GOALS).map(([k,g])=>opt('wzGoal',k,w.goal===k,g.l,g.d)).join('')}</div>`;
  if(w.step===2)return `<h3>Jak długo trenujesz?</h3><p class="muted wz-p">Poziom decyduje o tygodniowej liczbie serii na partię.</p><div class="wz-opts">${Object.entries(LEVELS).map(([k,l])=>opt('wzLevel',k,w.level===k,l.l,`${l.d} Do ${l.cap} serii na partię w tygodniu.`)).join('')}</div>`;
  if(w.step===3){const keys=Object.keys(w.pr),sum=keys.reduce((s,k)=>s+w.pr[k],0);
    return `<h3>Które partie Cię interesują?</h3><p class="muted wz-p">Zaznacz partie, a suwakami rozdziel między nie priorytet. Suma zawsze wynosi 100.</p>
    <div class="row"><button class="ghost" data-act="wzAllGroups">Całe ciało</button>${keys.length?'<button class="ghost" data-act="wzNoGroups">Wyczyść</button>':''}</div>
    <div class="chips">${DB.map(g=>`<button data-act="wzGroup" data-v="${esc(g.en)}" aria-pressed="${g.en in w.pr}"><i class="wz-dot" style="background:${GROUP_COLOR[g.en]}"></i>${esc(g.group)}</button>`).join('')}</div>
    ${keys.length?`<div class="card wz-sliders">${keys.map(en=>{const g=DB.find(x=>x.en===en);return `<label class="wz-sl" for="wz-pr-${esc(en)}"><span class="wz-sl-h"><span><i class="wz-dot" style="background:${GROUP_COLOR[en]}"></i>${esc(g?g.group:en)}</span><b class="num" data-pr="${esc(en)}">${w.pr[en]}</b></span><input type="range" min="0" max="100" step="1" id="wz-pr-${esc(en)}" data-wzpr="${esc(en)}" value="${w.pr[en]}" style="--c:${GROUP_COLOR[en]}"></label>`}).join('')}
    <div class="row between wz-sum"><span class="eyebrow">Suma</span><b class="num" id="wz-sum">${sum}</b></div></div>`:'<p class="muted">Zaznacz co najmniej jedną partię.</p>'}`}
  if(w.step===4){const rec=recSplit(w.days),sp=w.split||rec;
    return `<h3>Ile treningów w tygodniu?</h3><div class="chips">${[2,3,4,5,6].map(n=>`<button data-act="wzDays" data-v="${n}" aria-pressed="${w.days===n}">${n}×</button>`).join('')}</div>
    <h3>Ile minut na trening?</h3><div class="chips">${[30,45,60,75,90].map(n=>`<button data-act="wzMin" data-v="${n}" aria-pressed="${w.min===n}">${n} min</button>`).join('')}</div>
    <h3>Podział</h3><p class="muted wz-p">Przy ${w.days} treningach w tygodniu polecam: <b>${SPLITS[rec].l}</b>. Możesz wybrać inny.</p>
    <div class="wz-opts">${Object.entries(SPLITS).map(([k,s])=>opt('wzSplit',k,sp===k,s.l+(k===rec?' · polecany':''),k==='fbw'?'Każdy trening obejmuje całe ciało.':k==='gd'?'Na zmianę góra i dół ciała.':'Pchanie, ciągnięcie i nogi w osobne dni.')).join('')}</div>`}
  if(w.step===5)return `<h3>Jaki sprzęt masz?</h3><p class="muted wz-p">Wyklucz każdy rodzaj sprzętu, którego nie chcesz albo nie masz.</p>
    <div class="row">${PRESETS.map(([k,l,no])=>`<button class="ghost" data-act="wzPreset" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="wz-eq">${EQUIP.map(([k,l])=>{const on=!w.noEq.includes(k);return `<button class="wz-eqb${on?'':' off'}" data-act="wzEq" data-v="${esc(k)}" aria-pressed="${on}">${eqIcon(k)}<span>${l}</span><small>${on?'Używam':'Wykluczony'}</small></button>`}).join('')}</div>
    <p class="muted wz-p">Dostępnych ćwiczeń: <b class="num">${allowed().length}</b> z ${DB_FLAT.length}.</p>`;
  if(w.step===6)return `<h3>Kontuzje i ograniczenia</h3><p class="muted wz-p">Zaznacz stawy i mięśnie, które Ci dokuczają. Pominę ćwiczenia, które najmocniej je obciążają.</p>
    <div class="eyebrow">Stawy</div><div class="chips wz-wrap">${INJ.map(([k,l])=>`<button data-act="wzInj" data-v="${k}" aria-pressed="${w.inj.includes(k)}">${l}</button>`).join('')}</div>
    <div class="eyebrow">Mięśnie</div><p class="muted wz-p">Stuknij raz, żeby <b>odciążyć</b> mięsień (pominę ćwiczenia, w których pracuje jako główny). Stuknij drugi raz, żeby go <b>omijać</b> (pominę też te, w których pomaga). Trzecie stuknięcie zdejmuje ograniczenie.</p>
    <div class="chips wz-wrap">${MUSC.map(([k,l])=>{const st=w.mus?.[k]||0;return `<button class="wz-mus${st?' s'+st:''}" data-act="wzMus" data-v="${k}" aria-pressed="${!!st}">${l}${st?` <small>· ${MUS_L[st]}</small>`:''}</button>`}).join('')}</div>
    <h3>Ćwiczenia, których nie robisz</h3>
    <form class="row" data-form="wzNoEx"><input id="wz-noex" list="ex-list-wz" placeholder="Zacznij pisać nazwę ćwiczenia" style="flex:1 1 180px"><button>Wyklucz</button></form>
    <datalist id="ex-list-wz">${DB_FLAT.map(i=>`<option value="${esc(i.pl)}">`).join('')}</datalist>
    ${w.noEx.length?`<div class="chips">${w.noEx.map(n=>`<button data-act="wzRmNoEx" data-v="${esc(n)}" aria-label="Przywróć ${esc(n)}">${esc(n)} ✕</button>`).join('')}</div>`:''}
    <p class="muted wz-p">Dostępnych ćwiczeń: <b class="num">${allowed().length}</b> z ${DB_FLAT.length}.</p>`;
  // krok 7: podgląd
  if(!w.plan)build();
  const ws=weeklySets(),mx=Math.max(1,...Object.values(ws)),g=GOALS[w.goal];
  const mode=typeof aiMode==='function'?aiMode():null;
  return `<h3>Twój plan</h3><p class="muted wz-p">${SPLITS[w.plan.split].l}, ${w.days}× w tygodniu, ok. ${w.min} min. Zakres ${g.range} powtórzeń, przerwy ok. ${g.rest>=120?Math.round(g.rest/60)+' min':g.rest+' s'}.</p>
  ${(()=>{const av=allowed(),miss=Object.keys(w.pr).filter(en=>w.pr[en]>0&&!av.some(i=>i.groupEn===en));return miss.length?`<div class="card wz-ainote"><b>Brakuje ćwiczeń</b><p style="margin:4px 0 0">Przy wybranym sprzęcie i ograniczeniach nie ma ćwiczeń dla: ${miss.map(en=>esc(DB.find(x=>x.en===en)?.group||en)).join(', ')}. Odblokuj sprzęt w kroku 5 albo zdejmij ograniczenie w kroku 6.</p></div>`:''})()}
  <div class="card wz-src${w.busy?' busy':''}">${w.busy?`<span class="wz-spin" aria-hidden="true"></span><div><b>${w.busy==='create'?'AI układa plan na podstawie Twoich odpowiedzi…':'AI dopracowuje plan…'}</b><small>Poniżej szkic ułożony automatycznie. Zwykle trwa to kilkanaście sekund.</small></div>`
    :`<div><b>${w.plan.src==='ai'?'Plan ułożony przez AI':'Plan ułożony automatycznie'}</b><small>${w.plan.src==='ai'?'Na podstawie Twoich odpowiedzi, tylko z dozwolonych ćwiczeń z bazy.':mode?'Możesz poprosić AI o ułożenie planu od podstaw.':'Dodaj klucz API w Ustawieniach, żeby układać plan z AI.'}</small></div>
    <div class="row">${mode?`<button class="${w.plan.src==='ai'?'':'primary'}" data-act="wzAICreate">${w.plan.src==='ai'?'Ułóż ponownie z AI':'Ułóż z AI'}</button>`:''}${w.plan.src==='ai'?'<button class="ghost" data-act="wzRebuild">Ułóż bez AI</button>':''}</div>`}</div>
  ${w.err?`<p class="aierr">${esc(w.err)}</p>`:''}
  ${w.aiNote?`<div class="card wz-ainote"><b>Uwagi AI</b><p style="margin:4px 0 0">${esc(w.aiNote)}</p></div>`:''}
  <div class="card"><div class="eyebrow">Serie na partię w tygodniu</div><div class="wz-bars">${Object.entries(ws).sort((a,b)=>b[1]-a[1]).map(([en,n])=>{const gr=DB.find(x=>x.en===en);return `<div class="wz-bar"><span>${esc(gr?gr.group:en)}</span><i style="--w:${(n/mx*100).toFixed(0)}%;--c:${GROUP_COLOR[en]||'var(--accent)'}"></i><b class="num">${n}</b></div>`}).join('')}</div></div>
  ${w.plan.days.map((d,di)=>`<div class="card"><div class="row between"><h3>${esc(d.name)}</h3><span class="muted num">ok. ${minutes(d)} min</span></div>
    ${d.ex.map((e,ei)=>{const sw=w.swap&&w.swap[0]===di&&w.swap[1]===ei;const gh=ei===0||gOf(d.ex[ei-1])!==gOf(e);return `${gh?`<div class="wz-gh"><i class="wz-dot" style="background:${GROUP_COLOR[gOf(e)]||'var(--muted)'}"></i>${esc(DB.find(x=>x.en===gOf(e))?.group||'')}</div>`:''}<div class="ex"><div><button class="exlink" data-act="exInfo" data-name="${esc(e.name)}">${esc(e.name)}</button><div class="en">${esc(DB.find(x=>x.en===(findEx(e.name)?.groupEn||e.group))?.group||'')}</div></div>
      <div class="row" style="flex-wrap:nowrap"><span class="num muted">${e.sets}×${e.reps}</span><button class="ghost" data-act="wzSwap" data-d="${di}" data-e="${ei}" aria-expanded="${sw}">Zamień</button><button class="ghost" data-act="wzRmEx" data-d="${di}" data-e="${ei}" aria-label="Usuń ${esc(e.name)}">✕</button></div></div>
      ${sw?`<div class="wz-swap"><div class="eyebrow">Sugerowane zamienniki</div><div class="chips">${alternatives(e.name,findEx(e.name)?.groupEn||e.group).map(a=>`<button data-act="wzPick" data-v="${esc(a.pl)}">${eqIcon(a.eq)}${esc(a.pl)}</button>`).join('')||'<span class="muted">Brak zamienników przy wybranym sprzęcie.</span>'}</div>
        <form class="row" data-form="wzPickOwn"><input id="wz-own" list="ex-list-wz7" placeholder="Albo wybierz dowolne z bazy" style="flex:1 1 180px"><button>Wstaw</button></form><datalist id="ex-list-wz7">${DB_FLAT.map(i=>`<option value="${esc(i.pl)}">${esc(i.group)}</option>`).join('')}</datalist></div>`:''}`}).join('')||'<p class="muted">Brak ćwiczeń dla tego dnia przy wybranych ustawieniach.</p>'}
  </div>`).join('')}
  <div class="card stack"><h3>Dopracuj z AI</h3><p class="muted wz-p">AI może poprawić dobór ćwiczeń, kolejność i objętość. Opcjonalnie dopisz życzenia.</p>
    <textarea id="wz-wish" placeholder="Np. więcej ćwiczeń na górę klatki, bez skłonów, krótsze treningi w piątek">${esc(w.wish)}</textarea>
    ${mode?`<div class="row"><button class="primary" data-act="wzAI" ${w.busy?'disabled':''}>${w.busy?'AI pracuje…':'Dopracuj z AI'}</button><span class="muted" style="font-size:.78rem">${mode==='claude'?'Przez Twoje konto Claude':'Przez Twój klucz API'}</span></div>`
      :`<p class="muted wz-p">AI działa z Twoim kluczem API. Dodaj go w Planuj, w części Ustawienia.</p>`}
</div>
  <div class="card stack"><label class="eyebrow" for="wz-name">Nazwa planu</label><input id="wz-name" value="${esc(w.name)}">
    <label class="row" style="gap:8px"><input type="checkbox" id="wz-active" ${w.active?'checked':''} style="width:auto"> Trenuj od razu tym planem</label>
    <div class="row"><button class="primary" data-act="wzSave">Zapisz plan</button></div></div>`;
}
window.viewKreator=function(){
  const w=W();
  const can=w.step!==3||Object.keys(w.pr).length>0;
  return `<section class="stack wz"><div class="row between"><button class="ghost back" data-act="wzClose">‹ Wyjdź z kreatora</button><span class="eyebrow">Krok ${w.step} z 7</span></div>
  <div><div class="eyebrow">Kreator planu</div><h2>${STEPS[w.step-1]}</h2></div>
  <ol class="wz-steps" aria-label="Kroki kreatora">${STEPS.map((s,i)=>`<li class="${i+1<w.step?'done':i+1===w.step?'on':''}"><button data-act="wzGo" data-v="${i+1}" ${i+1>w.step&&!can?'disabled':''} aria-label="Krok ${i+1}: ${s}"${i+1===w.step?' aria-current="step"':''}></button></li>`).join('')}</ol>
  <div class="stack">${stepBody()}</div>
  ${w.step<7?`<div class="row between wz-nav"><button data-act="wzGo" data-v="${w.step-1}" ${w.step===1?'disabled':''}>Wstecz</button><button class="primary" data-act="wzGo" data-v="${w.step+1}" ${can?'':'disabled'}>${w.step===6?'Pokaż plan':'Dalej'}</button></div>`:''}
  </section>`;
};

/* ---------- AI ---------- */
async function aiPlan(mode){
  const w=W(),names=allowed().map(i=>`${i.pl} [${i.groupEn}]`).join('; '),create=mode==='create';
  const ws=weeklySets();
  const prompt=`Jesteś doświadczonym trenerem personalnym. ${create?'Ułóż od podstaw tygodniowy plan treningowy na siłownię na podstawie odpowiedzi z kreatora.':'Dopracuj plan treningowy na siłownię.'} Odpowiadasz po polsku.
Cel: ${GOALS[w.goal].l} (${GOALS[w.goal].range} powtórzeń). Poziom: ${LEVELS[w.level].l}. Treningi: ${w.days} w tygodniu po ok. ${w.min} min. Podział: ${SPLITS[w.plan.split].l}.
Priorytety partii (suma 100): ${Object.entries(w.pr).map(([k,v])=>k+' '+v).join(', ')}.
Wykluczony sprzęt: ${w.noEq.join(', ')||'brak'}. Kontuzje stawów: ${INJ.filter(x=>w.inj.includes(x[0])).map(x=>x[1]).join(', ')||'brak'}. Mięśnie do odciążenia lub omijania: ${MUSC.filter(m=>w.mus?.[m[0]]).map(m=>m[1]+' ('+MUS_L[w.mus[m[0]]].toLowerCase()+')').join(', ')||'brak'}. Wykluczone ćwiczenia: ${w.noEx.join(', ')||'brak'}.
${w.wish?`Życzenia użytkownika: "${w.wish.replace(/"/g,"'")}"`:''}
${create?`Dni treningowe (zachowaj kolejność i nazwy): ${w.plan.days.map(d=>d.name).join(', ')}.
Docelowe serie na partię w tygodniu (wyliczone z czasu treningu i priorytetów, możesz lekko skorygować): ${Object.entries(ws).map(([k,v])=>k+' '+v).join(', ')}.
Mieść się w ok. ${w.min} min na trening przy przerwach ok. ${GOALS[w.goal].rest} s. Na początku dnia ćwiczenia wielostawowe, potem izolowane. Unikaj powtarzania tych samych ćwiczeń w różnych dniach, jeśli jest wybór.
Szkic do porównania (JSON): `:'Obecny plan (JSON): '}${JSON.stringify(w.plan.days.map(d=>({name:d.name,exercises:d.ex.map(e=>({name:e.name,sets:e.sets,reps:e.reps}))})))}
Używaj WYŁĄCZNIE ćwiczeń z tej listy, nazwy przepisuj dokładnie: ${names}.
Zachowaj liczbę dni treningowych. W każdym dniu grupuj ćwiczenia partiami, duże partie przed małymi (np. klatka, potem barki, potem triceps). Odpowiedz WYŁĄCZNIE obiektem JSON w formacie:
{"days":[{"name":"nazwa dnia","exercises":[{"name":"nazwa z listy","sets":3,"reps":10}]}],"note":"2–3 zdania po polsku: ${create?'jak ułożyłeś plan i dlaczego':'co zmieniłeś i dlaczego'}"}`;
  let out;
  if(typeof sampleApi!=='undefined'&&sampleApi)out=await sampleApi.json(prompt,{modelTier:'complex',cache:false});
  else{
    if(!S.ai?.key)throw new Error('Brak klucza API. Wpisz go w ustawieniach AI.');
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':S.ai.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:S.ai.model||'claude-opus-5-5',max_tokens:4000,output_config:{effort:'low'},messages:[{role:'user',content:prompt}]})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok){const m=data?.error?.message||res.statusText;throw new Error(res.status===401?'Klucz API jest nieprawidłowy.':res.status===429?'Za dużo zapytań, spróbuj za chwilę.':'Błąd API: '+m)}
    out=parseJson((data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join(''));
  }
  if(!out||!Array.isArray(out.days)||!out.days.length)throw new Error('AI nie zwróciło planu w oczekiwanym formacie.');
  const ok=new Map(allowed().map(i=>[norm(i.pl),i]));let dropped=0;
  const days=out.days.map(d=>({name:String(d.name||'Dzień').slice(0,40),ex:(d.exercises||[]).map(e=>{const it=ok.get(norm(e.name));if(!it){dropped++;return null}
    return{name:it.pl,group:it.groupEn,sets:Math.max(1,Math.min(8,+e.sets||3)),reps:Math.max(1,Math.min(50,+e.reps||10)),rest:GOALS[w.goal].rest,sc:0}}).filter(Boolean)}));
  days.forEach(d=>sortDay(d.ex));w.plan={split:w.plan.split,days,src:'ai'};w.aiNote=String(out.note||'')+(dropped?` (Pominięto ${dropped} ćwiczeń spoza bazy lub wykluczonych.)`:'');
}

const aiOn=()=>typeof aiMode==='function'&&!!aiMode();
function runAI(mode){const w=W();if(!w||w.busy)return;w.busy=mode;w.err='';
  if(mode==='create'){w.plan=null;build()}
  aiPlan(mode).catch(err=>{w.err=(mode==='create'?'Nie udało się ułożyć planu z AI, pokazuję plan ułożony automatycznie. ':'')+(err?.message||'Nie udało się połączyć z AI.')}).finally(()=>{w.busy=false;if(ui.wiz===w)render()})}
/* ---------- zdarzenia ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='wzOpen'){ui.wiz=fresh();scrollTo(0,0);return}
  if(!a.startsWith('wz')||!ui.wiz)return;
  const w=W(),v=b.dataset.v;
  const dirty=()=>{w.plan=null;w.swap=null;w.aiNote=''};
  if(a==='wzClose'){ui.wiz=null}
  else if(a==='wzGo'){const n=+v;if(n>=1&&n<=7){const fresh7=n===7&&!w.plan;if(n===7&&!w.plan)build();w.step=n;scrollTo(0,0);if(fresh7&&aiOn())runAI('create')}}
  else if(a==='wzAICreate'){runAI('create')}
  else if(a==='wzGoal'){w.goal=v;dirty()}
  else if(a==='wzLevel'){w.level=v;dirty()}
  else if(a==='wzGroup'){toggleGroup(v);dirty()}
  else if(a==='wzAllGroups'){w.pr={};DB.forEach(g=>w.pr[g.en]=1);normalize(w.pr);dirty()}
  else if(a==='wzNoGroups'){w.pr={};dirty()}
  else if(a==='wzDays'){w.days=+v;w.split=null;dirty()}
  else if(a==='wzMin'){w.min=+v;dirty()}
  else if(a==='wzSplit'){w.split=v;dirty()}
  else if(a==='wzEq'){w.noEq=w.noEq.includes(v)?w.noEq.filter(x=>x!==v):[...w.noEq,v];dirty()}
  else if(a==='wzPreset'){w.noEq=(PRESETS.find(p=>p[0]===v)||[,,[]])[2].slice();dirty()}
  else if(a==='wzMus'){w.mus=w.mus||{};const n=((w.mus[v]||0)+1)%3;if(n)w.mus[v]=n;else delete w.mus[v];dirty()}
  else if(a==='wzInj'){w.inj=w.inj.includes(v)?w.inj.filter(x=>x!==v):[...w.inj,v];dirty()}
  else if(a==='wzRmNoEx'){w.noEx=w.noEx.filter(x=>x!==v);dirty()}
  else if(a==='wzSwap'){const k=[+b.dataset.d,+b.dataset.e];w.swap=w.swap&&w.swap[0]===k[0]&&w.swap[1]===k[1]?null:k}
  else if(a==='wzPick'){const [di,ei]=w.swap||[];const ex=w.plan.days[di]?.ex[ei];const it=findEx(v);if(ex&&it){ex.name=it.pl;ex.group=it.groupEn;ex.sc=undefined;sortDay(w.plan.days[di].ex)}w.swap=null}
  else if(a==='wzRmEx'){w.plan.days[+b.dataset.d].ex.splice(+b.dataset.e,1);w.swap=null}
  else if(a==='wzRebuild'){if(w.busy)return;w.plan=null;w.aiNote='';w.err='';build()}
  else if(a==='wzAI'){runAI('refine')}
  else if(a==='wzSave'){if(w.busy){toast('Poczekaj, aż AI skończy układać plan');return}
    const p={id:uid(),name:(w.name||'Mój plan').trim(),days:w.plan.days.filter(d=>d.ex.length).map(d=>({id:uid(),name:d.name,exercises:d.ex.map(x=>({id:uid(),name:x.name,sets:x.sets,reps:x.reps,rest:x.rest}))}))};
    if(!p.days.length){toast('Plan nie ma ćwiczeń');return}
    S.plans.push(p);if(w.active||!S.activePlan)S.activePlan=p.id;save();ui.wiz=null;ui.planId=p.id;scrollTo(0,0);toast('Zapisano plan: '+p.name)}
},true);
document.addEventListener('input',e=>{
  if(!ui.wiz)return;const t=e.target,w=W();
  if(t.dataset.wzpr){const en=t.dataset.wzpr;w.pr[en]=+t.value;normalize(w.pr,en);w.plan=null;
    document.querySelectorAll('[data-wzpr]').forEach(s=>{if(s!==t)s.value=w.pr[s.dataset.wzpr]});
    document.querySelectorAll('[data-pr]').forEach(x=>x.textContent=w.pr[x.dataset.pr]);
    const sm=document.getElementById('wz-sum');if(sm)sm.textContent=Object.values(w.pr).reduce((s,x)=>s+x,0)}
  if(t.id==='wz-name')w.name=t.value;
  if(t.id==='wz-wish')w.wish=t.value;
  if(t.id==='wz-active')w.active=t.checked;
});
document.addEventListener('change',e=>{if(ui.wiz&&e.target.id==='wz-active')ui.wiz.active=e.target.checked});
document.addEventListener('submit',e=>{
  const f=e.target;if(!ui.wiz||!f.dataset.form?.startsWith('wz'))return;e.preventDefault();e.stopImmediatePropagation();const w=W();
  if(f.dataset.form==='wzNoEx'){const it=findEx(document.getElementById('wz-noex').value);if(!it){toast('Nie ma takiego ćwiczenia w bazie');return}if(!w.noEx.includes(it.pl))w.noEx.push(it.pl);w.plan=null}
  if(f.dataset.form==='wzPickOwn'){const it=findEx(document.getElementById('wz-own').value);if(!it){toast('Nie ma takiego ćwiczenia w bazie');return}const [di,ei]=w.swap||[];const ex=w.plan.days[di]?.ex[ei];if(ex){ex.name=it.pl;ex.group=it.groupEn;ex.sc=undefined;sortDay(w.plan.days[di].ex)}w.swap=null}
  render();
},true);
})();
