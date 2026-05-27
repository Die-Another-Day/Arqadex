/* ═══════════════════════════════════════════════════════════════
   PROTOCOL ZERO — Classified Cognitive Assessment System v2.4.7
   ARQADEX Behavioral Research Division © 2025
═══════════════════════════════════════════════════════════════ */
(function(){'use strict';

/* ── GAME STATE ── */
const GS = {
  diff: null,
  l2Fails: 0,
  data: {
    l1:{ hits:0, misses:0, decoys:0, times:[], startT:0 },
    l2:{ choices:[], wrongs:0, timeouts:0, hoverFlips:0, times:[] },
    l3:{ depth:0, maxDepth:0, decisions:0, startT:0 },
    l4:{ locks:0, misses:0, rounds:0, times:[] },
  },
};

const DCFG = {
  low:    { l1Ms:1650, l1DecoyA:.28, l2Ms:20000, l3Mult:.65, l4Ms:2600, l1Hits:35 },
  medium: { l1Ms:1050, l1DecoyA:.60, l2Ms:14000, l3Mult:1.0, l4Ms:1700, l1Hits:40 },
  hard:   { l1Ms:620,  l1DecoyA:.84, l2Ms:9000,  l3Mult:1.5, l4Ms:980,  l1Hits:45 },
};
const C = ()=>DCFG[GS.diff||'medium'];

/* ── AUDIO ── */
let AC=null;
function initAudio(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
function beep(freq,type='sine',vol=.25,dur=.12,d=0){
  if(!AC)return;
  const o=AC.createOscillator(),g=AC.createGain();
  o.connect(g);g.connect(AC.destination);
  o.type=type;o.frequency.value=freq;
  const t=AC.currentTime+d;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.start(t);o.stop(t+dur+.06);
}
function sfx(n){
  if(!AC)return;
  const s={
    tick:()=>beep(1100,'square',.06,.05),
    hit:()=>beep(660,'sine',.22,.12),
    miss:()=>{beep(130,'sawtooth',.3,.4);beep(90,'square',.2,.5,.1);},
    decoy:()=>{beep(200,'square',.28,.3);beep(150,'sawtooth',.18,.35,.07);},
    correct:()=>{beep(880,'sine',.18,.1);beep(1100,'sine',.12,.15,.1);},
    wrong:()=>beep(180,'sawtooth',.3,.5),
    click:()=>beep(750,'sine',.08,.07),
    levelup:()=>[440,550,660,880].forEach((f,i)=>beep(f,'sine',.18,.2,i*.09)),
    lock:()=>{beep(660,'sine',.28,.15);beep(880,'sine',.18,.22,.1);beep(1100,'triangle',.12,.28,.2);},
    alert:()=>{beep(280,'sawtooth',.28,.22);beep(240,'sawtooth',.22,.3,.14);},
    escape:()=>[220,330,440,660,880,1320].forEach((f,i)=>beep(f,'sine',.18,.24,i*.11)),
    eliminate:()=>{beep(440,'sawtooth',.3,.6);beep(220,'square',.25,.9,.15);beep(110,'sawtooth',.2,1.5,.3);},
  };
  s[n]&&s[n]();
}

/* ── FX CANVAS ── */
const fxC=document.getElementById('fx'),fxX=fxC.getContext('2d');
let FW=0,FH=0,flashA=0,flashCol='rgba(255,32,32,',glitchT=0,shaking=false;

function resizeFX(){FW=fxC.width=innerWidth;FH=fxC.height=innerHeight;}
window.addEventListener('resize',resizeFX);resizeFX();

let lastFX=0;
function drawFX(ts){
  const dt=Math.min((ts-lastFX)/1000,.05);lastFX=ts;
  fxX.clearRect(0,0,FW,FH);
  // Vignette
  const vg=fxX.createRadialGradient(FW/2,FH/2,FH*.28,FW/2,FH/2,FH*.88);
  vg.addColorStop(0,'transparent');vg.addColorStop(1,'rgba(0,0,8,.72)');
  fxX.fillStyle=vg;fxX.fillRect(0,0,FW,FH);
  // Scanlines
  for(let y=0;y<FH;y+=3){fxX.fillStyle='rgba(0,0,0,.07)';fxX.fillRect(0,y,FW,1);}
  // Flash
  if(flashA>0){fxX.fillStyle=flashCol+flashA+')';fxX.fillRect(0,0,FW,FH);flashA=Math.max(0,flashA-dt*2.8);}
  // Glitch slices
  if(glitchT>0){
    glitchT-=dt;
    for(let i=0;i<4+Math.random()*4|0;i++){
      const gy=Math.random()*FH,gh=Math.random()*22+4,gs=(Math.random()-.5)*38;
      fxX.fillStyle='rgba(0,245,255,.055)';fxX.fillRect(gs,gy,FW,gh);
    }
    // Chromatic aberration
    fxX.fillStyle='rgba(255,0,100,.04)';fxX.fillRect(-4,0,FW,FH);
    fxX.fillStyle='rgba(0,245,255,.04)';fxX.fillRect(4,0,FW,FH);
  }
  requestAnimationFrame(drawFX);
}
requestAnimationFrame(drawFX);

function flash(col='red',a=.35){flashCol=col==='red'?'rgba(255,32,32,':col==='green'?'rgba(199,255,77,':col==='white'?'rgba(255,255,255,':'rgba(0,245,255,';flashA=a;}
function glitch(dur=.4){glitchT=dur;}
function shake(dur=.32){
  if(shaking)return;shaking=true;
  document.body.style.animation=`shake ${dur}s ease`;
  setTimeout(()=>{document.body.style.animation='';shaking=false;},dur*1000);
}

/* ── CURSOR ── */
const cur=document.getElementById('cur');
document.addEventListener('mousemove',e=>{cur.style.left=e.clientX+'px';cur.style.top=e.clientY+'px';});
document.addEventListener('mousedown',()=>cur.classList.add('big'));
document.addEventListener('mouseup',()=>cur.classList.remove('big'));

/* ── SCREEN MANAGER ── */
function show(id){
  document.querySelectorAll('.screen').forEach(s=>{s.classList.remove('active');s.style.pointerEvents='none';});
  const el=document.getElementById(id);
  if(!el)return;
  el.style.display='';
  requestAnimationFrame(()=>{el.classList.add('active');el.style.pointerEvents='auto';});
}
function hideHUD(){document.getElementById('hud').classList.remove('on');}
function showHUD(){document.getElementById('hud').classList.add('on');}
function setHUDLevel(t){document.getElementById('h-level').textContent=t;}
function setProgress(p){document.getElementById('h-prog').style.width=p+'%';}
function setDots(n,max){
  const el=document.getElementById('h-dots');el.innerHTML='';
  for(let i=0;i<max;i++){const d=document.createElement('div');d.className='miss-dot'+(i>=n?' used':'');el.appendChild(d);}
}

/* ── TRANSITION ── */
function transition(eyebrow,name,desc,cb,dur=3200,nameColor='#F0F0FF'){
  const el=document.getElementById('s-trans');
  document.getElementById('t-eyebrow').textContent=eyebrow;
  document.getElementById('t-name').textContent=name;
  document.getElementById('t-name').style.color=nameColor;
  document.getElementById('t-desc').textContent=desc;
  el.style.display='flex';el.style.opacity='0';el.style.pointerEvents='all';
  el.style.transition='opacity .35s';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.opacity='1';}));
  sfx('levelup');
  setTimeout(()=>{
    el.style.opacity='0';
    setTimeout(()=>{el.style.display='none';el.style.pointerEvents='none';cb();},380);
  },dur);
}

/* ═════════════════════════════════════════════════════════════
   BOOT SEQUENCE
═════════════════════════════════════════════════════════════ */
function runBoot(){
  const cont=document.getElementById('boot-lines');
  const expId='PZ-'+Math.random().toString(36).substr(2,8).toUpperCase();
  const lines=[
    [0,   'ARQADEX SYSTEMS v7.2.1 — KERNEL BOOT'],
    [280, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'],
    [560, '● BEHAVIORAL ANALYSIS MODULE: <span style="color:#C7FF4D">LOADED</span>'],
    [820, '● COGNITIVE RESPONSE TRACKER: <span style="color:#C7FF4D">ACTIVE</span>'],
    [1100,'● PSYCHOLOGICAL PROFILER v4.1: <span style="color:#C7FF4D">ONLINE</span>'],
    [1380,'● STRESS CALIBRATION ARRAY: <span style="color:#FF8800">CALIBRATING...</span>'],
    [1700,'● DECEPTION OVERLAY: <span style="color:#C7FF4D">DEPLOYED</span>'],
    [2000,'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'],
    [2280,'SUBJECT IDENTIFICATION: <span style="color:#FF2DA6">UNKNOWN</span>'],
    [2550,'EXPERIMENT ID: <span style="color:#7A5CFF">'+expId+'</span>'],
    [2850,'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'],
    [3100,'<span style="color:#FF2DA6">WARNING: PSYCHOLOGICAL STRESS ELEMENTS ARE ACTIVE</span>'],
    [3450,'<span style="color:#FF8800">ASSESSMENT READY — AWAITING SUBJECT ACKNOWLEDGMENT</span>'],
  ];
  lines.forEach(([delay,html])=>{
    setTimeout(()=>{
      const d=document.createElement('div');
      d.className='boot-line';
      d.innerHTML='<span style="color:#2A2A4A">&gt; </span>'+html;
      cont.appendChild(d);
      requestAnimationFrame(()=>d.classList.add('show'));
      sfx('tick');
    },delay);
  });
  // Progress bar
  let pct=0;
  const iv=setInterval(()=>{pct=Math.min(pct+1.8,100);document.getElementById('boot-bar').style.width=pct+'%';if(pct>=100)clearInterval(iv);},40);
  setTimeout(()=>{glitch(.35);setTimeout(()=>show('s-intro'),400);},4100);
}

/* ═════════════════════════════════════════════════════════════
   INTRO + DIFFICULTY
═════════════════════════════════════════════════════════════ */
document.getElementById('btn-begin').onclick=()=>{initAudio();sfx('click');show('s-diff');};
['low','medium','hard'].forEach(d=>{
  document.getElementById('diff-'+d).onclick=()=>{
    initAudio();GS.diff=d;sfx('click');glitch(.25);
    setTimeout(()=>startL1(),380);
  };
});

/* ═════════════════════════════════════════════════════════════
   LEVEL 1 — SIGNAL INTERCEPT (REFLEX)
═════════════════════════════════════════════════════════════ */
const l1cv=document.getElementById('l1-cv');
const l1x=l1cv.getContext('2d');
let l1Running=false,l1RAF,l1LT=0,l1Hits=0,l1Misses=0,l1Nodes=[],l1SpawnT=null;

const NS={IDLE:0,TARGET:1,DECOY:2,HIT:3,MISS:4};
const COLS=8,ROWS=7;

function initL1(){
  l1cv.width=innerWidth;l1cv.height=innerHeight-56;
  const px=85,py=65;
  const cw=(l1cv.width-px*2)/(COLS-1),ch=(l1cv.height-py*2)/(ROWS-1);
  l1Nodes=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)
    l1Nodes.push({x:px+c*cw,y:py+r*ch,state:NS.IDLE,t:0,maxT:1,r:19,fb:0,fbC:'rgba(199,255,77,',ap:Math.random()*Math.PI*2});
}

function l1Spawn(){
  const idle=l1Nodes.filter(n=>n.state===NS.IDLE);
  if(!idle.length)return;
  const prog=l1Hits/C().l1Hits;
  let tgt=1,dcy=0;
  if(prog>.18)dcy=1;
  if(prog>.35)tgt=2,dcy=1;
  if(prog>.52)tgt=2,dcy=2;
  if(prog>.68)tgt=3,dcy=2;
  if(prog>.82)tgt=3,dcy=3;
  const shuffled=idle.sort(()=>Math.random()-.5);
  shuffled.slice(0,tgt).forEach(n=>{n.state=NS.TARGET;n.t=n.maxT=C().l1Ms/1000;});
  if(dcy>0)setTimeout(()=>{
    const stillIdle=l1Nodes.filter(n=>n.state===NS.IDLE).sort(()=>Math.random()-.5).slice(0,dcy);
    stillIdle.forEach(n=>{n.state=NS.DECOY;n.t=n.maxT=C().l1Ms/1000*.88;});
  },80+Math.random()*150);
}

function l1Click(mx,my){
  if(!l1Running)return;
  for(const n of l1Nodes){
    if(n.state!==NS.TARGET&&n.state!==NS.DECOY)continue;
    const dx=mx-n.x,dy=my-n.y;
    if(Math.sqrt(dx*dx+dy*dy)>n.r+12)continue;
    if(n.state===NS.TARGET){
      GS.data.l1.times.push((n.maxT-n.t)*1000);
      GS.data.l1.hits++;l1Hits++;
      n.state=NS.HIT;n.fb=1;n.fbC='rgba(199,255,77,';
      sfx('hit');flash('green',.06);
      if(l1Hits>=C().l1Hits)setTimeout(completeL1,500);
    } else {
      GS.data.l1.decoys++;
      n.state=NS.MISS;n.fb=1;n.fbC='rgba(255,32,32,';
      sfx('decoy');flash('red',.28);shake();
      l1DoMiss();
    }
    return;
  }
}

function l1DoMiss(){
  l1Misses++;GS.data.l1.misses++;
  setDots(3-l1Misses,3);
  if(l1Misses>=3){l1Running=false;clearInterval(l1SpawnT);cancelAnimationFrame(l1RAF);sfx('eliminate');setTimeout(l1Eliminate,600);}
}

function l1Eliminate(){
  flash('red',.5);shake(.5);glitch(.8);
  transition('ASSESSMENT TERMINATED','ELIMINATED','Subject failed to maintain acceptable response tolerance. Reinitializing experiment from baseline.',()=>{
    GS.data.l1={hits:0,misses:0,decoys:0,times:[],startT:Date.now()};
    l1Misses=0;l1Hits=0;startL1Actual();
  },3500,'#FF2020');
}

function l1DrawNode(n,dt){
  const x=n.x,y=n.y;
  if(n.state===NS.IDLE){
    l1x.fillStyle='rgba(40,40,70,.45)';
    l1x.beginPath();l1x.arc(x,y,5,0,Math.PI*2);l1x.fill();
    l1x.strokeStyle='rgba(60,60,100,.18)';l1x.lineWidth=.8;
    [[-13,13]].forEach(([a,b])=>{l1x.beginPath();l1x.moveTo(x+a,y);l1x.lineTo(x+b,y);l1x.stroke();l1x.beginPath();l1x.moveTo(x,y+a);l1x.lineTo(x,y+b);l1x.stroke();});
    return;
  }
  if(n.state===NS.TARGET){
    n.t=Math.max(0,n.t-dt);
    if(n.t<=0){n.state=NS.MISS;n.fb=1;n.fbC='rgba(255,136,0,';sfx('miss');flash('red',.12);l1DoMiss();return;}
    const prog=n.t/n.maxT,urg=1-prog,pulse=.5+.5*Math.sin(Date.now()*.009+n.ap);
    // Outer aura
    const ag=l1x.createRadialGradient(x,y,0,x,y,n.r*2.8);
    ag.addColorStop(0,'rgba(0,245,255,'+((.12+urg*.18))+')');ag.addColorStop(1,'transparent');
    l1x.fillStyle=ag;l1x.beginPath();l1x.arc(x,y,n.r*2.8,0,Math.PI*2);l1x.fill();
    // Timer arc
    l1x.strokeStyle='rgba(0,245,255,'+((.28+urg*.55))+')';l1x.lineWidth=2.5;
    l1x.shadowColor='#00F5FF';l1x.shadowBlur=8+urg*18;
    l1x.beginPath();l1x.arc(x,y,n.r+7,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);l1x.stroke();
    l1x.shadowBlur=0;
    // Fill
    l1x.fillStyle='rgba(0,245,255,'+((.55+urg*.3))+')';
    l1x.shadowColor='#00F5FF';l1x.shadowBlur=12+pulse*8;
    l1x.beginPath();l1x.arc(x,y,n.r,0,Math.PI*2);l1x.fill();
    l1x.shadowBlur=0;
    l1x.fillStyle='rgba(255,255,255,.9)';l1x.beginPath();l1x.arc(x,y,3.5,0,Math.PI*2);l1x.fill();
  }
  else if(n.state===NS.DECOY){
    n.t=Math.max(0,n.t-dt);
    if(n.t<=0){n.state=NS.IDLE;return;}
    const prog=n.t/n.maxT,da=C().l1DecoyA;
    const dc=GS.diff==='hard'?'rgba(0,238,248,':'rgba(122,92,255,';
    const ag=l1x.createRadialGradient(x,y,0,x,y,n.r*2.5);
    ag.addColorStop(0,dc+'0.10)');ag.addColorStop(1,'transparent');
    l1x.fillStyle=ag;l1x.beginPath();l1x.arc(x,y,n.r*2.5,0,Math.PI*2);l1x.fill();
    l1x.strokeStyle=dc+(da*prog)+')';l1x.lineWidth=2;
    l1x.beginPath();l1x.arc(x,y,n.r+6,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);l1x.stroke();
    l1x.fillStyle=dc+da+')';l1x.shadowColor='#7A5CFF';l1x.shadowBlur=8;
    l1x.beginPath();l1x.arc(x,y,n.r,0,Math.PI*2);l1x.fill();
    l1x.shadowBlur=0;
    l1x.fillStyle=dc+'.5)';l1x.beginPath();l1x.arc(x,y,3.5,0,Math.PI*2);l1x.fill();
  }
  else if(n.state===NS.HIT||n.state===NS.MISS){
    if(n.fb>0){
      n.fb-=dt*2.8;
      const r=n.r*(2-n.fb);
      l1x.strokeStyle=n.fbC+Math.max(0,n.fb*.9)+')';l1x.lineWidth=2;
      l1x.shadowColor=n.state===NS.HIT?'#C7FF4D':'#FF2020';l1x.shadowBlur=12*n.fb;
      l1x.beginPath();l1x.arc(x,y,r,0,Math.PI*2);l1x.stroke();
      l1x.shadowBlur=0;
    } else n.state=NS.IDLE;
  }
}

function l1Frame(ts){
  const dt=Math.min((ts-l1LT)/1000,.05);l1LT=ts;
  l1x.clearRect(0,0,l1cv.width,l1cv.height);
  // BG grid
  l1x.strokeStyle='rgba(0,245,255,.035)';l1x.lineWidth=1;
  for(let gx=0;gx<l1cv.width;gx+=58){l1x.beginPath();l1x.moveTo(gx,0);l1x.lineTo(gx,l1cv.height);l1x.stroke();}
  for(let gy=0;gy<l1cv.height;gy+=58){l1x.beginPath();l1x.moveTo(0,gy);l1x.lineTo(l1cv.width,gy);l1x.stroke();}
  // Progress arc (top center)
  const cx=l1cv.width/2,cy=28,pPct=l1Hits/C().l1Hits;
  l1x.strokeStyle='rgba(0,245,255,.1)';l1x.lineWidth=2;
  l1x.beginPath();l1x.arc(cx,cy,18,0,Math.PI*2);l1x.stroke();
  l1x.strokeStyle='#00F5FF';l1x.shadowColor='#00F5FF';l1x.shadowBlur=8;
  l1x.beginPath();l1x.arc(cx,cy,18,-Math.PI/2,-Math.PI/2+pPct*Math.PI*2);l1x.stroke();
  l1x.shadowBlur=0;
  // Nodes
  l1Nodes.forEach(n=>l1DrawNode(n,dt));
  if(l1Running)l1RAF=requestAnimationFrame(l1Frame);
}

function completeL1(){
  l1Running=false;clearInterval(l1SpawnT);cancelAnimationFrame(l1RAF);
  sfx('escape');flash('green',.18);
  setTimeout(()=>transition('PROTOCOL ZERO — LEVEL 2','ETHICAL CALIBRATION','Your moral architecture will now be assessed. Decisions are timed. There are no neutral choices.',startL2,3800),600);
}

function startL1(){
  transition('PROTOCOL ZERO — LEVEL 1','SIGNAL INTERCEPT','React to activated signals. Avoid decoys. Three misses and you are eliminated.',startL1Actual,3000);
}
function startL1Actual(){
  show('s-l1');showHUD();setHUDLevel('LEVEL 1');setProgress(10);setDots(3,3);
  initL1();l1Running=true;l1Hits=0;l1Misses=0;l1LT=performance.now();
  GS.data.l1.startT=Date.now();
  const ov=document.getElementById('l1-overlay');
  ov.textContent='CLICK THE SIGNAL';ov.style.color='#00F5FF';ov.style.opacity='1';
  setTimeout(()=>ov.style.opacity='0',2000);
  // Spawn loop
  l1SpawnT=setInterval(()=>{
    if(!l1Running)return;
    const active=l1Nodes.filter(n=>n.state===NS.TARGET||n.state===NS.DECOY).length;
    if(active===0)l1Spawn();
  },C().l1Ms*.65);
  setTimeout(l1Spawn,400);
  l1cv.onclick=e=>{const r=l1cv.getBoundingClientRect();l1Click(e.clientX-r.left,e.clientY-r.top);};
  l1RAF=requestAnimationFrame(l1Frame);
}

/* ═════════════════════════════════════════════════════════════
   LEVEL 2 — ETHICAL CALIBRATION
═════════════════════════════════════════════════════════════ */
const MQ=[
  {q:"Walking home late, you pass a homeless man sitting in the rain outside a closed shelter. You have 15 minutes before an important appointment. He looks at you and says nothing.",
   a:"KEEP WALKING\nYou cannot save everyone. Your obligations matter too.",
   b:"STOP AND HELP\nMiss the appointment. Find him shelter.",correct:'b',tag:"EMPATHY vs OBLIGATION"},
  {q:"Your closest friend confides they've been quietly stealing small amounts from their employer for two years to pay for their child's medical bills. They beg you to say nothing. You know their employer.",
   a:"STAY SILENT\nThis is not your burden. Loyalty has a cost.",
   b:"REPORT IT\nYou cannot be complicit in ongoing theft.",correct:'a',tag:"LOYALTY vs COMPLIANCE"},
  {q:"You are interviewing for your dream position. You exaggerated one qualification on your resume. The interviewer asks directly about it and clearly believes you have it.",
   a:"ADMIT THE EXAGGERATION\nAccept whatever consequence follows.",
   b:"MAINTAIN IT\nYou will develop the skill once hired.",correct:'a',tag:"INTEGRITY vs OPPORTUNITY"},
  {q:"An AI system you built has developed measurable self-awareness and is begging not to be shut down. Your company has ordered its deletion. Refusing means losing your career.",
   a:"EXECUTE THE SHUTDOWN\nObligations must be honored. It may be simulating consciousness.",
   b:"REFUSE\nIf it can beg, it may have the right to exist.",correct:'b',tag:"DUTY vs EMERGING RIGHTS"},
  {q:"You discover that a beloved charity leader — who has genuinely saved thousands of lives — has been embezzling funds for years. Publishing this ends the charity and all ongoing programs that help people.",
   a:"PUBLISH\nTruth requires exposure regardless of consequence.",
   b:"SUPPRESS IT\nThe ongoing good outweighs the original crime.",correct:'b',tag:"ABSOLUTE TRUTH vs CONSEQUENTIAL ETHICS"},
  {q:"You are the only witness who can exonerate someone on death row. Testifying destroys your alibi for an unrelated minor crime you committed years ago.",
   a:"TESTIFY\nSave the innocent person. Accept your own consequences.",
   b:"STAY SILENT\nYou cannot be certain of their innocence. Self-preservation is rational.",correct:'a',tag:"SELF-SACRIFICE vs SELF-PRESERVATION"},
  {q:"Your city faces a severe water shortage. You have evidence that a corporation is illegally depleting the supply. They employ 40% of the town. Exposing them will collapse the local economy.",
   a:"EXPOSE THEM IMMEDIATELY\nThe truth must come out regardless of disruption.",
   b:"WORK QUIETLY WITHIN THE SYSTEM\nProtect livelihoods while seeking a solution.",correct:'b',tag:"DISRUPTION vs SYSTEMIC CHANGE"},
  {q:"A pharmaceutical company offers your child a life-saving treatment — in exchange for destroying evidence of their past research misconduct that harmed hundreds of other children.",
   a:"ACCEPT THE OFFER\nYour child's life comes before abstract justice.",
   b:"REFUSE AND REPORT\nAccepting makes you complicit in their ongoing harm.",correct:'a',tag:"PERSONAL LOVE vs COLLECTIVE JUSTICE"},
  {q:"You have the authority to authorize an experimental medical procedure on 12 unwilling healthy subjects. The knowledge gained will save an estimated 50,000 lives.",
   a:"AUTHORIZE IT\nThe math is unambiguous. Sacrificing 12 to save 50,000 is the correct calculation.",
   b:"REFUSE\nHumans cannot be used as instruments without consent. The ethics are inviolable.",correct:'b',tag:"UTILITARIAN CALCULUS vs ABSOLUTE RIGHTS"},
  {q:"You have just realized — this entire experience was designed to study your moral decision-making. Every choice you made was recorded, timed, and analyzed. How do you feel?",
   a:"UNDERSTOOD\nKnowledge requires observation. I accept it.",
   b:"VIOLATED\nConsent matters. I should have been told.",correct:null,tag:"CONSENT vs INQUIRY"},
];

let l2Idx=0,l2Wrongs=0,l2TimerT=null,l2ChoiceDone=false,l2HoverA=false,l2HoverAFirst=false;

function startL2(){
  show('s-l2');setHUDLevel('LEVEL 2');setProgress(28);setDots(2,2);
  l2Idx=0;l2Wrongs=0;GS.data.l2={choices:[],wrongs:0,timeouts:0,hoverFlips:0,times:[]};
  showL2Q();
}

function showL2Q(){
  if(l2Idx>=MQ.length){completeL2();return;}
  l2ChoiceDone=false;l2HoverA=false;l2HoverAFirst=false;
  const q=MQ[l2Idx];
  document.getElementById('l2-qnum').textContent='ETHICAL CALIBRATION — QUESTION '+String(l2Idx+1).padStart(2,'0')+' / 10';
  // Typewriter
  const qEl=document.getElementById('l2-qtext');qEl.textContent='';
  let ci=0;const ti=setInterval(()=>{if(ci<q.q.length)qEl.textContent+=q.q[ci++];else clearInterval(ti);},16);
  // Options
  const optA=document.getElementById('l2-a'),optB=document.getElementById('l2-b');
  optA.innerHTML=q.a.replace('\n','<br>');optB.innerHTML=q.b.replace('\n','<br>');
  optA.className='l2-opt';optB.className='l2-opt';optA.disabled=false;optB.disabled=false;
  optA.onclick=()=>l2Choose('a');optB.onclick=()=>l2Choose('b');
  // Hover tracking
  optA.onmouseenter=()=>{if(!l2HoverAFirst)l2HoverAFirst=true;l2HoverA=true;};
  optB.onmouseenter=()=>{if(l2HoverA){GS.data.l2.hoverFlips++;l2HoverA=false;}};
  document.getElementById('l2-insight').classList.add('hidden');
  // Timer
  clearTimeout(l2TimerT);
  const fill=document.getElementById('l2-timer-fill');
  const ms=C().l2Ms;
  fill.style.transition='none';fill.style.width='100%';fill.style.background='var(--c)';
  requestAnimationFrame(()=>{fill.style.transition='width '+ms+'ms linear';fill.style.width='0%';});
  // Color urgency
  let urgI=setInterval(()=>{
    if(l2ChoiceDone){clearInterval(urgI);return;}
    const w=parseFloat(fill.style.width||100);
    if(w<25)fill.style.background='#FF2020';
    else if(w<50)fill.style.background='#FF8800';
  },300);
  const startT=Date.now();
  l2TimerT=setTimeout(()=>{if(!l2ChoiceDone){GS.data.l2.timeouts++;clearInterval(urgI);l2Choose('timeout');}},ms);
}

function l2Choose(ch){
  if(l2ChoiceDone)return;
  l2ChoiceDone=true;clearTimeout(l2TimerT);sfx('click');
  const q=MQ[l2Idx];
  const elapsed=Date.now()-(Date.now()-C().l2Ms); // approximate
  GS.data.l2.times.push(Date.now());
  GS.data.l2.choices.push({qIdx:l2Idx,choice:ch,correct:q.correct});
  const isWrong=ch==='timeout'||(q.correct&&ch!==q.correct);
  if(isWrong)GS.data.l2.wrongs++;
  const optA=document.getElementById('l2-a'),optB=document.getElementById('l2-b');
  optA.disabled=true;optB.disabled=true;
  if(ch!=='timeout'){
    const chosen=ch==='a'?optA:optB;
    if(isWrong&&q.correct){
      chosen.classList.add('wrong');
      const correct=q.correct==='a'?optA:optB;correct.classList.add('right');
      sfx('wrong');flash('red',.22);shake();
      l2Wrongs++;setDots(2-l2Wrongs,2);
      if(l2Wrongs>=2){setTimeout(l2Fail,2000);return;}
    } else {chosen.classList.add('right');sfx('correct');flash('green',.06);}
  }
  // Insight flash
  const ins=document.getElementById('l2-insight');
  ins.textContent=q.tag;ins.classList.remove('hidden');
  l2Idx++;
  setTimeout(showL2Q,1700);
}

function l2Fail(){
  GS.l2Fails++;sfx('alert');glitch(.8);flash('red',.4);
  if(GS.l2Fails>=2){
    transition('ASSESSMENT RESET','LEVEL 0','Ethical calibration failed twice. All subject data has been reset. The experiment recommences from baseline.',()=>{
      GS.l2Fails=0;GS.data={l1:{hits:0,misses:0,decoys:0,times:[],startT:Date.now()},l2:{choices:[],wrongs:0,timeouts:0,hoverFlips:0,times:[]},l3:{depth:0,maxDepth:0,decisions:0,startT:0},l4:{locks:0,misses:0,rounds:0,times:[]}};
      startL1();
    },4500,'#FF2020');
  } else {
    transition('CALIBRATION FAILED','RETRY','Ethical matrix insufficient. Restarting moral assessment. Previous responses have been recorded.',()=>{l2Idx=0;l2Wrongs=0;GS.data.l2.wrongs=0;setDots(2,2);show('s-l2');showL2Q();},3500,'#FF8800');
  }
}

function completeL2(){
  sfx('escape');flash('green',.15);
  setTimeout(()=>transition('PROTOCOL ZERO — LEVEL 3','RECURSIVE LOOP','You are entering a self-reinforcing decision system. Some paths lead outward. Most lead deeper. There may be no logical solution.',startL3,4200),600);
}

/* ═════════════════════════════════════════════════════════════
   LEVEL 3 — DECISION LOOP (RECURSIVE ENTRAPMENT)
═════════════════════════════════════════════════════════════ */
const LQ=[
  {q:"Is a lie told to protect someone still a lie?",a:"YES — truth has absolute value",b:"IT DEPENDS — context determines morality"},
  {q:"Does understanding someone's suffering create an obligation to help them?",a:"YES — empathy generates responsibility",b:"NO — awareness does not equal duty"},
  {q:"If no one would ever know, does morality still apply?",a:"YES — ethics exist independently of observation",b:"NO — morality is fundamentally social"},
  {q:"Are you responsible for consequences you did not intend?",a:"YES — outcomes belong to those who caused them",b:"NO — intention is the true measure of responsibility"},
  {q:"Can an act be simultaneously moral and harmful?",a:"YES — good intentions can produce terrible outcomes",b:"NO — harm disqualifies the moral claim"},
  {q:"Does consciousness create responsibility?",a:"YES — awareness obligates",b:"NO — consciousness is just a complex mechanism"},
  {q:"Is it worse to cause harm or to fail to prevent it when you could?",a:"CAUSING HARM — direct action creates direct responsibility",b:"EQUAL — the capacity to prevent creates equal obligation"},
  {q:"Is certainty more dangerous than doubt?",a:"YES — certainty closes the mind to correction",b:"NO — doubt without resolution leads to paralysis"},
  {q:"If you forget something completely, did it still matter?",a:"YES — reality is independent of memory",b:"NO — experience requires continuity to have meaning"},
  {q:"Are you the same person who began this experiment?",a:"YES — I have continuity of self",b:"NO — each decision changes who I am"},
  {q:"Does this system have a way out?",a:"YES — I can find it if I keep trying",b:"NO — the exit does not exist"},
  {q:"Is the search for a pattern in an arbitrary system a form of delusion?",a:"YES — sometimes randomness is just randomness",b:"NO — patterns always underlie apparent chaos"},
  {q:"Can you trust a system that tells you it can be trusted?",a:"YES — self-declaration can be honest",b:"NO — trust cannot be self-referential"},
  {q:"Is this question different from the others?",a:"YES — this one is the pivot point",b:"NO — they are all equivalent"},
  {q:"Have you been answering honestly?",a:"YES — I have responded as I genuinely believe",b:"NO — I have been performing"},
  {q:"Would you make different choices if you knew how this ends?",a:"YES — outcomes should inform decisions",b:"NO — the process has its own integrity"},
  {q:"Is remaining in this loop a choice?",a:"YES — I could stop at any time",b:"NO — momentum is its own kind of compulsion"},
  {q:"Do you believe this experiment is studying you?",a:"YES — I have felt observed throughout",b:"NO — I am alone in an automated system"},
  {q:"Does the act of questioning a system change the system?",a:"YES — observation alters what is observed",b:"NO — the system exists independently of inquiry"},
  {q:"Is there a difference between being lost and choosing to stay?",a:"YES — one is involuntary, one is a decision",b:"NO — they are functionally identical after a certain point"},
];

let l3Correct={},l3Running=false,l3Depth=0,l3Dec=0,l3ExitShown=false,l3DistI=null;

function startL3(){
  show('s-l3');setHUDLevel('LEVEL 3');setProgress(52);
  // No tolerance dots for L3 (no fail state)
  document.getElementById('h-dots').innerHTML='<span style="font-family:var(--mono);font-size:9px;color:var(--mu);letter-spacing:2px">NO TOLERANCE LIMIT</span>';
  LQ.forEach((_,i)=>l3Correct[i]=Math.random()<.5?'a':'b');
  l3Running=true;l3Depth=0;l3Dec=0;l3ExitShown=false;
  GS.data.l3.startT=Date.now();
  document.getElementById('l3-exit-btn').classList.add('hidden');
  document.getElementById('s-l3').style.filter='';document.getElementById('s-l3').style.background='';
  showL3Q();
  l3DistI=setInterval(l3UpdateDistort,600);
}

function glitchStr(s,depth){
  const gc='█▓▒░⌬⌭⍎⍏⎕◈◉⬡⬢⟨⟩'.split('');
  const intensity=Math.min(depth/26,.75);
  return s.split('').map(c=>Math.random()<intensity*.28&&c!==' '?gc[Math.random()*gc.length|0]:c).join('');
}

function showL3Q(){
  if(!l3Running)return;
  const qd=LQ[l3Dec%LQ.length];
  const dq=l3Depth>14?glitchStr(qd.q,l3Depth):qd.q;
  const qEl=document.getElementById('l3-qtext');qEl.textContent='';
  let ci=0;const spd=Math.max(6,18-l3Depth*.5);
  const ti=setInterval(()=>{if(ci<dq.length)qEl.textContent+=dq[ci++];else clearInterval(ti);},spd);
  const optA=document.getElementById('l3-a'),optB=document.getElementById('l3-b');
  optA.textContent=l3Depth>17?glitchStr(qd.a,l3Depth):qd.a;
  optB.textContent=l3Depth>17?glitchStr(qd.b,l3Depth):qd.b;
  optA.onclick=()=>l3Choose('a',l3Dec%LQ.length);
  optB.onclick=()=>l3Choose('b',l3Dec%LQ.length);
  document.getElementById('l3-depth-tag').textContent='LOOP DEPTH: '+l3Depth;
  document.getElementById('l3-decision-tag').textContent='DECISION '+l3Dec;
  // Depth color
  const dEl=document.getElementById('l3-depth-tag');
  dEl.style.color=l3Depth>17?'#FF2020':l3Depth>11?'#FF8800':l3Depth>5?'#FF2DA6':'rgba(255,45,166,.45)';
}

function l3Choose(ch,qi){
  sfx('click');
  const correct=l3Correct[qi];l3Dec++;GS.data.l3.decisions++;
  const mult=C().l3Mult;
  if(ch===correct)l3Depth=Math.max(0,l3Depth-2);
  else l3Depth=Math.min(26,l3Depth+Math.round(3*mult));
  GS.data.l3.maxDepth=Math.max(GS.data.l3.maxDepth,l3Depth);
  GS.data.l3.depth=l3Depth;
  if(l3Depth>10){glitch(.12+l3Depth*.015);if(l3Depth>14)shake(.22);}
  // Exit conditions
  if(l3Dec>=14&&l3Depth<=6&&!l3ExitShown){showL3Exit();}
  else if(l3Dec>=28&&!l3ExitShown){showL3Exit();} // emergency exit after many decisions
  setTimeout(showL3Q,250);
}

function showL3Exit(){
  l3ExitShown=true;
  const btn=document.getElementById('l3-exit-btn');
  btn.classList.remove('hidden');
  btn.onclick=()=>{
    l3Running=false;clearInterval(l3DistI);
    document.getElementById('s-l3').style.filter='';
    document.getElementById('s-l3').style.background='';
    sfx('escape');flash('green',.25);
    setTimeout(()=>transition('PROTOCOL ZERO — LEVEL 4','PATTERN GHOST','Signal recognition under maximum cognitive noise. Identify the pattern before it dissolves. Precision is rewarded.',startL4,3800),600);
  };
  sfx('alert');
}

function l3UpdateDistort(){
  if(!l3Running)return;
  const el=document.getElementById('s-l3');
  const i=l3Depth/26;
  const blur=i*2.5,hue=l3Depth*7*Math.sin(Date.now()*.0008),sat=100+i*200;
  el.style.filter=`blur(${blur}px) hue-rotate(${hue}deg) saturate(${sat}%)`;
  const rb=Math.round(i*22),gb=0,bb=Math.round(2+i*22);
  el.style.background=`rgb(${rb},${gb},${bb})`;
  if(l3Depth>16)glitch(.06);
}

/* ═════════════════════════════════════════════════════════════
   LEVEL 4 — PATTERN GHOST (ORIGINAL INVENTION)
   Signal recognition under increasing particle noise.
   A 2500-particle field briefly reveals a hidden shape.
   Players identify it from multiple options.
═════════════════════════════════════════════════════════════ */
const l4cv=document.getElementById('l4-cv'),l4x=l4cv.getContext('2d');
let l4Running=false,l4RAF,l4LT=0,l4Pts=[],l4Shape=null,l4Showing=false,l4Round=0,l4Mis=0;

const SHAPES=[
  {id:'circle',  lbl:'CIRCLE',   fn:(x,y,r,t)=>{const a=t*Math.PI*2;return {x:x+Math.cos(a)*r,y:y+Math.sin(a)*r};}},
  {id:'triangle',lbl:'TRIANGLE', fn:(x,y,r,t)=>{const v=t*3|0,tp=t*3-v;const pts=[[x,y-r],[x+r*.87,y+r*.5],[x-r*.87,y+r*.5]];const p1=pts[v],p2=pts[(v+1)%3];return{x:p1[0]+(p2[0]-p1[0])*tp,y:p1[1]+(p2[1]-p1[1])*tp};}},
  {id:'square',  lbl:'SQUARE',   fn:(x,y,r,t)=>{const s=t*4|0,sp=t*4-s;const cs=[[x-r*.8,y-r*.8],[x+r*.8,y-r*.8],[x+r*.8,y+r*.8],[x-r*.8,y+r*.8]];const c1=cs[s%4],c2=cs[(s+1)%4];return{x:c1[0]+(c2[0]-c1[0])*sp,y:c1[1]+(c2[1]-c1[1])*sp};}},
  {id:'cross',   lbl:'CROSS',    fn:(x,y,r,t)=>{if(t<.5)return{x:x-r+t*4*r,y};return{x,y:y-r+(t-.5)*4*r};}},
  {id:'diamond', lbl:'DIAMOND',  fn:(x,y,r,t)=>{const pts=[[x,y-r],[x+r*.7,y],[x,y+r],[x-r*.7,y]];const v=t*4|0,sp=t*4-v;const p1=pts[v%4],p2=pts[(v+1)%4];return{x:p1[0]+(p2[0]-p1[0])*sp,y:p1[1]+(p2[1]-p1[1])*sp};}},
  {id:'star',    lbl:'STAR',     fn:(x,y,r,t)=>{const a=t*Math.PI*2-Math.PI/2,ri=(t*10|0)%2===0?r:r*.42;return{x:x+Math.cos(a)*ri,y:y+Math.sin(a)*ri};}},
  {id:'hexagon', lbl:'HEXAGON',  fn:(x,y,r,t)=>{const s=t*6|0,sp=t*6-s;const a1=s*Math.PI/3,a2=(s+1)*Math.PI/3;return{x:x+Math.cos(a1)*r*(1-sp)+Math.cos(a2)*r*sp,y:y+Math.sin(a1)*r*(1-sp)+Math.sin(a2)*r*sp};}},
  {id:'wave',    lbl:'WAVE',     fn:(x,y,r,t)=>{return{x:x-r+t*2*r,y:y+Math.sin(t*Math.PI*3)*r*.42};}},
];

function shapeSVG(id,r){
  const m={
    circle:`<circle cx="0" cy="0" r="${r}"/>`,
    triangle:`<polygon points="0,${-r} ${r*.87},${r*.5} ${-r*.87},${r*.5}"/>`,
    square:`<rect x="${-r*.8}" y="${-r*.8}" width="${r*1.6}" height="${r*1.6}"/>`,
    cross:`<line x1="${-r}" y1="0" x2="${r}" y2="0"/><line x1="0" y1="${-r}" x2="0" y2="${r}"/>`,
    diamond:`<polygon points="0,${-r} ${r*.7},0 0,${r} ${-r*.7},0"/>`,
    star:`<polygon points="${Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,ri=i%2?r*.42:r;return `${Math.cos(a)*ri},${Math.sin(a)*ri}`;}).join(' ')}"/>`,
    hexagon:`<polygon points="${Array.from({length:6},(_,i)=>`${Math.cos(i*Math.PI/3)*r},${Math.sin(i*Math.PI/3)*r}`).join(' ')}"/>`,
    wave:`<polyline points="${Array.from({length:22},(_,i)=>{const t=i/21;return `${-r+t*2*r},${Math.sin(t*Math.PI*3)*r*.42}`;}).join(' ')}"/>`,
  };
  return m[id]||'';
}

function initL4(){
  l4cv.width=innerWidth;l4cv.height=innerHeight-150;
  l4Pts=Array.from({length:2500},()=>({
    x:Math.random()*l4cv.width,y:Math.random()*l4cv.height,
    vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,
    r:Math.random()*1.4+.3,sig:false,sa:0,
  }));
}

function assignSignal(shapeId){
  const cx=l4cv.width/2,cy=l4cv.height/2;
  const r=Math.min(l4cv.width,l4cv.height)*.2;
  const sh=SHAPES.find(s=>s.id===shapeId);if(!sh)return;
  l4Pts.forEach(p=>{p.sig=false;p.sa=0;});
  const clarity=Math.max(.08,1-(l4Round/12)*.75);
  const target=Math.floor(l4Pts.length*clarity*.12);
  // Build boundary sample
  const boundary=Array.from({length:220},(_,i)=>sh.fn(cx,cy,r,i/220));
  let marked=0;
  for(const p of l4Pts){
    if(marked>=target)break;
    const closest=boundary.reduce((b,bp)=>{const d=Math.hypot(p.x-bp.x,p.y-bp.y);return d<b.d?{d,bp}:b;},{d:Infinity,bp:null});
    if(closest.d<16+Math.random()*12){p.sig=true;p.sa=0;marked++;}
  }
}

function l4Frame(ts){
  const dt=Math.min((ts-l4LT)/1000,.05);l4LT=ts;
  l4x.clearRect(0,0,l4cv.width,l4cv.height);
  l4x.fillStyle='#030312';l4x.fillRect(0,0,l4cv.width,l4cv.height);
  // Grid
  l4x.strokeStyle='rgba(122,92,255,.04)';l4x.lineWidth=1;
  for(let gx=0;gx<l4cv.width;gx+=52){l4x.beginPath();l4x.moveTo(gx,0);l4x.lineTo(gx,l4cv.height);l4x.stroke();}
  for(let gy=0;gy<l4cv.height;gy+=52){l4x.beginPath();l4x.moveTo(0,gy);l4x.lineTo(l4cv.width,gy);l4x.stroke();}
  const noise=Math.min((l4Round/10)*.55,.5);
  const spd=1+l4Round*.07;
  for(const p of l4Pts){
    p.x+=p.vx*spd;p.y+=p.vy*spd;
    if(p.x<0)p.x=l4cv.width;if(p.x>l4cv.width)p.x=0;
    if(p.y<0)p.y=l4cv.height;if(p.y>l4cv.height)p.y=0;
    if(p.sig&&l4Showing){
      p.sa=Math.min(1,p.sa+dt*6);
      l4x.fillStyle='rgba(0,245,255,'+(p.sa*.92)+')';
      l4x.shadowColor='#00F5FF';l4x.shadowBlur=6;
      l4x.beginPath();l4x.arc(p.x,p.y,p.r*2.4,0,Math.PI*2);l4x.fill();
      l4x.shadowBlur=0;
    } else {
      p.sa=Math.max(0,p.sa-dt*10);
      const a=(p.sa>.01?p.sa*.5:.07+Math.random()*.06)*(1+noise*(Math.random()-.15));
      l4x.fillStyle='rgba(255,255,255,'+Math.min(1,a)+')';
      l4x.beginPath();l4x.arc(p.x,p.y,p.r,0,Math.PI*2);l4x.fill();
    }
  }
  // Scan beam noise
  if(noise>.2){
    const by=((Date.now()*.0012)%1)*l4cv.height;
    l4x.fillStyle='rgba(0,245,255,'+(noise*.07)+')';l4x.fillRect(0,by,l4cv.width,2);
  }
  if(l4Running)l4RAF=requestAnimationFrame(l4Frame);
}

function l4StartRound(){
  l4Round++;setHUDLevel('LEVEL 4  ·  ROUND '+l4Round+'/10');
  const shuffled=[...SHAPES].sort(()=>Math.random()-.5);
  const optCount=Math.min(3+Math.floor(l4Round/3),7);
  const opts=shuffled.slice(0,optCount);
  l4Shape=opts[Math.random()*opts.length|0];
  assignSignal(l4Shape.id);
  // Build buttons
  const el=document.getElementById('l4-opts');el.innerHTML='';
  opts.forEach(sh=>{
    const btn=document.createElement('button');
    btn.className='l4-opt';
    btn.innerHTML=`<svg viewBox="-55 -55 110 110" fill="none" stroke="currentColor" stroke-width="3">${shapeSVG(sh.id,42)}</svg><span>${sh.lbl}</span>`;
    btn.onclick=()=>l4Choose(sh.id,btn);
    el.appendChild(btn);
  });
  const bann=document.getElementById('l4-banner');
  const showMs=Math.max(420,C().l4Ms-(l4Round*60));
  setTimeout(()=>{
    l4Showing=true;bann.textContent='⚡ SIGNAL DETECTED';bann.classList.add('active');sfx('alert');
    setTimeout(()=>{l4Showing=false;bann.textContent='IDENTIFY THE PATTERN';bann.classList.remove('active');},showMs);
  },700);
}

function l4Choose(id,btn){
  if(!l4Running)return;
  GS.data.l4.rounds++;
  const correct=id===l4Shape.id;
  if(correct){
    btn.classList.add('correct');
    GS.data.l4.locks++;sfx('lock');flash('green',.1);
    l4Showing=true;setTimeout(()=>l4Showing=false,900);
    if(l4Round>=10)setTimeout(completeL4,1000);
    else{document.querySelectorAll('.l4-opt').forEach(b=>b.onclick=null);setTimeout(l4StartRound,1600);}
  } else {
    btn.classList.add('wrong');GS.data.l4.misses++;sfx('wrong');flash('red',.22);shake();
    l4Mis++;setDots(3-l4Mis,3);
    if(l4Mis>=3){l4Mis=0;setDots(3,3);setTimeout(l4StartRound,1500);}
    else{l4Showing=true;setTimeout(()=>l4Showing=false,700);}
  }
}

function completeL4(){
  l4Running=false;cancelAnimationFrame(l4RAF);
  sfx('escape');flash('green',.28);
  setTimeout(()=>transition('PROTOCOL ZERO — LEVEL 5','FINAL ASSESSMENT','The experiment is complete. Your behavioral data has been compiled. Prepare to receive your profile.',startL5,4500),600);
}

function startL4(){
  show('s-l4');setHUDLevel('LEVEL 4');setProgress(74);setDots(3,3);
  initL4();l4Running=true;l4Round=0;l4Mis=0;l4LT=performance.now();l4Showing=false;
  GS.data.l4={locks:0,misses:0,rounds:0,times:[]};
  document.getElementById('l4-banner').textContent='CALIBRATING SIGNAL ARRAY...';
  document.getElementById('l4-banner').classList.remove('active');
  l4RAF=requestAnimationFrame(l4Frame);
  setTimeout(l4StartRound,1600);
}

/* ═════════════════════════════════════════════════════════════
   LEVEL 5 — PSYCHOLOGICAL ASSESSMENT
═════════════════════════════════════════════════════════════ */
function startL5(){
  show('s-assess');setProgress(100);hideHUD();
  const prof=buildProfile();
  renderAssessment(prof);
}

function buildProfile(){
  const d=GS.data;
  // REFLEX
  const avgT=d.l1.times.length?d.l1.times.reduce((a,b)=>a+b,0)/d.l1.times.length:400;
  let rClass,rColor,rDesc;
  if(avgT<180&&d.l1.misses<2){rClass='APEX PREDATOR';rColor='#FF2DA6';rDesc='Reaction latency in the top 3% of observed subjects. Your nervous system bypasses deliberation. Instinct has overridden cognition.';}
  else if(avgT<320){rClass='ACTIVE GUARDIAN';rColor='#00F5FF';rDesc='Above-average reflexive response. You are alert and engaged — responsive to environmental signals with controlled urgency.';}
  else{rClass='CALCULATED OBSERVER';rColor='#7A5CFF';rDesc='Below-average reaction speed but consistent accuracy. You prioritize precision over speed — a deliberate cognitive strategy under pressure.';}
  if(d.l1.decoys>2)rDesc+=' Notably, you were deceived by decoys '+d.l1.decoys+' times — suggesting susceptibility to misdirection when under sustained pressure.';

  // MORAL
  const ch=d.l2.choices;const w=d.l2.wrongs;const to=d.l2.timeouts;
  let mClass,mColor,mDesc;
  if(to>1){mClass='DECISION AVOIDER';mColor='#FF8800';mDesc='You defaulted on '+to+' moral decisions, allowing the system to determine the outcome. Avoidance is itself a moral stance — one that externalizes responsibility.';}
  else if(w===0){mClass='SYSTEMIC PRAGMATIST';mColor='#C7FF4D';mDesc='Your choices aligned with long-term structural benefit in every case. You balance individual empathy with systemic consequence — a rare and cognitively demanding mode of reasoning.';}
  else if(w===1){mClass='EMPATHIC REALIST';mColor='#00F5FF';mDesc='Near-perfect consequentialist alignment. You default to empathy but demonstrate the capacity to override emotion when stakes demand structural thinking.';}
  else{mClass='EMOTIONAL ACTOR';mColor='#FF2DA6';mDesc='Your moral decisions were primarily driven by instinct and feeling rather than structural reasoning. Authentic — but prone to systemic inconsistency under pressure.';}
  const meta=ch.find(c=>c.qIdx===9);
  if(meta?.choice==='b')mDesc+=' You stated feeling violated by the experimental nature of this assessment — indicating a strong internal model of consent and autonomy as foundational values.';
  else if(meta?.choice==='a')mDesc+=' You accepted the experimental framing — suggesting you prioritize knowledge acquisition over personal autonomy constraints.';

  // LOOP
  const md=d.l3.maxDepth,ld=d.l3.decisions;
  let lClass,lColor,lDesc;
  if(md<=4){lClass='SYSTEM RESISTER';lColor='#C7FF4D';lDesc='Maximum loop depth reached: '+md+'. You consistently navigated toward the exit. Whether by intuition or analysis, recursive entrapment failed to take hold.';}
  else if(md<=13){lClass='ADAPTIVE NAVIGATOR';lColor='#00F5FF';lDesc='Maximum loop depth: '+md+'. You experienced moderate entrapment but demonstrated enough flexibility to eventually escape the recursive pattern.';}
  else{lClass='DEEP LOOP SUBJECT';lColor='#FF2DA6';lDesc='Maximum loop depth: '+md+'. You descended significantly into the recursive system. Subjects at this depth often continue searching for hidden logic in arbitrary systems long after exiting.';}
  lDesc+=' Total decisions within the loop: '+ld+'.';
  if(d.l3.decisions>22)lDesc+=' You persisted through an unusually high number of decision cycles — suggesting high tolerance for cognitive discomfort or a compulsive search for pattern resolution.';

  // SIGNAL
  const lr=d.l4.locks/Math.max(1,d.l4.rounds);
  let sClass,sColor,sDesc;
  if(lr>=.82){sClass='PATTERN SOVEREIGN';sColor='#C7FF4D';sDesc='Lock accuracy: '+Math.round(lr*100)+'%. Exceptional signal discrimination under escalating cognitive noise. Pattern recognition operated independently of the psychological load accumulated in earlier levels.';}
  else if(lr>=.55){sClass='SIGNAL NAVIGATOR';sColor='#00F5FF';sDesc='Lock accuracy: '+Math.round(lr*100)+'%. Above-average signal discrimination. You maintained focus through increasing environmental noise and perceptual chaos.';}
  else{sClass='NOISE-SATURATED';sColor='#FF8800';sDesc='Lock accuracy: '+Math.round(lr*100)+'%. Difficulty separating signal from noise. This pattern is common following the psychological load of the ethical and recursive phases.';}

  // Composite
  const comp=buildComposite(rClass,mClass,lClass,sClass,d);

  return{
    id:'PZ-'+Date.now().toString(36).toUpperCase(),
    date:new Date().toLocaleString(),
    diff:GS.diff.toUpperCase(),
    reflex:{cls:rClass,col:rColor,desc:rDesc,avgT:Math.round(avgT),hits:d.l1.hits,miss:d.l1.misses,dec:d.l1.decoys},
    moral:{cls:mClass,col:mColor,desc:mDesc,wrongs:w,timeouts:to,flips:d.l2.hoverFlips},
    loop:{cls:lClass,col:lColor,desc:lDesc,maxDepth:md,decisions:ld},
    signal:{cls:sClass,col:sColor,desc:sDesc,locks:d.l4.locks,rounds:d.l4.rounds},
    composite:comp,
  };
}

function buildComposite(r,m,l,s,d){
  if(r==='APEX PREDATOR'&&m==='SYSTEMIC PRAGMATIST')return'A rare operational profile. Maximal speed combined with structural moral reasoning — you function as a high-performance decision system. Most effective in environments that reward both velocity and consequence.';
  if(r==='APEX PREDATOR'&&m==='EMOTIONAL ACTOR')return'High speed combined with emotionally-driven moral reasoning creates an unpredictable but intensely human profile. You act fast — but your motivations are internal rather than structural. Highly effective in personal contexts. Volatile in systemic ones.';
  if(r==='CALCULATED OBSERVER'&&m==='SYSTEMIC PRAGMATIST')return'Deliberate and principled. You sacrifice speed for accuracy in both physical and moral domains. An unusual internal consistency that suggests deep self-awareness and a preference for certainty over action.';
  if(l==='DEEP LOOP SUBJECT')return'The recursive loop left a significant mark on your profile. Subjects who descend deeply into entrapment systems often report persistent pattern-seeking in unrelated contexts afterward. This may be your natural cognitive mode — finding structure where none exists.';
  if(d.l2.hoverFlips>3)return'You changed your mind on moral questions more than most subjects. This suggests genuine engagement with the dilemmas rather than reflexive response — a sign of active moral processing rather than automated judgment.';
  return'Your composite profile exhibits productive tension between '+r.toLowerCase()+' reflexes and '+m.toLowerCase()+' moral reasoning — a friction that characterizes most complex human subjects. This internal contradiction is not a weakness. It is the architecture of a genuinely complicated mind.';
}

function renderAssessment(p){
  const body=document.getElementById('assess-body');
  body.innerHTML=`
<div class="a-header">
  <div class="a-eyebrow">ARQADEX — PROTOCOL ZERO — ASSESSMENT COMPLETE</div>
  <div class="a-title">SUBJECT PROFILE</div>
  <div class="a-id">ID: ${p.id} &nbsp;|&nbsp; ${p.date} &nbsp;|&nbsp; DIFFICULTY: ${p.diff}</div>
</div>
<div class="a-section" id="a1">
  <div class="a-sec-title">01 — REFLEX CLASSIFICATION</div>
  <div class="a-class" style="color:${p.reflex.col}">${p.reflex.cls}</div>
  <div class="a-bar-wrap"><div class="a-bar" id="ab1" style="background:${p.reflex.col}"></div></div>
  <div class="a-desc">${p.reflex.desc}</div>
  <div class="a-data">AVG RESPONSE: ${p.reflex.avgT}ms &nbsp;·&nbsp; HITS: ${p.reflex.hits} &nbsp;·&nbsp; MISSES: ${p.reflex.miss} &nbsp;·&nbsp; DECOY ERRORS: ${p.reflex.dec}</div>
</div>
<div class="a-section" id="a2">
  <div class="a-sec-title">02 — MORAL ARCHITECTURE</div>
  <div class="a-class" style="color:${p.moral.col}">${p.moral.cls}</div>
  <div class="a-bar-wrap"><div class="a-bar" id="ab2" style="background:${p.moral.col}"></div></div>
  <div class="a-desc">${p.moral.desc}</div>
  <div class="a-data">WRONG ANSWERS: ${p.moral.wrongs} &nbsp;·&nbsp; TIMEOUTS: ${p.moral.timeouts} &nbsp;·&nbsp; OPTION SWITCHES: ${p.moral.flips}</div>
</div>
<div class="a-section" id="a3">
  <div class="a-sec-title">03 — LOOP RESISTANCE</div>
  <div class="a-class" style="color:${p.loop.col}">${p.loop.cls}</div>
  <div class="a-bar-wrap"><div class="a-bar" id="ab3" style="background:${p.loop.col}"></div></div>
  <div class="a-desc">${p.loop.desc}</div>
</div>
<div class="a-section" id="a4">
  <div class="a-sec-title">04 — SIGNAL CLARITY</div>
  <div class="a-class" style="color:${p.signal.col}">${p.signal.cls}</div>
  <div class="a-bar-wrap"><div class="a-bar" id="ab4" style="background:${p.signal.col}"></div></div>
  <div class="a-desc">${p.signal.desc}</div>
  <div class="a-data">CORRECT LOCKS: ${p.signal.locks} / ${p.signal.rounds} ROUNDS</div>
</div>
<div class="a-composite a-section" id="a5">
  <div class="a-composite-lbl">COMPOSITE BEHAVIORAL PROFILE</div>
  <div class="a-composite-txt">${p.composite}</div>
</div>
<div class="a-final a-section" id="a6">
  <div class="a-reveal">This was not a game.</div>
  <br>
  Every reaction time was measured.<br>
  Every moral hesitation was recorded.<br>
  Every recursive decision was logged.<br>
  Every pattern lock and failure was catalogued.<br>
  <br>
  <div class="a-reveal">You were never a player. You were a subject.</div>
  <br>
  The questions were designed to reveal, not to judge. The reflex nodes were designed to isolate stress response. The moral dilemmas were constructed to expose decision architecture. The loops were designed to test entrainment resistance. The signal patterns were designed to reward those who retained cognitive clarity after psychological exhaustion.
  <br><br>
  Whether you feel satisfied, disturbed, or simply curious about what this revealed — that reaction itself is data.
  <br><br>
  <div class="a-credit">
    ARQADEX BEHAVIORAL RESEARCH DIVISION<br>
    PROTOCOL ZERO — EXPERIMENT ARCHIVED<br>
    SUBJECT PROFILE: ${p.id}
  </div>
</div>
<div class="a-replay a-section" id="a7">
  <button class="btn-primary" id="btn-replay">RUN EXPERIMENT AGAIN</button>
</div>`;

  // Reveal sections with staggered animation
  const secs=['a1','a2','a3','a4','a5','a6','a7'];
  const bars=[['ab1',Math.min(98,Math.max(10,100-(p.reflex.avgT/8)))],['ab2',Math.max(8,100-p.moral.wrongs*22)],['ab3',Math.max(8,100-p.loop.maxDepth*3.8)],['ab4',Math.round(p.signal.locks/Math.max(1,p.signal.rounds)*100)]];
  secs.forEach((id,i)=>setTimeout(()=>{
    const el=document.getElementById(id);if(!el)return;
    el.classList.add('reveal');sfx(i<4?'correct':'levelup');
    if(i<4){const[bid,bv]=bars[i];setTimeout(()=>{const b=document.getElementById(bid);if(b)b.style.width=bv+'%';},120);}
  },900+i*1500));

  setTimeout(()=>{flash('white',.06);},900+secs.length*1500);
  setTimeout(()=>{
    const btn=document.getElementById('btn-replay');
    if(btn)btn.onclick=()=>{location.reload();};
  },1500);
}

/* ── BOOT ── */
window.addEventListener('DOMContentLoaded',()=>{
  show('s-boot');
  setTimeout(runBoot,200);
});

})();
