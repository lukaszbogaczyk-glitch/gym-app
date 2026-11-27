// Minimalistyczne animacje ruchu: sylwetka z kości (kinematyka prosta), dwie pozy A i B na ćwiczenie.
// Kąty w stopniach. Tułów (t): 0 = pion w górę, + = pochylenie do przodu. Kończyny: 0 = pion w dół, + = do przodu.
// Widok 's' (z boku, twarzą w prawo) albo 'f' (z przodu: kąty kończyn + = na zewnątrz).
// anchor: punkt sylwetki przyklejony do współrzędnych 'at' (np. palce na ziemi), pozostałe punkty liczone od niego.
(function(){
const G=150; // linia podłogi
const L={t:36,neck:5,head:7.5,ua:17,fa:16,th:22,sh:22,ft:9,sw:10,hw:5};
const rad=a=>a*Math.PI/180;
const down=(p,a,l)=>[p[0]+l*Math.sin(rad(a)),p[1]+l*Math.cos(rad(a))];
const up=(p,a,l)=>[p[0]+l*Math.sin(rad(a)),p[1]-l*Math.cos(rad(a))];

function sideRig(q){
  const P={};const d=(k,v)=>q[k]??v;
  P.hip=[0,0];P.S=up(P.hip,q.t,L.t);P.N=up(P.S,q.t+d('nk',0),L.neck);P.Hd=up(P.S,q.t+d('nk',0),L.neck+L.head);
  P.E=down(P.S,q.ua,L.ua);P.H=down(P.E,q.fa,L.fa);
  P.E2=down(P.S,d('ua2',q.ua),L.ua);P.H2=down(P.E2,d('fa2',q.fa),L.fa);
  P.K=down(P.hip,q.th,L.th);P.A=down(P.K,q.sh,L.sh);P.T=down(P.A,d('ft',90),L.ft);
  P.K2=down(P.hip,d('th2',q.th),L.th);P.A2=down(P.K2,d('sh2',q.sh),L.sh);P.T2=down(P.A2,d('ft2',d('ft',90)),L.ft);
  return P;
}
function frontRig(q){
  const P={};const d=(k,v)=>q[k]??v;
  P.hip=[0,0];const sy=d('sy',0),tl=d('tl',0);
  P.S=[ -L.sw+Math.sin(rad(tl))*L.t, -L.t-sy];P.S2=[L.sw+Math.sin(rad(tl))*L.t,-L.t-sy];
  P.Nk=[Math.sin(rad(tl))*L.t,-L.t-sy];P.Hd=[Math.sin(rad(tl))*(L.t+12),-L.t-12.5-sy*0.4];
  // lewa strona ekranu: kąty + = w lewo (na zewnątrz); prawa: + = w prawo
  const out=(p,a,l,s)=>[p[0]+s*l*Math.sin(rad(a)),p[1]+l*Math.cos(rad(a))];
  P.E=out(P.S,q.ua,L.ua,-1);P.H=out(P.E,q.fa,L.fa,-1);
  P.E2=out(P.S2,d('ua2',q.ua),L.ua,1);P.H2=out(P.E2,d('fa2',q.fa),L.fa,1);
  P.hp=[-L.hw,0];P.hp2=[L.hw,0];
  P.K=out(P.hp,d('th',0),L.th,-1);P.A=out(P.K,d('sh',d('th',0)),L.sh,-1);P.T=[P.A[0]-6,P.A[1]];
  P.K2=out(P.hp2,d('th2',d('th',0)),L.th,1);P.A2=out(P.K2,d('sh2',d('sh',d('th2',d('th',0)))),L.sh,1);P.T2=[P.A2[0]+6,P.A2[1]];
  return P;
}
function pose(spec,k){
  const A=spec.A,B=spec.B||spec.A,q={};
  for(const key of new Set([...Object.keys(A),...Object.keys(B)])){
    const a=A[key],b=B[key]??a;
    if(Array.isArray(a))q[key]=[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k];
    else if(typeof a==='number')q[key]=a+((b??a)-a)*k;
    else q[key]=k<.5?a:b;
  }
  const P=(spec.v==='f'?frontRig:sideRig)(q);
  const an=q.anchor||'T',at=q.at||[100,G],o=P[an];const dx=at[0]-o[0],dy=at[1]-o[1];
  for(const p in P)P[p]=[P[p][0]+dx,P[p][1]+dy];
  P.q=q;P.k=k;return P;
}
const f1=n=>n.toFixed(1);
const ln=(a,b,w,c,op)=>`<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${op?` opacity="${op}"`:''}/>`;
const pl=(pts,w,c,op)=>`<polyline points="${pts.map(p=>f1(p[0])+','+f1(p[1])).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op?` opacity="${op}"`:''}/>`;

function props(spec,P,col,front){
  return (spec.props||[]).map(pr=>{
    const k=pr.k,at=pr.at?P[pr.at]:null;
    if(k==='plate'){const c=at;const o=pr.off||[0,0];return `<circle cx="${f1(c[0]+o[0])}" cy="${f1(c[1]+o[1])}" r="${pr.r||10}" fill="none" stroke="${col.w}" stroke-width="3.2"/><circle cx="${f1(c[0]+o[0])}" cy="${f1(c[1]+o[1])}" r="2" fill="${col.w}"/>`}
    if(k==='barF'){const a=P.H,b=P.H2;const y=(a[1]+b[1])/2;return ln([a[0]-26,y],[b[0]+26,y],2.4,col.w)+[a[0]-22,b[0]+22].map(x=>`<rect x="${f1(x-2.5)}" y="${f1(y-9)}" width="5" height="18" rx="1.5" fill="${col.w}"/>`).join('')}
    if(k==='db'){return ['H','H2'].filter(h=>!pr.one||h==='H').map(h=>{const c=P[h];return `<g transform="translate(${f1(c[0])} ${f1(c[1])}) rotate(${pr.rot||0})">${ln([-6,0],[6,0],2.4,col.w)}<rect x="-8" y="-4.5" width="4" height="9" rx="1.2" fill="${col.w}"/><rect x="4" y="-4.5" width="4" height="9" rx="1.2" fill="${col.w}"/></g>`}).join('')}
    if(k==='kb'){const c=P[pr.at||'H'];return `<path d="M${f1(c[0]-3)} ${f1(c[1])} q3 -5 6 0" fill="none" stroke="${col.w}" stroke-width="1.8"/><circle cx="${f1(c[0])}" cy="${f1(c[1]+6)}" r="6" fill="${col.w}"/>`}
    if(k==='ball'){const c=P[pr.at||'H'];return `<circle cx="${f1(c[0]+(pr.off?.[0]||0))}" cy="${f1(c[1]+(pr.off?.[1]||0))}" r="${pr.r||7}" fill="${col.w}"/>`}
    if(k==='cable'){const c=P[pr.at||'H'];return ln(pr.from,c,1.2,col.w,.9)+`<circle cx="${pr.from[0]}" cy="${pr.from[1]}" r="3" fill="none" stroke="${col.m}" stroke-width="1.5"/>`}
    if(k==='rect'){return `<rect x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" rx="${pr.r??2}" fill="${col.m}"${pr.rot?` transform="rotate(${pr.rot} ${pr.x+pr.w/2} ${pr.y+pr.h/2})"`:''}/>`}
    if(k==='line'){return ln(pr.a,pr.b,pr.w||3,col.m)}
    if(k==='bar'){return `<circle cx="${pr.x}" cy="${pr.y}" r="2.6" fill="${col.m}"/>`+ln([pr.x-14,pr.y],[pr.x+14,pr.y],1,col.m,.5)}
    if(k==='lever'){const c=P[pr.at||'H'];return ln(pr.from,c,3,col.m)}
    if(k==='jrope'){const h=P.H,y=(P.Hd[1]-14)*(1-P.k)+(G+2)*P.k,yy=h[1]+(y-h[1])*1.33;return `<path d="M${f1(h[0])} ${f1(h[1])} C${f1(h[0]-30)} ${f1(yy)} ${f1(h[0]+22)} ${f1(yy)} ${f1(h[0])} ${f1(h[1])}" fill="none" stroke="${col.w}" stroke-width="1.6"/>`}
    if(k==='roller'){const h=P.H,y=h[1]+22-P.k*8;return ln([h[0]-6,h[1]],[h[0]+6,h[1]],3,col.w)+ln(h,[h[0],y],1,col.w)+`<rect x="${f1(h[0]-5)}" y="${f1(y)}" width="10" height="5" rx="1" fill="${col.w}"/>`}
    if(k==='rope'){const c=P[pr.at||'H'];const a=pr.from;return `<path d="M${f1(c[0])} ${f1(c[1])} Q${f1((c[0]+a[0])/2)} ${f1(c[1]+(pr.wave||0)*Math.sin(P.q.ph||0))} ${a[0]} ${a[1]}" fill="none" stroke="${col.w}" stroke-width="2"/>`}
    return '';
  }).join('');
}
function draw(spec,k,col){
  const P=pose(spec,k);const C=col.f,W=6.2;
  let s=`<line x1="0" y1="${G+.5}" x2="200" y2="${G+.5}" stroke="${col.m}" stroke-width="1.2"/>`;
  const back=props({props:(spec.props||[]).filter(p=>p.back)},P,col),front=props({props:(spec.props||[]).filter(p=>!p.back)},P,col);
  s+=back;
  if(spec.v==='f'){
    s+=pl([P.hp,P.K,P.A,P.T],W,C)+pl([P.hp2,P.K2,P.A2,P.T2],W,C);
    s+=`<path d="M${f1(P.S[0])} ${f1(P.S[1])} L${f1(P.S2[0])} ${f1(P.S2[1])} L${f1(P.hp2[0]+1)} ${f1(P.hp2[1])} L${f1(P.hp[0]-1)} ${f1(P.hp[1])} Z" fill="${C}" stroke="${C}" stroke-width="6" stroke-linejoin="round"/>`;
    s+=ln(P.Nk,[P.Nk[0],P.Nk[1]-4],4,C)+`<circle cx="${f1(P.Hd[0])}" cy="${f1(P.Hd[1])}" r="${L.head}" fill="${C}"/>`;
    s+=pl([P.S,P.E,P.H],W,C)+pl([P.S2,P.E2,P.H2],W,C);
  }else{
    s+=pl([P.hip,P.K2,P.A2,P.T2],W,C,.45)+pl([P.S,P.E2,P.H2],W,C,.45);
    s+=pl([P.hip,P.K,P.A,P.T],W,C)+ln(P.hip,P.S,9,C)+ln(P.S,P.N,4.5,C)+`<circle cx="${f1(P.Hd[0])}" cy="${f1(P.Hd[1])}" r="${L.head}" fill="${C}"/>`;
    s+=pl([P.S,P.E,P.H],W,C);
  }
  return s+front;
}

/* ---------- wzorce ruchu ---------- */
const BENCH=(y=128,x=62,w=62)=>({k:'rect',x,y,w,h:5,back:true});
const LEG=(x,y,h)=>({k:'rect',x,y,w:4,h,r:1,back:true});
const SEAT={k:'rect',x:82,y:118,w:30,h:5,back:true};
const lying=(o={})=>({anchor:'hip',at:[118,122],t:-90,th:75,sh:5,...o});
const seated=(o={})=>({anchor:'hip',at:[98,114],t:0,th:90,sh:0,...o});
const P={
  squat:{v:'s',A:{t:8,th:0,sh:0,ua:-30,fa:175},B:{t:38,th:88,sh:-34,ua:-10,fa:160},props:[{k:'plate',at:'S',off:[-8,1]}]},
  frontSquat:{v:'s',A:{t:3,th:0,sh:0,ua:95,fa:200},B:{t:20,th:92,sh:-38,ua:95,fa:200},props:[{k:'plate',at:'H',off:[-3,-1]}]},
  gobletSquat:{v:'s',A:{t:4,th:0,sh:0,ua:25,fa:175},B:{t:25,th:92,sh:-36,ua:25,fa:175},props:[{k:'kb',at:'H'}]},
  dbSquat:{v:'s',A:{t:5,th:0,sh:0,ua:0,fa:0},B:{t:35,th:85,sh:-32,ua:0,fa:0},props:[{k:'db'}]},
  bwSquat:{v:'s',A:{t:4,th:0,sh:0,ua:0,fa:0},B:{t:30,th:90,sh:-34,ua:90,fa:90}},
  wallSit:{v:'s',A:{anchor:'T',at:[116,G],t:0,th:90,sh:0,ua:5,fa:5},B:{anchor:'T',at:[116,G],t:0,th:88,sh:0,ua:5,fa:5,nk:4},props:[{k:'line',a:[83,40],b:[83,G],w:3}]},
  machineSquat:{v:'s',A:{t:-6,th:0,sh:0,ua:20,fa:175},B:{t:15,th:95,sh:-40,ua:20,fa:175},props:[{k:'line',a:[70,30],b:[95,G],w:3,back:true}]},
  legPress:{v:'s',A:{anchor:'hip',at:[78,118],t:-62,th:150,sh:60,ua:20,fa:40,ft:180},B:{anchor:'hip',at:[78,118],t:-62,th:118,sh:115,ua:20,fa:40,ft:200},props:[{k:'rect',x:40,y:110,w:42,h:5,rot:-28,back:true}]},
  legExt:{v:'s',A:seated({t:-8,ua:10,fa:10,sh:0}),B:seated({t:-8,ua:10,fa:10,sh:88,ft:180}),props:[SEAT,{k:'rect',x:72,y:72,w:5,h:46,back:true}]},
  legCurl:{v:'s',A:seated({t:-10,ua:10,fa:10,sh:85,ft:180}),B:seated({t:-10,ua:10,fa:10,sh:-15}),props:[SEAT,{k:'rect',x:72,y:72,w:5,h:46,back:true}]},
  lunge:{v:'s',A:{anchor:'T',at:[118,G],t:2,th:0,sh:0,th2:0,sh2:0,ua:0,fa:0},B:{anchor:'T',at:[118,G],t:6,th:82,sh:-6,th2:-30,sh2:-88,ft2:170,ua:0,fa:0},props:[{k:'db'}]},
  bulgarian:{v:'s',A:{anchor:'T',at:[122,G],t:8,th:10,sh:0,th2:-30,sh2:-80,ft2:-90,ua:0,fa:0},B:{anchor:'T',at:[122,G],t:20,th:82,sh:-10,th2:-60,sh2:-120,ft2:-90,ua:0,fa:0},props:[{k:'db'},{k:'rect',x:46,y:118,w:22,h:6,back:true}]},
  stepUp:{v:'s',A:{anchor:'T',at:[118,124],t:12,th:80,sh:-8,th2:0,sh2:0,ua:0,fa:0},B:{anchor:'T',at:[118,124],t:3,th:0,sh:0,th2:-20,sh2:-40,ua:0,fa:0},props:[{k:'rect',x:98,y:124,w:34,h:26,back:true},{k:'db'}]},
  boxJump:{v:'s',A:{anchor:'T',at:[100,G],t:40,th:85,sh:-32,ua:-50,fa:-40},B:{anchor:'T',at:[118,124],t:5,th:20,sh:-10,ua:150,fa:160},props:[{k:'rect',x:108,y:124,w:30,h:26,back:true}]},
  pistol:{v:'s',A:{t:4,th:0,sh:0,th2:30,sh2:30,ua:60,fa:60},B:{t:35,th:95,sh:-38,th2:95,sh2:95,ua:90,fa:90}},
  sissy:{v:'s',A:{t:0,th:0,sh:0,ua:60,fa:60},B:{t:-30,th:35,sh:-70,ft:60,ua:60,fa:60}},
  rdl:{v:'s',A:{t:0,th:0,sh:0,ua:0,fa:0},B:{t:78,th:14,sh:-6,ua:0,fa:0},props:[{k:'plate',at:'H'}]},
  rdlDb:{v:'s',A:{t:0,th:0,sh:0,ua:0,fa:0},B:{t:78,th:14,sh:-6,ua:0,fa:0},props:[{k:'db'}]},
  singleRdl:{v:'s',A:{t:0,th:0,sh:0,th2:0,sh2:0,ua:0,fa:0},B:{t:82,th:12,sh:-4,th2:-85,sh2:-85,ft2:-10,ua:0,fa:0},props:[{k:'db',one:true}]},
  deadlift:{v:'s',A:{t:58,th:72,sh:-22,ua:0,fa:0},B:{t:0,th:0,sh:0,ua:0,fa:0},props:[{k:'plate',at:'H',r:11}]},
  sumo:{v:'s',A:{t:45,th:80,sh:-15,ua:0,fa:0},B:{t:0,th:0,sh:0,ua:0,fa:0},props:[{k:'plate',at:'H',r:11}]},
  rackPull:{v:'s',A:{t:30,th:18,sh:-6,ua:0,fa:0},B:{t:-3,th:0,sh:0,ua:0,fa:0},props:[{k:'plate',at:'H',r:11}]},
  goodMorning:{v:'s',A:{t:0,th:0,sh:0,ua:-30,fa:175},B:{t:80,th:14,sh:-6,ua:40,fa:240},props:[{k:'plate',at:'S',off:[-3,-2]}]},
  swing:{v:'s',A:{t:70,th:25,sh:-10,ua:-25,fa:-25},B:{t:-2,th:0,sh:0,ua:95,fa:95},props:[{k:'kb'}]},
  hipThrust:{v:'s',A:{anchor:'T',at:[136,G],t:-55,th:55,sh:0,ua:50,fa:120},B:{anchor:'T',at:[136,G],t:-92,th:92,sh:-5,ua:95,fa:95},props:[{k:'rect',x:52,y:104,w:26,h:46,back:true},{k:'plate',at:'hip',off:[0,-9]}]},
  glueBridge:{v:'s',A:{anchor:'T',at:[136,G],t:-92,th:128,sh:22,ua:-80,fa:-90},B:{anchor:'T',at:[136,G],t:-112,th:100,sh:-8,ua:-70,fa:-90}},
  backExt:{v:'s',A:{anchor:'hip',at:[104,104],t:135,th:-60,sh:-60,ft:-150,ua:150,fa:150},B:{anchor:'hip',at:[104,104],t:80,th:-60,sh:-60,ft:-150,ua:100,fa:100},props:[{k:'rect',x:96,y:106,w:12,h:44,rot:-30,back:true}]},
  revHyper:{v:'s',A:{anchor:'hip',at:[100,104],t:90,th:0,sh:0,ft:90,ua:180,fa:180},B:{anchor:'hip',at:[100,104],t:90,th:-85,sh:-85,ft:-10,ua:180,fa:180},props:[{k:'rect',x:98,y:107,w:44,h:5,back:true},LEG(138,112,38)]},
  superman:{v:'s',A:{anchor:'hip',at:[96,145],t:88,th:-90,sh:-90,ft:0,ua:178,fa:178},B:{anchor:'hip',at:[96,145],t:72,th:-104,sh:-106,ft:0,ua:110,fa:110}},
  nordic:{v:'s',A:{anchor:'K',at:[96,147],t:0,th:0,sh:-90,ft:0,ua:60,fa:60},B:{anchor:'K',at:[96,147],t:62,th:-62,sh:-90,ft:0,ua:80,fa:80}},
  bench:{v:'s',A:lying({ua:105,fa:192}),B:lying({ua:182,fa:180}),props:[BENCH(),LEG(66,133,17),LEG(116,133,17),{k:'plate',at:'H'}]},
  benchDb:{v:'s',A:lying({ua:105,fa:192}),B:lying({ua:182,fa:180}),props:[BENCH(),LEG(66,133,17),LEG(116,133,17),{k:'db',rot:90}]},
  incline:{v:'s',A:{anchor:'hip',at:[112,118],t:-50,th:80,sh:10,ua:95,fa:190},B:{anchor:'hip',at:[112,118],t:-50,th:80,sh:10,ua:178,fa:180},props:[{k:'rect',x:78,y:96,w:42,h:5,rot:-50,back:true},{k:'plate',at:'H'}]},
  inclineDb:{v:'s',A:{anchor:'hip',at:[112,118],t:-50,th:80,sh:10,ua:95,fa:190},B:{anchor:'hip',at:[112,118],t:-50,th:80,sh:10,ua:178,fa:180},props:[{k:'rect',x:78,y:96,w:42,h:5,rot:-50,back:true},{k:'db',rot:90}]},
  decline:{v:'s',A:{anchor:'hip',at:[118,110],t:-112,th:70,sh:30,ua:105,fa:190},B:{anchor:'hip',at:[118,110],t:-112,th:70,sh:30,ua:180,fa:180},props:[{k:'rect',x:64,y:118,w:60,h:5,rot:20,back:true},{k:'plate',at:'H'}]},
  floorPress:{v:'s',A:{anchor:'hip',at:[116,143],t:-90,th:130,sh:-20,ua:110,fa:192},B:{anchor:'hip',at:[116,143],t:-90,th:130,sh:-20,ua:182,fa:180},props:[{k:'plate',at:'H'}]},
  pullover:{v:'s',A:lying({ua:250,fa:250}),B:lying({ua:178,fa:178}),props:[BENCH(),LEG(66,133,17),LEG(116,133,17),{k:'db',rot:90,one:true}]},
  skull:{v:'s',A:lying({ua:165,fa:260}),B:lying({ua:168,fa:175}),props:[BENCH(),LEG(66,133,17),LEG(116,133,17),{k:'plate',at:'H',r:7}]},
  pushup:{v:'s',A:{anchor:'H',at:[132,G],t:78,th:-102,sh:-102,ft:-20,ua:0,fa:0},B:{anchor:'H',at:[132,G],t:86,th:-94,sh:-94,ft:-20,ua:-62,fa:38}},
  pushupInc:{v:'s',A:{anchor:'H',at:[136,G],t:95,th:-85,sh:-85,ft:-10,ua:0,fa:0},B:{anchor:'H',at:[136,G],t:104,th:-76,sh:-76,ft:-10,ua:-62,fa:38},props:[{k:'rect',x:30,y:120,w:22,h:30,back:true}]},
  dips:{v:'s',A:{anchor:'H',at:[104,92],t:8,th:-15,sh:-85,ft:-10,ua:2,fa:0},B:{anchor:'H',at:[104,92],t:26,th:-25,sh:-95,ft:-10,ua:-78,fa:12},props:[{k:'line',a:[96,92],b:[118,92],w:3},LEG(114,92,58)]},
  benchDip:{v:'s',A:{anchor:'H',at:[88,118],t:0,th:88,sh:0,ft:90,ua:-10,fa:0},B:{anchor:'H',at:[88,118],t:5,th:75,sh:-15,ft:90,ua:-75,fa:15},props:[{k:'rect',x:66,y:118,w:26,h:32,back:true}]},
  ohp:{v:'s',A:{t:-3,th:0,sh:0,ua:18,fa:190},B:{t:-1,th:0,sh:0,ua:177,fa:180},props:[{k:'plate',at:'H'}]},
  ohpDb:{v:'s',A:{t:-3,th:0,sh:0,ua:18,fa:190},B:{t:-1,th:0,sh:0,ua:177,fa:180},props:[{k:'db',rot:90}]},
  ohpSeat:{v:'s',A:seated({t:-4,ua:18,fa:190}),B:seated({t:-2,ua:177,fa:180}),props:[SEAT,{k:'rect',x:78,y:70,w:5,h:48,back:true},{k:'db',rot:90}]},
  ohpMachine:{v:'s',A:seated({t:-4,ua:18,fa:190}),B:seated({t:-2,ua:177,fa:180}),props:[SEAT,{k:'rect',x:78,y:70,w:5,h:48,back:true},{k:'line',a:[106,30],b:[106,74],w:2}]},
  pushPress:{v:'s',A:{t:2,th:22,sh:-14,ua:18,fa:190},B:{t:-1,th:0,sh:0,ua:177,fa:180},props:[{k:'plate',at:'H'}]},
  handstand:{v:'s',A:{anchor:'H',at:[100,G],t:180,th:180,sh:180,ft:0,ua:0,fa:0,nk:0},B:{anchor:'H',at:[100,G],t:172,th:182,sh:182,ft:0,ua:-58,fa:36},props:[{k:'line',a:[76,20],b:[76,G],w:3}]},
  landmine:{v:'s',A:{t:8,th:8,sh:-4,th2:-12,sh2:-12,ua:25,fa:175},B:{t:12,th:8,sh:-4,th2:-12,sh2:-12,ua:128,fa:128},props:[{k:'lever',from:[186,148],at:'H'},{k:'plate',at:'H',r:8,off:[6,-4]}]},
  frontRaise:{v:'s',A:{t:0,th:0,sh:0,ua:5,fa:5},B:{t:0,th:0,sh:0,ua:92,fa:92},props:[{k:'db',rot:90}]},
  latRaise:{v:'f',A:{ua:8,fa:10},B:{ua:85,fa:88},props:[{k:'db',rot:90}]},
  latCable:{v:'f',A:{ua:-10,fa:-10,ua2:5,fa2:5},B:{ua:80,fa:84,ua2:5,fa2:5},props:[{k:'cable',from:[124,148],at:'H'}]},
  latMachine:{v:'f',A:{ua:10,fa:60,anchor:'T',at:[94,G]},B:{ua:85,fa:130,anchor:'T',at:[94,G]},props:[{k:'rect',x:85,y:114,w:30,h:5,back:true}]},
  rearFly:{v:'s',A:{t:72,th:12,sh:-5,ua:0,fa:0},B:{t:72,th:12,sh:-5,ua:-75,fa:-80},props:[{k:'db',rot:90}]},
  rearMachine:{v:'s',A:seated({t:5,ua:90,fa:90}),B:seated({t:5,ua:-60,fa:-60}),props:[SEAT,{k:'rect',x:110,y:66,w:5,h:40}]},
  facePull:{v:'s',A:{t:-6,th:0,sh:0,ua:82,fa:82},B:{t:-8,th:0,sh:0,ua:-98,fa:140},props:[{k:'cable',from:[180,58],at:'H'}]},
  uprightRow:{v:'s',A:{t:0,th:0,sh:0,ua:5,fa:5},B:{t:0,th:0,sh:0,ua:70,fa:-18},props:[{k:'plate',at:'H'}]},
  extRot:{v:'f',A:{ua:5,fa:-80,ua2:5,fa2:5},B:{ua:5,fa:20,ua2:5,fa2:5},props:[{k:'cable',from:[130,100],at:'H'}]},
  shrug:{v:'f',A:{ua:4,fa:4,sy:0},B:{ua:4,fa:4,sy:7},props:[{k:'db',rot:90}]},
  shrugBar:{v:'f',A:{ua:6,fa:6,sy:0},B:{ua:6,fa:6,sy:7},props:[{k:'barF'}]},
  farmer:{v:'s',A:{t:2,th:22,sh:2,th2:-18,sh2:-28,ft2:120,ua:0,fa:0},B:{t:2,th:-18,sh:-28,ft:120,th2:22,sh2:2,ua:0,fa:0},props:[{k:'db',rot:90}]},
  suitcase:{v:'f',A:{ua:3,fa:3,tl:-6,th:2,th2:-2},B:{ua:3,fa:3,tl:-4,th:-2,th2:2},props:[{k:'db',rot:90,one:true}]},
  row:{v:'s',A:{t:68,th:16,sh:-6,ua:0,fa:0},B:{t:68,th:16,sh:-6,ua:-62,fa:8},props:[{k:'plate',at:'H'}]},
  rowDb:{v:'s',A:{t:68,th:16,sh:-6,ua:0,fa:0},B:{t:68,th:16,sh:-6,ua:-62,fa:8},props:[{k:'db',rot:90}]},
  row1arm:{v:'s',A:{anchor:'T',at:[70,G],t:82,th:6,sh:0,th2:80,sh2:-5,ua:0,fa:0,ua2:65,fa2:0},B:{anchor:'T',at:[70,G],t:82,th:6,sh:0,th2:80,sh2:-5,ua:-65,fa:8,ua2:65,fa2:0},props:[{k:'rect',x:86,y:118,w:44,h:5,back:true},{k:'db',rot:90,one:true}]},
  rowChest:{v:'s',A:{anchor:'hip',at:[90,108],t:55,th:60,sh:5,ua:0,fa:0},B:{anchor:'hip',at:[90,108],t:55,th:60,sh:5,ua:-62,fa:8},props:[{k:'rect',x:80,y:96,w:52,h:5,rot:35,back:true},{k:'db',rot:90}]},
  cableRow:{v:'s',A:{anchor:'hip',at:[86,140],t:18,th:85,sh:50,ft:170,ua:85,fa:88},B:{anchor:'hip',at:[86,140],t:-6,th:85,sh:50,ft:170,ua:-45,fa:80},props:[{k:'cable',from:[180,120],at:'H'},{k:'rect',x:66,y:143,w:44,h:5,back:true}]},
  machineRow:{v:'s',A:seated({t:8,ua:88,fa:88}),B:seated({t:-4,ua:-45,fa:80}),props:[SEAT,{k:'rect',x:132,y:68,w:5,h:46}]},
  invRow:{v:'s',A:{anchor:'H',at:[80,92],t:-70,th:70,sh:70,ft:160,ua:180,fa:180},B:{anchor:'H',at:[80,92],t:-76,th:76,sh:76,ft:166,ua:128,fa:215},props:[{k:'bar',x:80,y:92},LEG(64,92,58)]},
  pulldown:{v:'s',A:seated({t:-8,ua:172,fa:178}),B:seated({t:-14,ua:-25,fa:172}),props:[SEAT,{k:'cable',from:[100,8],at:'H'},{k:'rect',x:108,y:100,w:14,h:5}]},
  straightPull:{v:'s',A:{t:28,th:12,sh:-6,ua:150,fa:150},B:{t:28,th:12,sh:-6,ua:-5,fa:-5},props:[{k:'cable',from:[150,14],at:'H'}]},
  pullup:{v:'s',A:{anchor:'H',at:[104,22],t:-6,th:15,sh:-30,ua:180,fa:180},B:{anchor:'H',at:[104,22],t:-14,th:30,sh:-20,ua:30,fa:185},props:[{k:'bar',x:104,y:22}]},
  hang:{v:'s',A:{anchor:'H',at:[104,22],t:-3,th:3,sh:-5,ua:180,fa:180},B:{anchor:'H',at:[104,22],t:-6,th:8,sh:-12,ua:180,fa:180},props:[{k:'bar',x:104,y:22}]},
  hangingLeg:{v:'s',A:{anchor:'H',at:[104,22],t:-4,th:5,sh:-5,ua:180,fa:180},B:{anchor:'H',at:[104,22],t:-14,th:95,sh:90,ua:180,fa:180},props:[{k:'bar',x:104,y:22}]},
  curl:{v:'s',A:{t:0,th:0,sh:0,ua:-3,fa:0},B:{t:0,th:0,sh:0,ua:8,fa:165},props:[{k:'plate',at:'H',r:8}]},
  curlDb:{v:'s',A:{t:0,th:0,sh:0,ua:-3,fa:0},B:{t:0,th:0,sh:0,ua:8,fa:165},props:[{k:'db'}]},
  hammer:{v:'s',A:{t:0,th:0,sh:0,ua:-3,fa:0},B:{t:0,th:0,sh:0,ua:8,fa:165},props:[{k:'db',rot:90}]},
  curlCable:{v:'s',A:{t:0,th:0,sh:0,ua:-3,fa:5},B:{t:0,th:0,sh:0,ua:8,fa:165},props:[{k:'cable',from:[124,146],at:'H'}]},
  bayesian:{v:'s',A:{t:5,th:8,sh:0,th2:-12,sh2:-12,ua:-35,fa:-35},B:{t:5,th:8,sh:0,th2:-12,sh2:-12,ua:-25,fa:140},props:[{k:'cable',from:[40,140],at:'H'}]},
  preacher:{v:'s',A:{anchor:'hip',at:[92,114],t:12,th:90,sh:0,ua:42,fa:58},B:{anchor:'hip',at:[92,114],t:12,th:90,sh:0,ua:42,fa:170},props:[SEAT,{k:'rect',x:100,y:80,w:30,h:6,rot:42},{k:'plate',at:'H',r:7}]},
  concentration:{v:'s',A:{anchor:'hip',at:[92,114],t:45,th:88,sh:-8,ua:20,fa:20},B:{anchor:'hip',at:[92,114],t:45,th:88,sh:-8,ua:20,fa:165},props:[SEAT,{k:'db'}]},
  inclineCurl:{v:'s',A:{anchor:'hip',at:[110,118],t:-45,th:80,sh:10,ua:-15,fa:-12},B:{anchor:'hip',at:[110,118],t:-45,th:80,sh:10,ua:-8,fa:150},props:[{k:'rect',x:76,y:96,w:42,h:5,rot:-45,back:true},{k:'db'}]},
  spider:{v:'s',A:{anchor:'T',at:[64,G],t:52,th:30,sh:-4,ua:0,fa:0},B:{anchor:'T',at:[64,G],t:52,th:30,sh:-4,ua:0,fa:150},props:[{k:'rect',x:70,y:80,w:50,h:5,rot:38,back:true},{k:'db'}]},
  machineCurl:{v:'s',A:seated({t:5,ua:45,fa:60}),B:seated({t:5,ua:45,fa:170}),props:[SEAT,{k:'rect',x:100,y:84,w:26,h:6,rot:45}]},
  pushdown:{v:'s',A:{t:6,th:0,sh:0,ua:2,fa:160},B:{t:6,th:0,sh:0,ua:-2,fa:5},props:[{k:'cable',from:[118,10],at:'H'}]},
  ohExt:{v:'s',A:{t:-2,th:0,sh:0,ua:172,fa:-20},B:{t:-2,th:0,sh:0,ua:174,fa:178},props:[{k:'db',rot:90,one:true}]},
  ohExtCable:{v:'s',A:{t:28,th:10,sh:-4,th2:-14,sh2:-14,ua:150,fa:20},B:{t:28,th:10,sh:-4,th2:-14,sh2:-14,ua:148,fa:150},props:[{k:'cable',from:[20,120],at:'H'}]},
  ohExtSeat:{v:'s',A:seated({t:-2,ua:172,fa:-20}),B:seated({t:-2,ua:174,fa:178}),props:[SEAT,{k:'plate',at:'H',r:7}]},
  kickback:{v:'s',A:{t:72,th:14,sh:-5,ua:-80,fa:0},B:{t:72,th:14,sh:-5,ua:-80,fa:-80},props:[{k:'db',rot:90,one:true}]},
  wrist:{v:'s',A:seated({t:30,ua:40,fa:88}),B:seated({t:30,ua:40,fa:100}),props:[SEAT,{k:'plate',at:'H',r:6,off:[0,3]}]},
  hold:{v:'s',A:{t:0,th:0,sh:0,ua:0,fa:0},B:{t:0,th:0,sh:0,ua:0,fa:0,nk:5},props:[{k:'rect',x:0,y:0,w:0,h:0}]},
  calf:{v:'s',A:{t:0,th:0,sh:0,ua:0,fa:0,ft:90},B:{t:0,th:0,sh:0,ua:0,fa:0,ft:50},props:[{k:'db'},{k:'rect',x:104,y:144,w:16,h:6,back:true}]},
  calfSeat:{v:'s',A:{anchor:'T',at:[118,144],t:5,th:90,sh:0,ua:30,fa:60,ft:95},B:{anchor:'T',at:[118,144],t:5,th:90,sh:0,ua:30,fa:60,ft:50},props:[{k:'rect',x:74,y:110,w:30,h:5,back:true},{k:'rect',x:108,y:144,w:16,h:6,back:true},{k:'rect',x:96,y:92,w:30,h:5}]},
  tibRaise:{v:'s',A:{anchor:'A',at:[110,147],t:-8,th:-8,sh:-8,ua:-10,fa:-10,ft:110},B:{anchor:'A',at:[110,147],t:-8,th:-8,sh:-8,ua:-10,fa:-10,ft:65},props:[{k:'line',a:[84,30],b:[84,G],w:3}]},
  plank:{v:'s',A:{anchor:'E',at:[132,G],t:78,th:-102,sh:-102,ft:-20,ua:-2,fa:90},B:{anchor:'E',at:[132,G],t:80,th:-100,sh:-100,ft:-20,ua:-2,fa:90,nk:4}},
  sidePlank:{v:'s',A:{anchor:'E',at:[132,G],t:72,th:-108,sh:-108,ft:-20,ua:-2,fa:90,ua2:160,fa2:160},B:{anchor:'E',at:[132,G],t:80,th:-100,sh:-100,ft:-20,ua:-2,fa:90,ua2:175,fa2:175}},
  crunch:{v:'s',A:{anchor:'hip',at:[110,144],t:-88,th:140,sh:30,ua:200,fa:300},B:{anchor:'hip',at:[110,144],t:-48,th:140,sh:30,ua:200,fa:300}},
  cableCrunch:{v:'s',A:{anchor:'K',at:[110,147],t:10,th:-10,sh:-90,ft:0,ua:200,fa:170},B:{anchor:'K',at:[110,147],t:75,th:-10,sh:-90,ft:0,ua:120,fa:100},props:[{k:'cable',from:[140,8],at:'H'}]},
  legRaise:{v:'s',A:{anchor:'hip',at:[110,144],t:-90,th:85,sh:85,ft:175,ua:-80,fa:-80},B:{anchor:'hip',at:[110,144],t:-90,th:175,sh:175,ft:265,ua:-80,fa:-80}},
  captain:{v:'s',A:{anchor:'E',at:[96,74],t:0,th:3,sh:-3,ua:-10,fa:90},B:{anchor:'E',at:[96,74],t:-8,th:100,sh:15,ua:-10,fa:90},props:[{k:'rect',x:84,y:74,w:22,h:5},{k:'rect',x:66,y:40,w:5,h:110,back:true}]},
  abWheel:{v:'s',A:{anchor:'K',at:[78,147],t:28,th:-6,sh:-90,ft:0,ua:28,fa:28},B:{anchor:'K',at:[78,147],t:86,th:-62,sh:-90,ft:0,ua:150,fa:150},props:[{k:'ball',at:'H',r:6,off:[0,5]}]},
  twist:{v:'f',A:{anchor:'hip',at:[100,140],ua:-40,fa:-80,ua2:40,fa2:80,th:40,th2:40,sh:-30,sh2:-30,tl:-6},B:{anchor:'hip',at:[100,140],ua:40,fa:80,ua2:-40,fa2:-80,th:40,th2:40,sh:-30,sh2:-30,tl:6},props:[{k:'ball',at:'H',r:5}]},
  pallof:{v:'s',A:{t:0,th:4,sh:0,th2:-4,sh2:-4,ua:30,fa:120},B:{t:0,th:4,sh:0,th2:-4,sh2:-4,ua:90,fa:90},props:[{k:'cable',from:[20,78],at:'H'}]},
  woodchop:{v:'f',A:{ua:-150,fa:-150,ua2:150,fa2:150,tl:-10,th:6,th2:6},B:{ua:30,fa:30,ua2:-30,fa2:-30,tl:6,th:6,th2:6},props:[{k:'cable',from:[30,10],at:'H'}]},
  deadBug:{v:'s',A:{anchor:'hip',at:[110,144],t:-90,th:180,sh:90,th2:180,sh2:90,ft:180,ua:180,fa:180,ua2:180,fa2:180},B:{anchor:'hip',at:[110,144],t:-90,th:90,sh:90,ft:180,th2:180,sh2:90,ua:270,fa:270,ua2:180,fa2:180}},
  vup:{v:'s',A:{anchor:'hip',at:[110,144],t:-90,th:85,sh:85,ft:175,ua:-90,fa:-90},B:{anchor:'hip',at:[110,140],t:-40,th:140,sh:140,ft:230,ua:130,fa:130}},
  bicycle:{v:'s',A:{anchor:'hip',at:[110,144],t:-65,th:150,sh:60,th2:100,sh2:100,ua:240,fa:330},B:{anchor:'hip',at:[110,144],t:-65,th:100,sh:100,th2:150,sh2:60,ua:240,fa:330}},
  climber:{v:'s',A:{anchor:'H',at:[132,G],t:78,th:-102,sh:-102,ft:-20,th2:60,sh2:-60,ua:0,fa:0},B:{anchor:'H',at:[132,G],t:78,th:60,sh:-60,th2:-102,sh2:-102,ft2:-20,ua:0,fa:0}},
  hollow:{v:'s',A:{anchor:'hip',at:[110,146],t:-75,th:105,sh:105,ft:195,ua:-120,fa:-120},B:{anchor:'hip',at:[110,146],t:-72,th:108,sh:108,ft:198,ua:-118,fa:-118,nk:4}},
  wipers:{v:'s',A:{anchor:'hip',at:[110,144],t:-90,th:178,sh:178,ft:268,ua:-90,fa:-90},B:{anchor:'hip',at:[110,144],t:-90,th:140,sh:140,ft:230,ua:-90,fa:-90}},
  hipAbd:{v:'f',A:{anchor:'hip',at:[100,114],th:4,sh:4,th2:4,sh2:4,ua:20,fa:20},B:{anchor:'hip',at:[100,114],th:38,sh:38,th2:38,sh2:38,ua:20,fa:20},props:[{k:'rect',x:84,y:114,w:32,h:5,back:true}]},
  hipAdd:{v:'f',A:{anchor:'hip',at:[100,114],th:38,sh:38,th2:38,sh2:38,ua:20,fa:20},B:{anchor:'hip',at:[100,114],th:4,sh:4,th2:4,sh2:4,ua:20,fa:20},props:[{k:'rect',x:84,y:114,w:32,h:5,back:true}]},
  cableAbd:{v:'f',A:{anchor:'T2',at:[106,G],th:-4,sh:-4,ua:40,fa:40},B:{anchor:'T2',at:[106,G],th:40,sh:40,ua:40,fa:40},props:[{k:'cable',from:[150,146],at:'A'}]},
  pullThrough:{v:'s',A:{t:75,th:18,sh:-6,ua:-15,fa:-15},B:{t:-2,th:0,sh:0,ua:-5,fa:-5},props:[{k:'cable',from:[30,146],at:'H'}]},
  fly:{v:'f',A:{ua:80,fa:88},B:{ua:-10,fa:-28},props:[{k:'db',rot:90}]},
  crossover:{v:'f',A:{ua:105,fa:100},B:{ua:-5,fa:-30},props:[{k:'cable',from:[30,20],at:'H'},{k:'cable',from:[170,20],at:'H2'}]},
  crossLow:{v:'f',A:{ua:40,fa:40},B:{ua:-15,fa:-120},props:[{k:'cable',from:[30,146],at:'H'},{k:'cable',from:[170,146],at:'H2'}]},
  machineFly:{v:'f',A:{anchor:'T',at:[94,G],ua:95,fa:180},B:{anchor:'T',at:[94,G],ua:30,fa:120},props:[{k:'rect',x:85,y:114,w:30,h:5,back:true}]},
  machinePress:{v:'s',A:seated({t:-6,ua:-30,fa:90}),B:seated({t:-6,ua:88,fa:90}),props:[SEAT,{k:'rect',x:78,y:68,w:5,h:50,back:true}]},
  clean:{v:'s',A:{t:58,th:72,sh:-22,ua:0,fa:0},B:{t:3,th:6,sh:-2,ua:95,fa:200},props:[{k:'plate',at:'H',r:11}]},
  snatch:{v:'s',A:{t:58,th:72,sh:-22,ua:0,fa:0},B:{t:6,th:14,sh:-6,ua:170,fa:175},props:[{k:'plate',at:'H',r:11}]},
  jerk:{v:'s',A:{t:2,th:24,sh:-16,th2:24,sh2:-16,ua:95,fa:200},B:{t:2,th:30,sh:-10,th2:-30,sh2:-50,ft2:150,ua:176,fa:180},props:[{k:'plate',at:'H',r:11}]},
  thruster:{v:'s',A:{t:20,th:92,sh:-38,ua:95,fa:200},B:{t:0,th:0,sh:0,ua:176,fa:180},props:[{k:'plate',at:'H'}]},
  burpee:{v:'s',A:{anchor:'T',at:[86,G],t:5,th:0,sh:0,ua:170,fa:175},B:{anchor:'T',at:[86,G],t:85,th:-95,sh:-95,ft:-20,ua:5,fa:5}},
  tgu:{v:'s',A:{anchor:'hip',at:[100,144],t:-90,th:120,sh:-30,th2:90,sh2:90,ua:180,fa:180},B:{anchor:'hip',at:[100,136],t:-12,th:110,sh:-20,th2:90,sh2:90,ua:180,fa:180,ua2:-30,fa2:-30},props:[{k:'kb',at:'H'}]},
  sled:{v:'s',A:{t:55,th:60,sh:-30,th2:-30,sh2:-40,ft2:130,ua:70,fa:70},B:{t:55,th:-30,sh:-40,ft:130,th2:60,sh2:-30,ua:70,fa:70},props:[{k:'rect',x:150,y:96,w:5,h:46},{k:'rect',x:140,y:140,w:38,h:8}]},
  slam:{v:'s',A:{t:-6,th:0,sh:0,ua:175,fa:178},B:{t:55,th:35,sh:-20,ua:25,fa:20},props:[{k:'ball',at:'H',r:8,off:[3,0]}]},
  ropes:{v:'s',A:{t:20,th:40,sh:-25,ua:50,fa:110},B:{t:20,th:40,sh:-25,ua:20,fa:40},props:[{k:'rope',from:[196,148],at:'H',wave:14}]},
  rower:{v:'s',A:{anchor:'hip',at:[104,136],t:28,th:140,sh:30,ft:160,ua:90,fa:92},B:{anchor:'hip',at:[80,136],t:-24,th:95,sh:85,ft:170,ua:-40,fa:80},props:[{k:'rect',x:40,y:139,w:120,h:4,back:true},{k:'cable',from:[170,126],at:'H'}]},
  bike:{v:'s',A:seated({t:30,th:55,sh:-5,th2:110,sh2:30,ua:75,fa:85}),B:seated({t:30,th:110,sh:30,th2:55,sh2:-5,ua:75,fa:85}),props:[{k:'rect',x:88,y:116,w:18,h:5,back:true},{k:'line',a:[97,121],b:[110,150],w:4},{k:'line',a:[128,90],b:[130,150],w:4}]},
  run:{v:'s',A:{t:10,th:35,sh:-10,th2:-25,sh2:-70,ft2:150,ua:-35,fa:40,ua2:30,fa2:110},B:{t:10,th:-25,sh:-70,ft:150,th2:35,sh2:-10,ua:30,fa:110,ua2:-35,fa2:40},props:[{k:'rect',x:30,y:146,w:140,h:4,back:true}]},
  elliptical:{v:'s',A:{t:5,th:25,sh:-5,th2:-10,sh2:-20,ua:60,fa:120,ua2:20,fa2:140},B:{t:5,th:-10,sh:-20,th2:25,sh2:-5,ua:20,fa:140,ua2:60,fa2:120},props:[{k:'line',a:[150,40],b:[150,150],w:4}]},
  jumpRope:{v:'s',A:{t:3,th:2,sh:0,ft:90,ua:10,fa:70},B:{t:3,th:6,sh:-6,ft:60,ua:10,fa:70,anchor:'T',at:[100,141]},props:[{k:'jrope'}]},
  wristRoller:{v:'s',A:{t:0,th:0,sh:0,ua:90,fa:90},B:{t:0,th:0,sh:0,ua:90,fa:98},props:[{k:'roller'}]},
  pinch:{v:'s',A:{t:0,th:0,sh:0,ua:0,fa:0},B:{t:0,th:0,sh:0,ua:0,fa:0,nk:4},props:[{k:'plate',at:'H',r:9}]}
};

/* ---------- ćwiczenie → wzorzec ---------- */
const EX={
 'Wyciskanie sztangi na ławce':'bench','Wyciskanie sztangi na ławce skośnej':'incline','Wyciskanie hantli na ławce':'benchDb','Wyciskanie hantli na ławce skośnej':'inclineDb','Rozpiętki z hantlami':'fly','Krzyżowanie linek wyciągu':'crossover','Wyciskanie na maszynie':'machinePress','Pompki':'pushup','Pompki na poręczach':'dips','Wyciskanie sztangi na ławce ujemnej':'decline','Wyciskanie hantli na ławce ujemnej':'decline','Wyciskanie na suwnicy Smitha':'bench','Rozpiętki na maszynie (butterfly)':'machineFly','Krzyżowanie linek z dołu':'crossLow','Przenoszenie hantla za głowę':'pullover','Wyciskanie hantli chwytem neutralnym':'benchDb','Pompki z nogami na podwyższeniu':'pushupInc','Wyciskanie na podłodze':'floorPress','Wyciskanie sztangi z pauzą':'bench',
 'Martwy ciąg':'deadlift','Podciąganie na drążku':'pullup','Podciąganie podchwytem':'pullup','Wiosłowanie sztangą':'row','Wiosłowanie hantlem jednorącz':'row1arm','Ściąganie drążka wyciągu do klatki':'pulldown','Wiosłowanie na wyciągu siedząc':'cableRow','Wiosłowanie T-sztangą':'row','Prostowanie tułowia na ławce rzymskiej':'backExt','Szrugsy ze sztangą':'shrugBar','Martwy ciąg sumo':'sumo','Martwy ciąg z trap bar':'deadlift','Wiosłowanie Pendlay':'row','Wiosłowanie hantlami w opadzie':'rowDb','Wiosłowanie na maszynie':'machineRow','Wiosłowanie na ławce skośnej':'rowChest','Ściąganie drążka wąskim chwytem':'pulldown','Ściąganie drążka prostymi ramionami':'straightPull','Podciąganie z obciążeniem':'pullup','Podciąganie australijskie':'invRow','Wiosłowanie Meadows':'row1arm','Szrugsy z hantlami':'shrug','Rack pull':'rackPull','Dzień dobry':'goodMorning','Superman':'superman',
 'Wyciskanie żołnierskie':'ohp','Wyciskanie hantli nad głowę':'ohpDb','Arnoldki':'ohpSeat','Unoszenie hantli bokiem':'latRaise','Unoszenie hantli przodem':'frontRaise','Odwrotne rozpiętki':'rearFly','Face pull':'facePull','Podciąganie sztangi wzdłuż tułowia':'uprightRow','Wyciskanie hantli siedząc':'ohpSeat','Wyciskanie na maszynie nad głowę':'ohpMachine','Push press':'pushPress','Wyciskanie sztangi zza karku':'ohp','Unoszenie ramion bokiem na wyciągu':'latCable','Unoszenie bokiem na maszynie':'latMachine','Odwrotne rozpiętki na maszynie':'rearMachine','Unoszenie hantli w opadzie':'rearFly','Wyciskanie landmine':'landmine','Rotacja zewnętrzna na wyciągu':'extRot','Pompki w staniu na rękach':'handstand',
 'Uginanie ramion ze sztangą':'curl','Uginanie ramion z hantlami':'curlDb','Uginanie młotkowe':'hammer','Uginanie na modlitewniku':'preacher','Uginanie na wyciągu':'curlCable','Uginanie skoncentrowane':'concentration','Uginanie ramion ze sztangą łamaną':'curl','Uginanie na ławce skośnej':'inclineCurl','Uginanie z supinacją':'curlDb','Uginanie na modlitewniku z hantlem':'preacher','Uginanie na wyciągu linką (młotkowe)':'curlCable','Uginanie Bayesian na wyciągu':'bayesian','Uginanie pająk':'spider','Uginanie na maszynie':'machineCurl','Uginanie odwrotnym chwytem':'curl','Uginanie Zottman':'curlDb',
 'Wyciskanie francuskie':'skull','Prostowanie ramion na wyciągu':'pushdown','Wyciskanie wąsko na ławce':'bench','Prostowanie ramienia z hantlem nad głową':'ohExt','Pompki w podporze tyłem':'benchDip','Prostowanie ramion linką na wyciągu':'pushdown','Prostowanie ramion nad głową na wyciągu':'ohExtCable','Prostowanie ramienia w opadzie (kickback)':'kickback','Wyciskanie francuskie z hantlami':'skull','Wyciskanie francuskie siedząc':'ohExtSeat','Pompki diamentowe':'pushup','Prostowanie ramion jednorącz na wyciągu':'pushdown','Pompki na poręczach na maszynie':'dips','Wyciskanie JM':'skull',
 'Uginanie nadgarstków':'wrist','Spacer farmera':'farmer','Zwis na drążku':'hang','Odwrotne uginanie nadgarstków':'wrist','Nawijanie linki z ciężarkiem':'wristRoller','Trzymanie talerzy chwytem szczypcowym':'pinch','Uginanie nadgarstków za plecami':'wrist',
 'Przysiad ze sztangą':'squat','Przysiad przedni':'frontSquat','Przysiad goblet':'gobletSquat','Wypychanie nóg na suwnicy':'legPress','Prostowanie nóg na maszynie':'legExt','Wykroki z hantlami':'lunge','Przysiad bułgarski':'bulgarian','Hack przysiad':'machineSquat','Przysiad na suwnicy Smitha':'squat','Przysiad z pauzą':'squat','Przysiad z hantlami':'dbSquat','Wejścia na skrzynię':'stepUp','Wykroki chodzone':'lunge','Wykroki w tył':'lunge','Przysiad sissy':'sissy','Przysiad pistoletowy':'pistol','Przysiad na pasie (belt squat)':'dbSquat','Pendulum squat':'machineSquat','Przysiad pod ścianą':'wallSit','Skoki na skrzynię':'boxJump',
 'Martwy ciąg rumuński':'rdl','Uginanie nóg na maszynie':'legCurl','Hip thrust':'hipThrust','Mostek biodrowy':'glueBridge','Swing kettlebell':'swing','Odwodzenie nóg na maszynie':'hipAbd','Martwy ciąg na prostych nogach':'rdl','Martwy ciąg rumuński z hantlami':'rdlDb','Martwy ciąg na jednej nodze':'singleRdl','Uginanie nóg siedząc':'legCurl','Uginanie nóg stojąc jednonóż':'legCurl','Nordic curl':'nordic','Glute ham raise':'nordic','Hip thrust na maszynie':'hipThrust','Hip thrust jednonóż':'hipThrust','Odwodzenie nogi na wyciągu':'cableAbd','Przyciąganie wyciągu między nogami':'pullThrough','Przywodzenie nóg na maszynie':'hipAdd','Odwrotna hiperekstensja':'revHyper',
 'Wspięcia na palce':'calf','Wspięcia na palce siedząc':'calfSeat','Wspięcia na palce na suwnicy':'calf','Wspięcia na palce z hantlem jednonóż':'calf','Wspięcia na palce w Smithie':'calf','Wspięcia „ośle”':'calf','Unoszenie stóp (piszczelowy)':'tibRaise',
 'Deska':'plank','Brzuszki':'crunch','Unoszenie nóg w zwisie':'hangingLeg','Allahy (spięcia na wyciągu)':'cableCrunch','Kółko do brzucha':'abWheel','Rosyjskie skręty':'twist','Deska boczna':'sidePlank','Unoszenie nóg leżąc':'legRaise','Unoszenie kolan w podporze':'captain','Pallof press':'pallof','Drwal na wyciągu':'woodchop','Martwy robak':'deadBug','Scyzoryki':'vup','Rowerek':'bicycle','Wspinaczka (mountain climbers)':'climber','Hollow hold':'hollow','Spacer walizkowy':'suitcase','Wycieraczki':'wipers',
 'Zarzut sztangi na klatkę':'clean','Rwanie sztangi':'snatch','Podrzut':'jerk','Thruster':'thruster','Burpees':'burpee','Turkish get-up':'tgu','Pchanie sań':'sled','Uderzenia piłką lekarską':'slam','Liny bojowe':'ropes','Wioślarz':'rower','Rower stacjonarny':'bike','Bieżnia':'run','Orbitrek':'elliptical','Skakanka':'jumpRope'
};
const BY_GROUP={'Chest':'benchDb','Back':'row','Shoulders':'ohpDb','Biceps':'curlDb','Triceps':'pushdown','Forearms':'wrist','Quads':'squat','Hamstrings & Glutes':'rdl','Calves':'calf','Core':'crunch','Full Body & Conditioning':'burpee'};
// statyczne ćwiczenia (trzymanie pozycji) animujemy wolniej i krócej
const HOLD=new Set(['plank','sidePlank','hollow','hang','wallSit','pinch','hold']);
window.EXERCISE_ANIM={patterns:P,ex:EX,byGroup:BY_GROUP,hold:HOLD,draw,pose,G,
  specFor(pl,groupEn){const k=EX[pl]||BY_GROUP[groupEn];return k?{key:k,spec:P[k]}:null}};
})();
