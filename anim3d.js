// Animacje 3D: szczegółowa postać w przestrzeni, sprzęt w perspektywie, obrót kamery, kolorowe pracujące mięśnie.
// Wzorce ruchu (pozy A i B) pochodzą z anim.js; tu zamieniamy je na szkielet 3D i rysujemy jako SVG.
// Osie świata: x = do przodu (dla widoku z boku), y = w dół (ekran), z = w bok (lewa strona postaci +).
// Kamera: yaw 0 = widok z boku, 90° = widok z przodu.
(function(){
const EA=window.EXERCISE_ANIM;if(!EA)return;
const G=EA.G,R=Math.PI/180;
const HEAT={3:'#E0352B',2:'#F28C28',1:'#F6CB45'};
const C={body:'#B4C1E3',bodyD:'#3A4670',shorts:'#46578F',shortsD:'#1F2747',shoe:'#1B2140',hair:'#262B42',steel:'#D2DAEE',plate:'#F0A202',plateD:'#8A5A00',equip:'#5F6F9E',equipD:'#26304F',grid:'#3B4A72',line:'#14193A'};

/* ---------- wektory ---------- */
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(a[0],a[1],a[2]);
const nrm=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l]};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mid=(a,b)=>mul(add(a,b),.5),lerp=(a,b,t)=>add(a,mul(sub(b,a),t));
const orth=(v,d)=>nrm(sub(v,mul(d,dot(v,d))));
const f1=n=>n.toFixed(1),f2=n=>n.toFixed(2);
function mix(a,b,t){t=Math.max(0,Math.min(1,t));const p=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}

/* ---------- mięśnie: gdzie leżą na bryle ---------- */
// tułów: sekcje 1 miednica, 2 tułów (talia–klatka), 3 góra (klatka–barki); ściany F przód, B tył, S boki
const TORSO_M={
  cu:[[3,'F',.12,.9,0,.95]],cm:[[2,'F',.1,.92,.58,1]],cl:[[2,'F',.12,.85,.38,.62]],
  ab:[[2,'F',0,.36,.02,.42]],ob:[[2,'F',.55,.95,.04,.42],[2,'S',-.5,.6,.04,.5]],
  tu:[[3,'B',.12,.85,.1,1]],tm:[[2,'B',.08,.6,.68,1]],tl:[[2,'B',.08,.42,.36,.72]],
  la:[[2,'B',.45,.97,.2,.88],[2,'S',-.95,-.2,.25,.9]],ro:[[3,'B',.6,.97,0,.6]],
  er:[[2,'B',.04,.3,0,.62],[1,'B',.04,.3,.55,1]],gx:[[1,'B',.08,.95,0,.8]],gm:[[1,'S',-.7,.2,.55,1]]
};
// kończyny: odcinek UA ramię, FA przedramię, TH udo, SH podudzie; strona ant/post/lat/med; zakres wzdłuż odcinka
const LIMB_M={
  bl:[['UA','ant',.15,.85]],bs:[['UA','ant',.2,.8]],br:[['UA','lat',.5,.92]],brr:[['FA','lat',0,.5]],
  ff:[['FA','ant',.08,.7]],fe:[['FA','post',.08,.7]],tlo:[['UA','post',.08,.75]],tla:[['UA','lat',.15,.7]],tme:[['UA','post',.5,.92]],
  rf:[['TH','ant',.1,.9]],vl:[['TH','lat',.2,.92]],vm:[['TH','med',.55,.94]],ad:[['TH','med',.05,.6]],
  bf:[['TH','post',.2,.9]],se:[['TH','post',.25,.92]],gmd:[['SH','post',.06,.5]],glt:[['SH','post',.06,.5]],so:[['SH','post',.4,.82]],ti:[['SH','ant',.1,.6]]
};
const DELT={df:'ant',ds:'lat',dr:'post'};

/* ---------- koncentryka: w którą stronę ruchu pracują mięśnie ---------- */
const CONC_OVERRIDE={glueBridge:'AB',hipThrust:'AB',legCurl:'AB',revHyper:'AB',superman:'AB',nordic:'BA',backExt:'AB',hipAbd:'AB',hipAdd:'AB',machineCurl:'AB',legExt:'AB',crunch:'AB',cableCrunch:'AB',legRaise:'AB',vup:'AB',captain:'AB',hangingLeg:'AB',abWheel:'BA',twist:'AB',woodchop:'AB',pallof:'AB',farmer:'AB',run:'AB',bike:'AB',elliptical:'AB',jumpRope:'AB',ropes:'AB',sled:'AB',climber:'AB',bicycle:'AB',wipers:'AB',deadBug:'AB',rower:'AB',rearMachine:'AB',machineFly:'AB',fly:'AB',crossover:'AB',crossLow:'AB',latMachine:'AB',cableAbd:'AB',calfSeat:'AB',calf:'AB',tibRaise:'AB',wristRoller:'AB',wrist:'AB',extRot:'AB',facePull:'AB'};
function conc(key,spec){
  if(CONC_OVERRIDE[key])return CONC_OVERRIDE[key];
  const PA=EA.pose(spec,0),PB=EA.pose(spec,1),pr=spec.props||[];
  const cab=pr.find(p=>p.k==='cable');
  if(cab){const d=P=>Math.hypot(P.H[0]-cab.from[0],P.H[1]-cab.from[1]);return d(PB)>d(PA)?'AB':'BA'}
  const ld=pr.find(p=>['plate','db','kb','ball','barF','lever','roller'].includes(p.k));
  let ya,yb;
  if(ld){const at=ld.k==='plate'||ld.k==='kb'||ld.k==='ball'?(ld.at||'H'):'H';ya=PA[at][1];yb=PB[at][1]}
  else{const keys=Object.keys(PA).filter(k=>Array.isArray(PA[k])&&k!=='q');ya=keys.reduce((s,k)=>s+PA[k][1],0);yb=keys.reduce((s,k)=>s+PB[k][1],0)}
  return yb<ya-.5?'AB':'BA';
}

/* ---------- szkielet 3D z pozy 2D ---------- */
function grip(spec){
  const pr=spec.props||[];
  if(pr.some(p=>p.k==='plate'&&p.at==='S'))return{h:19,e:18};
  if(pr.some(p=>p.k==='plate'&&(p.at||'H')==='H'&&(p.r||10)>=9))return{h:16,e:15.5};
  if(pr.some(p=>p.k==='bar'))return{h:17,e:16.5};
  return{h:12,e:13};
}
function skeleton(spec,k){
  const P=EA.pose(spec,k),J={};
  if(spec.v==='f'){
    const xc=(P.hp[0]+P.hp2[0])/2,X0=100,w=p=>[X0,p[1],-(p[0]-xc)];
    J.SL=w(P.S);J.SR=w(P.S2);J.EL=w(P.E);J.ER=w(P.E2);J.HL=w(P.H);J.HR=w(P.H2);
    J.PL=w(P.hp);J.PR=w(P.hp2);J.KL=w(P.K);J.KR=w(P.K2);J.AL=w(P.A);J.AR=w(P.A2);
    J.TL=add(J.AL,[8,0,1.5]);J.TR=add(J.AR,[8,0,-1.5]);J.N=w(P.Nk);J.Hd=w(P.Hd);
    J.N=lerp(J.N,J.Hd,.15);J.front=true;
  }else{
    const g=grip(spec),z=(p,zz)=>[p[0],p[1],zz];
    J.SL=z(P.S,10.5);J.SR=z(P.S,-10.5);J.EL=z(P.E,g.e);J.ER=z(P.E2,-g.e);J.HL=z(P.H,g.h);J.HR=z(P.H2,-g.h);
    J.PL=z(P.hip,6.5);J.PR=z(P.hip,-6.5);J.KL=z(P.K,7.5);J.KR=z(P.K2,-7.5);J.AL=z(P.A,7.5);J.AR=z(P.A2,-7.5);
    J.TL=z(P.T,8.8);J.TR=z(P.T2,-8.8);J.N=z(P.N,0);J.Hd=z(P.Hd,0);
  }
  J.P=P;return J;
}

/* ---------- kamera ---------- */
function camera(yaw,cx,cy,F){
  const c=Math.cos(yaw),s=Math.sin(yaw);
  const pr=p=>{const x=p[0]-cx,X=x*c-p[2]*s,D=x*s+p[2]*c,k=F/(F-D);return{x:cx+X*k,y:cy+(p[1]-cy)*k,d:D,s:k}};
  const dir=v=>[v[0]*c-v[2]*s,v[1],v[0]*s+v[2]*c]; // kierunek w układzie kamery: [ekran x, ekran y, do widza]
  return{pr,dir};
}
const LIGHT=nrm([-.45,-.75,.55]);
const shadeOf=(cam,n)=>{const d=cam.dir(n);return .42+.58*Math.max(0,dot(d,LIGHT))};

/* ---------- rysowanie elementów ---------- */
function capsule(a,b,ra,rb,fill){ // a,b: punkty ekranowe; ra,rb: promienie na ekranie
  const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1e-3,nx=-dy/l,ny=dx/l;
  return `<path d="M${f2(a.x+nx*ra)} ${f2(a.y+ny*ra)}L${f2(b.x+nx*rb)} ${f2(b.y+ny*rb)}L${f2(b.x-nx*rb)} ${f2(b.y-ny*rb)}L${f2(a.x-nx*ra)} ${f2(a.y-ny*ra)}Z" fill="${fill}"/><circle cx="${f2(a.x)}" cy="${f2(a.y)}" r="${f2(ra)}" fill="${fill}"/><circle cx="${f2(b.x)}" cy="${f2(b.y)}" r="${f2(rb)}" fill="${fill}"/>`;
}
function poly(pts,fill,extra=''){return `<path d="M${pts.map(p=>f2(p.x)+' '+f2(p.y)).join('L')}Z" fill="${fill}"${extra}/>`}
function hull(pts){
  pts=pts.slice().sort((a,b)=>a.x-b.x||a.y-b.y);if(pts.length<3)return pts;
  const cr=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x),lo=[],up=[];
  for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
  for(const p of pts.reverse()){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}
  return lo.slice(0,-1).concat(up.slice(0,-1));
}

/* ---------- scena ---------- */
// opts: {yaw, eff (0..1), load {akton:1..3}, cx, cy, F, t (ms, do lin)}
function scene(spec,k,o){
  const J=skeleton(spec,k),cam=camera(o.yaw,o.cx,o.cy,o.F||320),pr=cam.pr,items=[],load=o.load||{},eff=o.eff??.6;
  const heatOp=lvl=>lvl===3?.38+.62*eff:lvl===2?.3+.45*eff:.28+.2*eff;
  const push=(d,draw)=>items.push({d,draw});
  // tułów: oś i przekroje
  const hipC=mid(J.PL,J.PR),shC=mid(J.SL,J.SR),u=nrm(sub(shC,hipC)),L=nrm(sub(J.SL,J.SR)),n=nrm(cross(L,u)),H=len(sub(shC,hipC));
  const sec=(t,w,th,shift=0)=>{const c=add(add(hipC,mul(u,H*t)),mul(n,shift));return{FL:add(add(c,mul(L,w)),mul(n,th)),FR:add(add(c,mul(L,-w)),mul(n,th)),BR:add(add(c,mul(L,-w)),mul(n,-th)),BL:add(add(c,mul(L,w)),mul(n,-th))}};
  const X=[sec(-.06,8.6,5.2,-.6),sec(.42,8.2,4.3),sec(.8,10.6,5.6,.5),sec(1.04,8.4,3.6,-.4)];
  const faceDefs=(a,b)=>({F:[a.FR,a.FL,b.FL,b.FR,n],B:[a.BL,a.BR,b.BR,b.BL,mul(n,-1)],SL:[a.BL,a.FL,b.FL,b.BL,L],SR:[a.FR,a.BR,b.BR,b.FR,mul(L,-1)]});
  for(let si=0;si<3;si++){
    const fd=faceDefs(X[si],X[si+1]),base=si===0?C.shorts:C.body,dark=si===0?C.shortsD:C.bodyD;
    for(const [fn,f] of Object.entries(fd)){
      const nv=f[4],cd=cam.dir(nv);if(cd[2]<-.02)continue;
      const P4=f.slice(0,4).map(pr),d=P4.reduce((s,p)=>s+p.d,0)/4;
      push(d,()=>{
        let s=poly(P4,mix(dark,base,shadeOf(cam,nv)));
        // mięśnie na ścianie: u od środka (0) do krawędzi (1), v od dołu (0) do góry (1)
        const quad=(u0,u1,v0,v1,side)=>{ // side: +1 lewa połowa (FL/BL), -1 prawa
          const at=(uu,vv)=>{const w=side*uu;let A,Bt;
            if(fn==='F'){A=lerp(f[0],f[1],(w+1)/2);Bt=lerp(f[3],f[2],(w+1)/2)}
            else if(fn==='B'){A=lerp(f[1],f[0],(w+1)/2);Bt=lerp(f[2],f[3],(w+1)/2)}
            else{A=lerp(f[0],f[1],(uu+1)/2);Bt=lerp(f[3],f[2],(uu+1)/2)}
            return pr(lerp(A,Bt,vv))};
          return [at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1)]};
        for(const [id,lv] of Object.entries(load)){
          for(const m of (TORSO_M[id]||[])){
            if(m[0]!==si+1)continue;
            const want=m[1]==='S'?(fn==='SL'||fn==='SR'):m[1]===fn;if(!want)continue;
            const op=heatOp(lv);
            if(m[1]==='S')s+=poly(quad(m[2],m[3],m[4],m[5],1),HEAT[lv],` opacity="${f2(op)}"`);
            else for(const sd of [1,-1])s+=poly(quad(m[2],m[3],m[4],m[5],sd),HEAT[lv],` opacity="${f2(op)}"`);
          }
        }
        // rysunek anatomiczny: linia mostka, kratka brzucha, kręgosłup
        if(si===1&&fn==='F'){const a=quad(0,0,.06,.98,1);s+=`<path d="M${f2(a[0].x)} ${f2(a[0].y)}L${f2(a[3].x)} ${f2(a[3].y)}" stroke="${C.line}" stroke-width=".5" opacity=".45"/>`;
          for(const v of [.12,.26,.4]){const b=quad(-.38,.38,v,v,1);s+=`<path d="M${f2(b[0].x)} ${f2(b[0].y)}L${f2(b[1].x)} ${f2(b[1].y)}" stroke="${C.line}" stroke-width=".45" opacity=".4"/>`}
          const p=quad(-.9,.9,.6,.6,1);s+=`<path d="M${f2(p[0].x)} ${f2(p[0].y)}Q${f2((p[0].x+p[1].x)/2)} ${f2((p[0].y+p[1].y)/2+1.2)} ${f2(p[1].x)} ${f2(p[1].y)}" fill="none" stroke="${C.line}" stroke-width=".5" opacity=".45"/>`}
        if(si>=1&&fn==='B'){const a=quad(0,0,0,1,1);s+=`<path d="M${f2(a[0].x)} ${f2(a[0].y)}L${f2(a[3].x)} ${f2(a[3].y)}" stroke="${C.line}" stroke-width=".55" opacity=".45"/>`}
        return s});
    }
  }
  // górna pokrywa tułowia (barki)
  {const t=X[3],nv=u,cd=cam.dir(nv);if(cd[2]>-.02){const P4=[t.FL,t.FR,t.BR,t.BL].map(pr);push(P4.reduce((s,p)=>s+p.d,0)/4,()=>poly(P4,mix(C.bodyD,C.body,shadeOf(cam,nv))))}}
  {const t=X[0],nv=mul(u,-1),cd=cam.dir(nv);if(cd[2]>-.02){const P4=[t.FL,t.FR,t.BR,t.BL].map(pr);push(P4.reduce((s,p)=>s+p.d,0)/4,()=>poly(P4,mix(C.shortsD,C.shorts,shadeOf(cam,nv))))}}

  // kończyny
  const limbAnt=(d,side)=>{let a=J.front?orth([1,0,0],d):cross(d,L);if(len(a)<.25)a=orth(n,d);return nrm(a)};
  const seg=(a,b,ra,rb,col,dk,mus,side,segName)=>{
    const A=pr(a),B=pr(b),d=nrm(sub(b,a)),depth=(A.d+B.d)/2;
    push(depth,()=>{
      const sh=.55+.45*Math.max(0,Math.min(1,(depth+30)/60));
      let s=capsule(A,B,ra*A.s,rb*B.s,mix(dk,col,sh));
      // połysk walca
      const hl=cam.dir([-(B.y-A.y),B.x-A.x,0]);
      s+=`<path d="M${f2(A.x-(B.y-A.y)/(Math.hypot(B.x-A.x,B.y-A.y)||1)*ra*A.s*.38)} ${f2(A.y+(B.x-A.x)/(Math.hypot(B.x-A.x,B.y-A.y)||1)*ra*A.s*.38)}L${f2(B.x-(B.y-A.y)/(Math.hypot(B.x-A.x,B.y-A.y)||1)*rb*B.s*.38)} ${f2(B.y+(B.x-A.x)/(Math.hypot(B.x-A.x,B.y-A.y)||1)*rb*B.s*.38)}" stroke="#fff" stroke-opacity=".16" stroke-width="${f2(Math.min(ra*A.s,rb*B.s)*.5)}" stroke-linecap="round"/>`;
      if(segName){
        const ant=limbAnt(d,side),lat=orth(mul(L,side),d),dirs={ant,post:mul(ant,-1),lat,med:mul(lat,-1)};
        for(const [id,lv] of Object.entries(load))for(const m of (LIMB_M[id]||[])){
          if(m[0]!==segName)continue;const dv=dirs[m[1]],vis=cam.dir(dv)[2];if(vis<-.3)continue;
          const r0=ra+(rb-ra)*m[2],r1=ra+(rb-ra)*m[3];
          const p0=pr(add(lerp(a,b,m[2]),mul(dv,r0*.42))),p1=pr(add(lerp(a,b,m[3]),mul(dv,r1*.42)));
          s+=`<g opacity="${f2(heatOp(lv)*Math.min(1,.55+vis))}">${capsule(p0,p1,r0*.6*p0.s,r1*.6*p1.s,HEAT[lv])}</g>`;
        }
      }
      return s});
  };
  for(const [sd,S,E,Hh,Pp,K,A,T] of [[1,J.SL,J.EL,J.HL,J.PL,J.KL,J.AL,J.TL],[-1,J.SR,J.ER,J.HR,J.PR,J.KR,J.AR,J.TR]]){
    const top=add(Pp,mul(u,1.5));
    seg(top,K,5.6,4,C.body,C.bodyD,true,sd,'TH');
    seg(top,lerp(top,K,.32),5.9,5.2,C.shorts,C.shortsD,false,sd); // nogawka
    seg(K,A,3.9,2.7,C.body,C.bodyD,true,sd,'SH');
    const fd=nrm(sub(T,A)),heel=add(A,add(mul(fd,-2.6),[0,1.2,0]));
    seg(heel,T,2.5,2,C.shoe,'#0B0F22',false,sd);
    seg(S,E,3.6,2.9,C.body,C.bodyD,true,sd,'UA');
    seg(E,Hh,2.9,2.2,C.body,C.bodyD,true,sd,'FA');
    const hd=nrm(sub(Hh,E));seg(Hh,add(Hh,mul(hd,3.6)),2.3,1.9,C.body,C.bodyD,false,sd);
    // naramienny jako kula z trzema aktonami
    const D=pr(add(S,mul(L,sd*1.2)));
    push(D.d+.5,()=>{let s=`<circle cx="${f2(D.x)}" cy="${f2(D.y)}" r="${f2(4.7*D.s)}" fill="${mix(C.bodyD,C.body,.62+.38*Math.max(0,cam.dir(mul(L,sd))[2]))}"/>`;
      for(const [id,side] of Object.entries(DELT)){const lv=load[id];if(!lv)continue;
        const v=side==='ant'?n:side==='post'?mul(n,-1):mul(L,sd),vis=cam.dir(v)[2];if(vis<-.35)continue;
        const c=pr(add(add(S,mul(L,sd*1.2)),mul(v,2.3)));s+=`<circle cx="${f2(c.x)}" cy="${f2(c.y)}" r="${f2(2.9*c.s)}" fill="${HEAT[lv]}" opacity="${f2(heatOp(lv)*Math.min(1,.6+vis))}"/>`}
      return s});
  }
  // szyja i głowa (włosy, twarz, nos, ucho)
  {const N0=add(shC,mul(u,1)),Hd=J.Hd,N1=lerp(N0,Hd,.55);seg(N0,N1,2.9,2.6,C.body,C.bodyD,false,1);
    const hu=nrm(sub(Hd,N0)),hf=orth(n,hu),hp=pr(Hd);
    push(hp.d,()=>{const r=7*hp.s,face=cam.dir(hf)[2];
      const hair=pr(add(add(Hd,mul(hf,-1.4)),mul(hu,1.1))),fc=pr(add(add(Hd,mul(hf,.9)),mul(hu,-.5)));
      const ear=L[0]*0+ (cam.dir(L)[2]>=0?1:-1),eP=pr(add(Hd,mul(L,ear*6.4)));
      let s=`<circle cx="${f2(hp.x)}" cy="${f2(hp.y)}" r="${f2(r)}" fill="${mix(C.bodyD,C.body,.85)}"/>`;
      const hairC=`<circle cx="${f2(hair.x)}" cy="${f2(hair.y)}" r="${f2(6.4*hair.s)}" fill="${C.hair}"/>`,faceC=`<circle cx="${f2(fc.x)}" cy="${f2(fc.y)}" r="${f2(5.9*fc.s)}" fill="${mix(C.bodyD,C.body,.95)}"/>`;
      s+=face>=0?hairC+faceC:faceC+hairC;
      if(Math.abs(cam.dir(L)[2])>.2)s+=`<circle cx="${f2(eP.x)}" cy="${f2(eP.y)}" r="${f2(1.5*eP.s)}" fill="${mix(C.bodyD,C.body,.7)}"/>`;
      if(face>-.2){const no=pr(add(add(Hd,mul(hf,7.1)),mul(hu,-.8)));s+=`<circle cx="${f2(no.x)}" cy="${f2(no.y)}" r="${f2(1.25*no.s)}" fill="${mix(C.bodyD,C.body,.75)}"/>`}
      return s});
  }

  // sprzęt
  props(spec,J,pr,cam,push,o.t||0);

  // podłoga: siatka i cień
  let floor='';
  const gx=o.cx,gz=0;
  for(let i=-5;i<=5;i++){const a=pr([gx+i*14,G,-70]),b=pr([gx+i*14,G,70]),c=pr([gx-70,G,i*14]),d=pr([gx+70,G,i*14]);
    floor+=`<path d="M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}M${f1(c.x)} ${f1(c.y)}L${f1(d.x)} ${f1(d.y)}"/>`}
  floor=`<g stroke="${C.grid}" stroke-width=".45" fill="none" opacity=".85">${floor}</g>`;
  const jp=['SL','SR','EL','ER','HL','HR','PL','PR','KL','KR','AL','AR','TL','TR','Hd'].map(k=>pr([J[k][0],G,J[k][2]]));
  const hl=hull(jp);floor+=hl.length>2?`<path d="M${hl.map(p=>f1(p.x)+' '+f1(p.y)).join('L')}Z" fill="#000" opacity=".26" stroke="#000" stroke-opacity=".18" stroke-width="5" stroke-linejoin="round"/>`:'';

  items.sort((a,b)=>a.d-b.d);
  return floor+items.map(i=>i.draw()).join('');
}

/* ---------- sprzęt w 3D ---------- */
function props(spec,J,pr,cam,push,t){ // sprzęt oznaczony back (ławki, siedziska) rysujemy przed postacią
  const P=J.P,front=spec.v==='f';
  const w2=(p,z=0)=>front?[100,p[1],-(p[0]-(P.hp[0]+P.hp2[0])/2)]:[p[0],p[1],z];
  const disc=(c,r,axis,fill,stroke)=>{ // krążek prostopadły do osi (z albo x)
    const p=pr(c),ax=cam.dir(axis==='z'?[0,0,1]:[1,0,0]),sq=Math.abs(ax[2]);
    const rx=Math.max(.9,r*Math.sqrt(1-ax[0]*ax[0]))*p.s,ry=r*p.s,ang=Math.atan2(ax[1],ax[0])/R;
    return `<ellipse cx="${f2(p.x)}" cy="${f2(p.y)}" rx="${f2(Math.max(.9,r*Math.abs(ax[2])+0*sq)*p.s)}" ry="${f2(ry)}" transform="rotate(${f1(ang)} ${f2(p.x)} ${f2(p.y)})" fill="${fill}" stroke="${stroke}" stroke-width=".7"/>`};
  const rod=(a,b,r,col)=>{const A=pr(a),B=pr(b);push((A.d+B.d)/2,()=>capsule(A,B,r*A.s,r*B.s,col))};
  const box=(c,hx,hy,hz,rot,col,dk)=>{ // prostopadłościan wokół c, obrót w płaszczyźnie x-y
    const cs=Math.cos(rot*R),sn=Math.sin(rot*R),ax=[cs,sn,0],ay=[-sn,cs,0],az=[0,0,1];
    const V=(i,j,l)=>add(add(add(c,mul(ax,i*hx)),mul(ay,j*hy)),mul(az,l*hz));
    const faces=[[[V(1,-1,-1),V(1,1,-1),V(1,1,1),V(1,-1,1)],ax],[[V(-1,-1,1),V(-1,1,1),V(-1,1,-1),V(-1,-1,-1)],mul(ax,-1)],
      [[V(-1,-1,-1),V(1,-1,-1),V(1,-1,1),V(-1,-1,1)],mul(ay,-1)],[[V(-1,1,1),V(1,1,1),V(1,1,-1),V(-1,1,-1)],ay],
      [[V(-1,-1,1),V(1,-1,1),V(1,1,1),V(-1,1,1)],az],[[V(1,-1,-1),V(-1,-1,-1),V(-1,1,-1),V(1,1,-1)],mul(az,-1)]];
    for(const [q,nv] of faces){if(cam.dir(nv)[2]<-.02)continue;const P4=q.map(pr);push(P4.reduce((s,p)=>s+p.d,0)/4,()=>poly(P4,mix(dk,col,shadeOf(cam,nv)),` stroke="${dk}" stroke-width=".4"`))}
  };
  const barbell=(c,r,half,axis='z')=>{
    const A=axis==='z'?[0,0,1]:[1,0,0];
    rod(add(c,mul(A,-half)),add(c,mul(A,half)),1,C.steel);
    for(const sd of [-1,1]){const pc=add(c,mul(A,sd*(half-8))),p=pr(pc);
      push(p.d,()=>disc(add(pc,mul(A,sd*1.6)),r,axis,C.plateD,C.plateD)+disc(pc,r,axis,C.plate,C.plateD)+disc(pc,r*.22,axis,C.steel,C.plateD));
      const cl=add(c,mul(A,sd*(half-12.5)));rod(cl,add(cl,mul(A,sd*1.5)),1.8,C.steel)}
  };
  const dumbbell=(c,axis)=>{const A=axis==='z'?[0,0,1]:[1,0,0];rod(add(c,mul(A,-4.5)),add(c,mul(A,4.5)),.9,C.steel);
    for(const sd of [-1,1]){const pc=add(c,mul(A,sd*5.6)),p=pr(pc);push(p.d,()=>disc(add(pc,mul(A,sd*1.8)),3.6,axis,C.plateD,C.plateD)+disc(pc,3.6,axis,'#4A5576','#232A45'))}};
  const sphere=(c,r,col,dk)=>{const p=pr(c);push(p.d,()=>`<circle cx="${f2(p.x)}" cy="${f2(p.y)}" r="${f2(r*p.s)}" fill="${col}"/><circle cx="${f2(p.x-r*p.s*.3)}" cy="${f2(p.y-r*p.s*.3)}" r="${f2(r*p.s*.35)}" fill="#fff" opacity=".18"/>`)};
  const hands=[J.HL,J.HR],handMid=mid(J.HL,J.HR);
  const push0=push;
  for(const p of (spec.props||[])){
    const k=p.k;push=p.back?(d,f)=>push0(-1e4+d,f):push0;
    if(k==='plate'){const at=p.at||'H';let c;if(at==='H')c=handMid;else if(at==='S')c=mid(J.SL,J.SR);else if(at==='hip')c=mid(J.PL,J.PR);else c=w2(P[at]);
      if(p.off&&!front)c=add(c,[p.off[0],p.off[1],0]);const r=(p.r||10)*1.08;barbell(c,r,r<8?24:34)}
    else if(k==='barF'){barbell(handMid,11,34)}
    else if(k==='db'){const hs=p.one?[J.HL]:hands;for(const h of hs)dumbbell(h,front?'x':'z')}
    else if(k==='kb'){const c=p.at&&p.at!=='H'?w2(P[p.at]):(p.at==='H'||!p.at)?(J.front?J.HL:handMid):handMid;sphere(add(c,[0,6.5,0]),6,'#2E3554');rod(add(c,[0,0,-2.5]),add(c,[0,0,2.5]),.9,'#2E3554')}
    else if(k==='ball'){const c=p.at==='H'||!p.at?(front?J.HL:handMid):w2(P[p.at]);const o=p.off||[0,0];sphere(add(c,[o[0],o[1],0]),(p.r||7)*1.1,'#7A4A2A')}
    else if(k==='cable'){const fr=w2(p.from,0),hs=p.at==='H2'?[J.HR]:p.at==='A'?[J.AL]:front?[J.HL]:hands;
      const fp=pr(fr);push(fp.d-.1,()=>`<circle cx="${f2(fp.x)}" cy="${f2(fp.y)}" r="${f2(3.2*fp.s)}" fill="none" stroke="${C.equip}" stroke-width="1.6"/>`);
      for(const h of hs){const A=pr(fr),B=pr(h);push((A.d+B.d)/2-1,()=>`<path d="M${f2(A.x)} ${f2(A.y)}L${f2(B.x)} ${f2(B.y)}" stroke="${C.steel}" stroke-width="${f2(.7*(A.s+B.s)/2)}" opacity=".9"/>`)}
      // stos obciążenia pod bloczkiem
      const st=[fr[0]+(front?0:(fr[0]>100?6:-6)),G-14,front?fr[2]:0];if(!front)box(st,4,14,6,0,C.equip,C.equipD)}
    else if(k==='rect'){if(!p.w||!p.h)continue;
      const c=[p.x+p.w/2,p.y+p.h/2,0];
      if(front){box([100,c[1],-(c[0]-(P.hp[0]+P.hp2[0])/2)],11,p.h/2,p.w/2,0,C.equip,C.equipD)}
      else{const thin=p.w<=6||p.h<=6,big=p.w>=18&&p.h>=18,hz=big?15:thin&&p.h>p.w?4:12;box(c,p.w/2,p.h/2,hz,p.rot||0,C.equip,C.equipD)}}
    else if(k==='line'){const a=w2(p.a),b=w2(p.b);
      if(!front&&Math.abs(p.a[0]-p.b[0])>Math.abs(p.a[1]-p.b[1])){for(const z of [-13,13])rod([a[0],a[1],z],[b[0],b[1],z],1.4,C.steel)}
      else if(!front&&Math.abs(p.a[1]-p.b[1])>90){box(mid(a,b),1.5,Math.abs(p.a[1]-p.b[1])/2,26,0,C.equip,C.equipD)}
      else rod(a,b,(p.w||3)/2,C.equip)}
    else if(k==='bar'){const c=w2([p.x,p.y]);rod(add(c,[0,0,-32]),add(c,[0,0,32]),1.1,C.steel);for(const z of [-32,32])rod(add(c,[0,0,z]),[c[0],G,z],1.6,C.equip)}
    else if(k==='lever'){const fr=w2(p.from);rod(fr,handMid,1.3,C.steel)}
    else if(k==='jrope'){const y=(J.Hd[1]-14)*(1-P.k)+(G+2)*P.k,x=handMid[0]-6;
      const pts=[];for(let i=0;i<=16;i++){const tt=i/16,z=J.HL[2]*(1-tt)+J.HR[2]*tt,bend=Math.sin(tt*Math.PI);pts.push(pr([x*(bend)+J.HL[0]*(1-bend),J.HL[1]+(y-J.HL[1])*bend,z]))}
      push(0,()=>`<path d="M${pts.map(q=>f2(q.x)+' '+f2(q.y)).join('L')}" fill="none" stroke="${C.plate}" stroke-width="1"/>`)}
    else if(k==='roller'){rod(add(handMid,[0,0,-9]),add(handMid,[0,0,9]),1.2,C.equip);const y=handMid[1]+22-P.k*8;rod(handMid,[handMid[0],y,0],.35,C.steel);box([handMid[0],y+2.5,0],5,2.5,5,0,C.plate,C.plateD)}
    else if(k==='rope'){const fr=w2(p.from);for(const h of hands){const pts=[];for(let i=0;i<=14;i++){const tt=i/14,q=lerp(h,[fr[0],fr[1],h[2]*.4],tt);q[1]+=(p.wave||10)*Math.sin(tt*Math.PI*2-t/140)*Math.sin(tt*Math.PI);pts.push(pr(q))}
      push(pts[7].d,()=>`<path d="M${pts.map(q=>f2(q.x)+' '+f2(q.y)).join('L')}" fill="none" stroke="${C.plate}" stroke-width="1.6" stroke-linecap="round"/>`)}}
  }
}

/* ---------- kadr: dopasowanie widoku do ruchu ---------- */
function baseYaw(spec){return spec.v==='f'?62*R:30*R}
function frame(spec){
  // środek obrotu i prostokąt obejmujący ruch przy typowych kątach kamery
  let sx=0,n=0;for(const k of [0,.5,1]){const J=skeleton(spec,k);for(const key of ['SL','SR','PL','PR','KL','KR','HL','HR'])sx+=J[key][0],n++}
  const cx=sx/n,cy=100;let b=[1e9,1e9,-1e9,-1e9];const by=baseYaw(spec);
  for(const yaw of [by-40*R,by,by+40*R])for(const k of [0,.5,1]){
    const J=skeleton(spec,k),cam=camera(yaw,cx,cy,320);
    for(const key of ['SL','SR','EL','ER','HL','HR','PL','PR','KL','KR','AL','AR','TL','TR','Hd']){const p=cam.pr(J[key]);b=[Math.min(b[0],p.x),Math.min(b[1],p.y-(key==='Hd'?8:0)),Math.max(b[2],p.x),Math.max(b[3],p.y)]}
    const g=cam.pr([cx,G,0]);b[3]=Math.max(b[3],g.y);
  }
  return{cx,cy,box:b};
}
function viewBox(fr,aspect){ // aspect = szerokość / wysokość obszaru
  let [x0,y0,x1,y1]=fr.box;const pad=14;x0-=pad;x1+=pad;y0-=pad;y1+=pad+6;
  let w=x1-x0,h=y1-y0;if(w/h<aspect){const nw=h*aspect;x0-=(nw-w)/2;w=nw}else{const nh=w/aspect;y0-=(nh-h)/2;h=nh}
  return `${f1(x0)} ${f1(y0)} ${f1(w)} ${f1(h)}`;
}
// cykl ruchu z rozróżnieniem koncentryki (szybciej) i ekscentryki (wolniej); zwraca k (0=A,1=B), fazę i wysiłek
const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function cycle(ms,dir,hold){
  if(hold){const T=4400,x=ms%T,c=Math.floor(ms/T);const k=x<2200?ease(x/2200):1-ease((x-2200)/2200);return{k,c,phase:'hold',eff:.78+.06*Math.sin(ms/500)}}
  const con=1100,top=300,ecc=1600,bot=350,T=con+top+ecc+bot,c=Math.floor(ms/T),x=ms%T;
  let p,ph,eff;
  if(x<ecc){p=ease(x/ecc);ph='ecc';eff=.6}else if(x<ecc+bot){p=1;ph='bot';eff=.75}else if(x<ecc+bot+con){p=1-ease((x-ecc-bot)/con);ph='con';eff=1}else{p=0;ph='top';eff=.25}
  // p: 0 = pozycja startowa, 1 = koniec ekscentryki
  const k=dir==='AB'?1-p:p;
  return{k,c,phase:ph,eff};
}
window.EXERCISE_3D={scene,frame,viewBox,baseYaw,conc,cycle,HEAT};
})();
