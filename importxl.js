// Dziennik z Excela: import planu, historii serii, wagi i notatek z pliku .xlsx oraz eksport w tym samym układzie.
// Biblioteka SheetJS ładuje się dopiero po wybraniu pliku (z cdnjs), więc nie spowalnia aplikacji.
(function(){
const XLSX_URL='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
let libP=null;
const lib=()=>window.XLSX?Promise.resolve(window.XLSX):libP||(libP=new Promise((res,rej)=>{const s=document.createElement('script');s.src=XLSX_URL;s.onload=()=>res(window.XLSX);s.onerror=()=>{libP=null;rej(new Error('Nie udało się pobrać czytnika Excela. Sprawdź internet.'))};document.head.appendChild(s)}));

const pl=(n,a,b,c)=>n===1?a:(n%10>=2&&n%10<=4&&(n%100<12||n%100>14))?b:c;
const DAYS=['ND','PON','WT','ŚR','CZW','PT','SB'];
const low=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
const iso=d=>{if(d instanceof Date)return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);const m=String(d||'').match(/(\d{4})-(\d{2})-(\d{2})|(\d{1,2})\.(\d{1,2})\.(\d{4})/);return m?(m[1]?`${m[1]}-${m[2]}-${m[3]}`:`${m[6]}-${m[5].padStart(2,'0')}-${m[4].padStart(2,'0')}`):''};
const num=v=>{if(v===null||v===undefined||v==='')return null;const n=+String(v).replace(',','.');return isFinite(n)?n:null};
const addDays=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};

// partia z arkusza → partia w aplikacji
function groupOf(p){p=low(p);
  if(/czworo|quad/.test(p))return 'Quads';
  if(/dwugł|pośladk|glute|hamstr/.test(p))return 'Hamstrings & Glutes';
  if(/łyd|calf|calves/.test(p))return 'Calves';
  if(/^triceps|triceps/.test(p)&&!/^klat/.test(p))return 'Triceps';
  if(/biceps/.test(p))return 'Biceps';
  if(/klat|chest/.test(p))return 'Chest';
  if(/plec|back/.test(p))return 'Back';
  if(/bark|shoulder|delt/.test(p))return 'Shoulders';
  if(/brzuch|core/.test(p))return 'Core';
  if(/przedram|forearm/.test(p))return 'Forearms';
  return '';
}
function eqOf(n){n=low(n);
  if(/maszyn|machine|close-grip|pendulum|hack|v-squat|p855|butt shaper|prostowanie nóg|leg extension|uginanie nóg|leg curl|łydki|calf|odwodzenie bioder|abduction|hip thrust/.test(n))return 'maszyna';
  if(/wyciąg|cable|lina|linki|pulldown|pushdown|ściąganie|row siedząc|seated row|fly|face pull|skier|kickback oburącz/.test(n))return 'wyciąg';
  if(/ez|sztang|bar curl|rdl|t-bar|landmine/.test(n))return 'sztanga';
  if(/hantl|db |db$|dumbbell|hammer|bulgarian|wykroki|lunge/.test(n))return 'hantle';
  if(/dipy|dips/.test(n))return 'masa ciała';
  return 'inne';
}
// nazwy spoza arkusza „Mapa” (wpisy po angielsku z późniejszych tygodni) → nazwa ujednolicona
const ALIAS={
  't-bar row':'T-bar row','one-arm pulldown':'Ściąganie jednorącz','seated row — narrow':'Row siedząc — wąski','seated row narrow':'Row siedząc — wąski',
  'seated row — wide':'Row siedząc — szeroki','seated row wide':'Row siedząc — szeroki','lat pulldown':'Lat pulldown','preacher curl / modlitewnik':'Preacher curl',
  'pushdown v':'Pushdown V','straight bar curl':'Straight bar curl','alternating db curl supinated':'DB curl supinowany','db curl supinowany':'DB curl supinowany',
  'db curl supinated':'DB curl supinowany','cable lateral raise':'Unoszenie bokiem — wyciąg','db lateral raise':'Unoszenie bokiem — hantle','face pull':'Face pull',
  'wykroki chodzone':'Wykroki','walking lunges':'Wykroki','p855 kickback':'P855 Glute kickback','p855 glute kickback':'P855 Glute kickback','hip abduction':'Odwodzenie bioder',
  'incline press machine':'Incline press (maszyna)','shoulder press machine':'Shoulder press (maszyna)','shoulder press':'Shoulder press (maszyna)','v-squat':'V-Squat',
  'standing hip thrust / butt shaper':'Standing hip thrust (Butt Shaper)','bulgarian split squat':'Bulgarian split squat','leg extension':'Prostowanie nóg',
  'seated leg extension':'Prostowanie nóg','seated leg curl':'Uginanie nóg siedząc','lying leg curl':'Uginanie nóg leżąc','cable rope curl z dołu':'Cable curl — lina',
  'seated calf raise':'Łydki siedząc','calves':'Łydki siedząc','close-grip press seated':'Close-grip press siedząc','close-grip press':'Close-grip press siedząc',
  'cable fly high-to-low':'Cable fly góra→dół','overhead cable extension':'Overhead cable extension','rope pushdown':'Pushdown lina','incline db curl':'Incline DB curl'
};
const PART={'Face pull':'Barki — tył','DB curl supinowany':'Biceps','Straight bar curl':'Biceps','Standing hip thrust (Butt Shaper)':'Pośladki','Unoszenie bokiem — hantle':'Barki — bok'};
// nazwy treningów (PL/EN) → jedna nazwa
const TRAIN={'push':'Klatka + barki + triceps','arms + shoulders':'Ramiona + barki','back':'Plecy + biceps','back + light biceps':'Plecy + biceps','plecy + lekki biceps':'Plecy + biceps'};
const trainName=t=>TRAIN[low(t)]||String(t||'Trening').trim();

const rowsOf=(wb,name)=>{const ws=wb.Sheets[name];return ws?XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null}):[]};
const sheetLike=(wb,re)=>wb.SheetNames.find(n=>re.test(n));
const headerAt=(rows,must)=>rows.findIndex(r=>must.every(m=>r.some(c=>low(c)===low(m))));
const col=(hdr,name)=>hdr.findIndex(c=>low(c)===low(name));

function parse(wb){
  const out={planName:'',days:[],sessions:[],bw:[],notes:[],ex:{},block:null,warn:[]};
  // Mapa: nazwa w Logu → nazwa ujednolicona + partia
  const map={};const mR=rowsOf(wb,'Mapa'),mh=headerAt(mR,['Nazwa w Logu']);
  if(mh>=0)mR.slice(mh+1).forEach(r=>{if(r[0]&&r[1])map[low(r[0])]={name:String(r[1]).trim(),part:r[2]||''}});
  const canon=raw=>{const k=low(raw).replace(/\s*—\s*usunięte.*$/,'');const m=map[k];if(m)return m;const a=ALIAS[k];if(a)return {name:a,part:PART[a]||''};
    const hit=Object.values(map).find(v=>low(v.name)===k);return hit||{name:String(raw).trim(),part:''}};
  const note=(name,part)=>{const e=out.ex[name]||(out.ex[name]={name,part:'',n:0});if(part&&!e.part)e.part=part;e.n++;return e};
  // Cykl: start bloku
  const cR=rowsOf(wb,sheetLike(wb,/^cykl/i)||'');const st=cR.find(r=>low(r[0])==='start:');if(st&&st[1])out.block={start:iso(st[1]),name:String(cR[0]?.[0]||'').split('—')[0].trim()};
  // Plan (najnowsza wersja: „Plan v2” przed „Plan v1”)
  const pn=wb.SheetNames.filter(n=>/^plan/i.test(n)&&!/gpt|archiw/i.test(n)).sort().reverse()[0];
  if(pn){const R=rowsOf(wb,pn),h=headerAt(R,['Dzień','Ćwiczenie','Serie']);out.planName=String(R[0]?.[0]||pn).split('(')[0].trim();
    if(h>=0){const H=R[h],c={d:col(H,'Dzień'),p:col(H,'Para'),n:col(H,'Ćwiczenie'),pt:col(H,'Partia'),s:col(H,'Serie'),r:col(H,'Zakres powt.'),rest:col(H,'Przerwa (s)'),kg:H.findIndex(x=>/^ciężar/i.test(x||'')),pr:H.findIndex(x=>/progresj/i.test(x||'')),u:H.findIndex(x=>/uwagi/i.test(x||''))};
      R.slice(h+1).forEach(r=>{const d=String(r[c.d]||'').trim(),n=r[c.n];if(!d||!n||/usunięte/i.test(n))return;
        const cn=canon(n),part=r[c.pt]||cn.part;note(cn.name,part);
        let day=out.days.find(x=>x.code===d);if(!day)out.days.push(day={code:d,exercises:[]});
        const range=String(r[c.r]||'').trim(),top=num((range.match(/(\d+)\D*$/)||range.match(/(\d+)/)||[])[1])||10;
        day.exercises.push({name:cn.name,sets:num(r[c.s])||3,reps:top,range,rest:num(r[c.rest]),pair:r[c.p]&&r[c.p]!=='—'?String(r[c.p]):'',kg:num(r[c.kg]),rule:c.pr>=0?r[c.pr]||'':'',tip:c.u>=0?r[c.u]||'':''})})}}
  // Log: jeden wiersz = jedna seria
  const lR=rowsOf(wb,'Log'),lh=headerAt(lR,['Data','Seria']);
  if(lh>=0){const H=lR[lh],c={dt:col(H,'Data'),w:col(H,'Tydz.'),dz:col(H,'Dzień'),t:col(H,'Trening'),n:H.findIndex(x=>/^ćwiczenie/i.test(x||'')),kg:H.findIndex(x=>/^ciężar/i.test(x||'')),r:col(H,'Powt.'),rir:col(H,'RIR'),u:H.findIndex(x=>/odczucie|uwagi/i.test(x||'')),cel:H.findIndex(x=>/następny cel/i.test(x||'')),typ:col(H,'Typ')};
    const by={};
    lR.slice(lh+1).forEach(r=>{const date=iso(r[c.dt]),n=r[c.n];if(!date||!n)return;const t=trainName(r[c.t]),k=date+'|'+t;
      const s=by[k]||(by[k]={date,dayName:t,code:String(r[c.dz]||'').trim()||DAYS[new Date(date+'T12:00').getDay()],week:num(r[c.w]),entries:[]});
      const cn=canon(n);note(cn.name,cn.part);
      let en=s.entries.find(e=>e.name===cn.name);if(!en)s.entries.push(en={name:cn.name,sets:[],notes:[]});
      const set={w:num(r[c.kg])||0,r:num(r[c.r])||0};if(num(r[c.kg])===null)set.bw=true;const rir=num(r[c.rir]);if(rir!==null)set.rir=rir;if(low(r[c.typ])==='kal')set.warm=true;
      if(r[c.u])set.note=String(r[c.u]);if(c.cel>=0&&r[c.cel])set.goal=String(r[c.cel]);if(low(n)!==low(cn.name))set.raw=String(n);en.sets.push(set);
      [r[c.u],c.cel>=0?r[c.cel]&&('Cel: '+r[c.cel]):null].forEach(x=>{if(x&&!en.notes.includes(String(x)))en.notes.push(String(x))});
});
    out.sessions=Object.values(by).sort((a,b)=>a.date.localeCompare(b.date));}
  // Sesje: czas i uwagi do treningów
  const sR=rowsOf(wb,'Sesje'),sh=headerAt(sR,['Data','Trening']);
  if(sh>=0){const H=sR[sh],c={dt:col(H,'Data'),t:col(H,'Trening'),m:H.findIndex(x=>/czas/i.test(x||'')),u:col(H,'Uwagi')};
    sR.slice(sh+1).forEach(r=>{const date=iso(r[c.dt]);if(!date)return;const t=trainName(r[c.t]);const s=out.sessions.find(x=>x.date===date&&x.dayName===t)||out.sessions.find(x=>x.date===date);if(!s)return;
      const m=num(r[c.m]);if(m)s.minutes=m;if(r[c.u])s.note=String(r[c.u])})}
  // nazwy dni planu z najczęstszego treningu w danym dniu tygodnia
  out.days.forEach(d=>{const cnt={};out.sessions.filter(s=>s.code===d.code).forEach(s=>cnt[s.dayName]=(cnt[s.dayName]||0)+1);const best=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];d.train=best?best[0]:'';d.name=d.code+(best?' · '+best[0]:'')});
  // waga: Kontrola (średnia tygodniowa) i Pomiary (start)
  const start=out.block?.start||out.sessions[0]?.date;
  const kR=rowsOf(wb,'Kontrola'),kh=headerAt(kR,['Tydz.']);
  if(kh>=0&&start){const H=kR[kh],cw=H.findIndex(x=>/waga/i.test(x||'')&&!/Δ/.test(x||''));kR.slice(kh+1).forEach(r=>{const w=num(r[0]),kg=num(r[cw]);if(w&&kg)out.bw.push({date:addDays(start,(w-1)*7),kg})})}
  const pR=rowsOf(wb,'Pomiary'),ph=headerAt(pR,['Pomiar']);
  if(ph>=0){const H=pR[ph],cs=H.findIndex(x=>/^start/i.test(x||''));const date=iso(String(H[cs]||'').replace(/^start\s*/i,''))||start;
    const lines=pR.slice(ph+1).filter(r=>r[0]&&num(r[cs])!==null).map(r=>`${r[0]}${r[2]&&r[2]!=='-'?' ('+r[2]+')':''}: ${String(num(r[cs])).replace('.',',')}${/kg/.test(r[0])?'':' cm'}`);
    const kg=pR.slice(ph+1).find(r=>/masa/i.test(r[0]||''));if(kg&&num(kg[cs])&&date&&!out.bw.some(b=>Math.abs(new Date(b.date)-new Date(date))<7*864e5))out.bw.push({date,kg:num(kg[cs])});
    if(lines.length)out.notes.push({date:date||today(),tag:'Inne',text:'Pomiary ciała (start bloku): '+lines.join('; ')+'.'})}
  out.bw.sort((a,b)=>a.date.localeCompare(b.date));
  const zR=rowsOf(wb,'Zasady'),zh=headerAt(zR,['Temat','Zasada']);
  if(zh>=0){const t=zR.slice(zh+1).filter(r=>r[0]&&r[1]).map(r=>`${r[0]}: ${r[1]}`);if(t.length)out.notes.push({date:start||today(),tag:'Inne',text:'Zasady bloku z dziennika. '+t.join(' ')})}
  return out;
}

// zapis do danych aplikacji; ponowny import tego samego pliku podmienia poprzedni (bez duplikatów)
function apply(x){
  if(S.example){S.sessions=[];S.bodyweight=[];S.notes=[];S.plans=S.plans.filter(p=>!['ppl','fbw'].includes(p.id));S.example=false}
  S.customEx=S.customEx||[];
  Object.values(x.ex).forEach(e=>{if(window.findEx&&findEx(e.name))return;const g=groupOf(e.part)||'Full Body & Conditioning';const c=S.customEx.find(c=>low(c.pl)===low(e.name));
    if(c){c.groupEn=c.groupEn||g;return}S.customEx.push({pl:e.name,en:e.name,eq:eqOf(e.name),groupEn:g,tip:e.part?('Partia w dzienniku: '+e.part):'',src:'xlsx'})});
  rebuildDB();
  let plan=S.plans.find(p=>p.src==='xlsx');
  const days=x.days.map(d=>({id:plan?.days.find(o=>o.code===d.code)?.id||uid(),code:d.code,name:d.name,exercises:d.exercises.map(e=>({id:uid(),...e}))}));
  if(plan){plan.name=x.planName||plan.name;plan.days=days}else if(days.length){plan={id:uid(),name:x.planName||'Plan z dziennika',src:'xlsx',days};S.plans.push(plan)}
  if(plan)S.activePlan=plan.id;
  S.sessions=S.sessions.filter(s=>s.src!=='xlsx').concat(x.sessions.map(s=>{const d=plan?.days.find(o=>o.code===s.code&&(o.name.endsWith(s.dayName)||!o.name.includes('·')));
    return {id:uid(),src:'xlsx',date:s.date,dayId:d?.id||null,dayName:s.dayName,planId:plan?.id,planName:plan?.name,week:s.week,minutes:s.minutes,
      entries:s.entries.map(e=>({name:e.name,sets:e.sets,note:e.notes.join(' · ')||undefined})),note:s.note||''}})).sort((a,b)=>a.date.localeCompare(b.date));
  S.bodyweight=S.bodyweight.filter(b=>b.src!=='xlsx'&&!x.bw.some(n=>n.date===b.date)).concat(x.bw.map(b=>({...b,src:'xlsx'}))).sort((a,b)=>a.date.localeCompare(b.date));
  S.notes=S.notes.filter(n=>n.src!=='xlsx').concat(x.notes.map(n=>({id:uid(),...n,src:'xlsx'})));
  if(x.block)S.block=x.block;
  save();
}

function summary(x){const sets=x.sessions.reduce((a,s)=>a+s.entries.reduce((b,e)=>b+e.sets.length,0),0),warm=x.sessions.reduce((a,s)=>a+s.entries.reduce((b,e)=>b+e.sets.filter(z=>z.warm).length,0),0);
  return {plan:x.planName,days:x.days.length,ex:x.days.reduce((a,d)=>a+d.exercises.length,0),sess:x.sessions.length,sets,warm,from:x.sessions[0]?.date,to:x.sessions[x.sessions.length-1]?.date,names:Object.keys(x.ex).length,bw:x.bw.length,notes:x.notes.length,dayNames:x.days.map(d=>d.name)}}

/* ---------- eksport w układzie dziennika (Plan, Log, Waga, Notatki) ---------- */
async function exportXlsx(){
  const X=await lib();const wb=X.utils.book_new();const start=S.block?.start||S.sessions[0]?.date;
  const part=n=>{const c=(S.customEx||[]).find(c=>c.pl===n);const t=c?.tip?.match(/Partia w dzienniku: (.*)/);if(t)return t[1];const f=window.findEx&&findEx(n);return f?(DB.find(g=>g.en===f.groupEn)?.group||''):''};
  const plan=activePlan();
  const P=[['Dzień','Lp.','Para','Ćwiczenie','Partia','Serie','Zakres powt.','Przerwa (s)','Ciężar start (kg)','Reguła progresji','Uwagi']];
  (plan?.days||[]).forEach(d=>d.exercises.forEach((e,i)=>P.push([d.code||d.name,i+1,e.pair||'—',e.name,part(e.name),e.sets,e.range||String(e.reps),e.rest??'',e.kg??'',e.rule||'',e.tip||''])));
  const L=[['Data','Tydz.','Dzień','Trening','Ćwiczenie (wpis)','Seria','Ciężar kg','Powt.','RIR','Odczucie / uwagi','Następny cel','Objętość kg','e1RM (≤15 powt.)','Ćwiczenie ujednolicone','Partia','Typ']];
  S.sessions.forEach(s=>{const wk=s.week||(start?Math.floor((new Date(s.date)-new Date(start))/6048e5)+1:'');const dz=DAYS[new Date(s.date+'T12:00').getDay()];
    s.entries.forEach(e=>e.sets.forEach((z,i)=>{const w=+z.w||0,r=+z.r||0;L.push([new Date(s.date+'T12:00'),wk,dz,s.dayName,z.raw||e.name,i+1,z.bw&&!w?'':w,r,z.rir??'',z.note??(s.src!=='xlsx'&&i===0?e.note||'':''),z.goal||'',w*r,r&&r<=15&&w?Math.round(w*(1+r/30)*10)/10:'',e.name,part(e.name),z.warm?'kal':'rob'])}))});
  const B=[['Data','Waga (kg)']].concat(S.bodyweight.map(b=>[new Date(b.date+'T12:00'),b.kg]));
  const N=[['Data','Rodzaj','Wpis']].concat(S.notes.map(n=>[new Date(n.date+'T12:00'),n.tag,n.text]));
  [['Plan',P,[6,5,6,34,16,7,12,10,14,28,40]],['Log',L,[11,6,6,24,34,6,9,7,5,40,20,11,12,30,16,6]],['Waga',B,[11,10]],['Notatki',N,[11,14,90]]].forEach(([n,rows,w])=>{const ws=X.utils.aoa_to_sheet(rows,{cellDates:true,dateNF:'yyyy-mm-dd'});ws['!cols']=w.map(wch=>({wch}));X.utils.book_append_sheet(wb,ws,n)});
  const data=X.write(wb,{bookType:'xlsx',type:'array'});const blob=new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const name=`Dziennik_treningowy_${today()}.xlsx`;
  if(window.claude?.download){try{await window.claude.download(blob,name);return}catch(e){}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
}

window.xlSection=function(){const x=ui.xl||{};const s=x.sum;
  return `<section class="stack"><h2>Dziennik z Excela</h2><div class="card stack">
  <p class="muted" style="margin:0">Wczytaj swój dziennik treningowy (.xlsx): plan, wszystkie serie z Logu, wagę i pomiary. Ponowne wczytanie nowszej wersji pliku podmienia poprzedni import, bez duplikatów.</p>
  ${x.busy?'<p class="muted" style="margin:0">Czytam plik…</p>':''}${x.err?`<p class="xl-err" style="margin:0">${esc(x.err)}</p>`:''}
  ${s?`<div class="xl-sum"><b>${esc(x.file)}</b><ul>
    <li>Plan: <b>${esc(s.plan||'bez nazwy')}</b>, ${s.days} ${s.days===1?'dzień':'dni'}, ${s.ex} ${pl(s.ex,'ćwiczenie','ćwiczenia','ćwiczeń')}${s.dayNames.length?` (${esc(s.dayNames.join(', '))})`:''}</li>
    <li>Historia: <b>${s.sess} ${pl(s.sess,'trening','treningi','treningów')}</b>, ${s.sets} ${pl(s.sets,'seria','serie','serii')}${s.warm?` (w tym ${s.warm} ${pl(s.warm,'rozgrzewkowa','rozgrzewkowe','rozgrzewkowych')})`:''}${s.from?`, od ${fmtDate(s.from)} do ${fmtDate(s.to)}`:''}</li>
    <li>${s.names} ${pl(s.names,'ćwiczenie','ćwiczenia','ćwiczeń')} po ujednoliceniu nazw (wg arkusza Mapa)</li>
    <li>Waga: ${s.bw} ${s.bw===1?'pomiar':'pomiary'}, notatki: ${s.notes} (pomiary ciała, zasady bloku)</li></ul>
    ${S.example?'<p class="muted" style="margin:0">Przykładowe dane zostaną usunięte.</p>':S.sessions.some(z=>z.src==='xlsx')?'<p class="muted" style="margin:0">Poprzedni import z Excela zostanie podmieniony. Treningi zapisane w aplikacji zostają.</p>':''}
    <div class="row"><button class="primary" data-act="xlApply">Importuj</button><button class="ghost" data-act="xlCancel">Anuluj</button></div></div>`
  :`<div class="row"><button class="primary" data-act="xlPick">Wybierz plik .xlsx</button><input type="file" id="xl-file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>${S.sessions.length?'<button data-act="xlExport">Pobierz dziennik .xlsx</button>':''}</div>`}
  </div></section>`};

document.addEventListener('change',async e=>{if(e.target.id!=='xl-file'||!e.target.files[0])return;const f=e.target.files[0];ui.xl={busy:true,file:f.name};render();
  try{const X=await lib();const wb=X.read(await f.arrayBuffer(),{cellDates:true});const data=parse(wb);if(!data.sessions.length&&!data.days.length)throw new Error('Nie znalazłem w pliku arkuszy „Plan” ani „Log”.');ui.xl={file:f.name,data,sum:summary(data)}}
  catch(err){ui.xl={err:err?.message||'Nie udało się odczytać pliku.'}}render()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='xlPick'){document.getElementById('xl-file')?.click();return}
  if(a==='xlCancel')ui.xl=null;
  else if(a==='xlApply'&&ui.xl?.data){apply(ui.xl.data);const s=ui.xl.sum;ui.xl=null;ui.planId=null;toast(`Zaimportowano plan i ${s.sess} ${pl(s.sess,'trening','treningi','treningów')}`)}
  else if(a==='xlExport'){exportXlsx().catch(err=>toast(err?.message||'Nie udało się zapisać pliku'))}},true);
window.XL={parse,apply,summary,lib};
})();
