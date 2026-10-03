"use client";
import BecuLogo from '@/components/becu-logo';
import TrexisLogo from '@/components/trexis-logo';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, ArrowUpRight, Code2, Layers, Check, Smartphone, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FlutterExperience, JourneyPhone } from '@/components/banking-app';
import MoneyMovement from '@/components/money-movement';
import MemberExamples, { MemberMomentPicker, memberMoments } from '@/components/member-examples';
import { members, journey } from '@/lib/experience-data';
import BrandExtension, { BrandThemePicker, brandThemes } from '@/components/brand-extension';
import './journey.css';
const ForwardScene = lazy(() => import('@/components/forward-scene'));
const accountScreens = [
  memberMoments[0],
  memberMoments[1],
  {image:'/becu/accounts.png',alt:'BECU account experience with deep teal greeting, actions, and account cards'},
] as const;
const chapters = [
  {id:'design',label:'The experience',eyebrow:'BECU DESIGN × treXis SOURCE',title:'BECU by design.',accent:'treXis at its core.',copy:'A member experience coded and built on the treXis platform, by the BECU Design team within three days.'},
  {id:'source',label:'The source',eyebrow:'01 / GO BENEATH THE INTERFACE',title:'The design has',accent:'a foundation.',copy:'BECU Design is working with treXis source code and components. The experience is determined by BECU.'},
  {id:'product',label:'The product',eyebrow:'02 / FROM FOUNDATION TO EXPERIENCE',title:'The product.',accent:'Front and center.',copy:'A familiar BECU experience. Clear accounts. Confident next steps. One connected member relationship.'},
  {id:'members',label:'Every member',eyebrow:'04 / PERSONALIZATION FOR EVERY INDIVIDUAL',title:'Same segment.',accent:'Different needs.',copy:'Even members in the same segment can have very different needs. With treXis, BECU can meet each member exactly where they are—with an experience shaped around their next step.'},
  {id:'money',label:'Move money',eyebrow:'04 / COMPLEXITY STAYS UNDERNEATH',title:'Move money.',accent:'With confidence.',copy:'Where it goes. Where it comes from. How much. And when. A clear, guided BECU experience, powered by treXis.'},
  {id:'extension',label:'The extension',eyebrow:'05 / ONE FOUNDATION. EVERY IDENTITY.',title:'Any brand.',accent:'Any theme.',copy:'The treXis foundation and BECU-designed experience can adapt to any brand or theme. Logos, colors, typography, and styling can change while the banking features and member journeys stay connected.'},
  {id:'together',label:'Built together',eyebrow:'06 / THE EXPERIENCE WE INTEND TO IMPLEMENT',title:'One BECU experience.',accent:'Built together.',copy:'treXis provides the foundation. BECU shapes the member experience. Design and engineering converge on the same product.'}
];
export default function Home() {
  const root=useRef<HTMLDivElement>(null);
  const stage=useRef<HTMLDivElement>(null);
  const [chapter,setChapter]=useState(0);
  const [motion,setMotion]=useState(true);
  const [dialog,setDialog]=useState<'product'|'money'|'journey'|'design'|'member-design'|'money-design'|'desktop-design'|'brand-design'|null>(null);
  const [expandedScreen,setExpandedScreen]=useState<(typeof accountScreens)[number]>(accountScreens[0]);
  const [memberId,setMemberId]=useState('molly');
  const [memberMoment,setMemberMoment]=useState(0);
  const [brandTheme,setBrandTheme]=useState(1);
  const [step,setStep]=useState(0);
  const [ready,setReady]=useState(false);
  const active=useRef(0);
  const member=members.find(m=>m.id===memberId)!;
  const current=chapters[chapter];
  const accountScreen=accountScreens[chapter===0?0:chapter===1?1:2];
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>setMotion(!media.matches); change(); media.addEventListener('change',change);
    return()=>media.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    let cancelled=false; let cleanup=()=>{};
    if(!motion){setReady(true); return;}
    Promise.all([import('gsap'),import('gsap/ScrollTrigger')]).then(([{gsap},{ScrollTrigger}])=>{
      if(cancelled)return;
      gsap.registerPlugin(ScrollTrigger);
      const playhead={progress:0};
      const context=gsap.context(()=>{
        gsap.to(playhead,{progress:1,ease:'none',scrollTrigger:{trigger:root.current,start:'top top',end:'bottom bottom',scrub:.7,invalidateOnRefresh:true},onUpdate:()=>{
          const p=playhead.progress; const position=p*6; const index=Math.min(6,Math.floor(position+.5));
          if(active.current!==index){active.current=index;setChapter(index);}
          const distance=position-index;
          stage.current?.style.setProperty('--travel',String(distance));
          stage.current?.style.setProperty('--progress',String(p));
          window.dispatchEvent(new CustomEvent('becu:progress',{detail:p}));
        }});
      },root);
      cleanup=()=>context.revert(); setReady(true);
    }).catch(()=>{setMotion(false);setReady(true)});
    return()=>{cancelled=true;cleanup()};
  },[motion]);
  const go=(index:number)=>{
    index=Math.max(0,Math.min(6,index));
    if(!motion){setChapter(index);active.current=index;return;}
    const el=root.current;if(!el)return;
    const top=el.getBoundingClientRect().top+window.scrollY;
    window.scrollTo({top:top+(el.offsetHeight-window.innerHeight)*(index/6),behavior:'smooth'});
  };
  useEffect(()=>{
    const hash=()=>{const id=location.hash.slice(1);const i=chapters.findIndex(c=>c.id===(id==='platform'?'extension':id));if(i>=0)go(i)};
    if(ready)hash();window.addEventListener('hashchange',hash);return()=>window.removeEventListener('hashchange',hash);
  },[ready,motion]);
  const navigate=(i:number)=>{history.replaceState(null,'',`#${chapters[i].id}`);go(i)};
  return <main className="forward-experience">
    <a href="/app/" className="skip-link">Skip to interactive product</a>
    <div className={`journey-scroll ${motion?'':'no-motion'}`} ref={root}>
      <div className="journey-stage" ref={stage} data-chapter={chapter}>
        <Suspense fallback={null}><ForwardScene/></Suspense><div className="stage-vignette"/>
        <header className="journey-header"><a className="journey-brand" href="#design" onClick={e=>{e.preventDefault();navigate(0)}}><TrexisLogo/><i>×</i><BecuLogo/></a><span className="header-descriptor">SOURCE TO MEMBER EXPERIENCE</span><button className="motion-toggle" aria-pressed={!motion} onClick={()=>setMotion(!motion)}>{motion?"Reduce motion":"Enable motion"}</button><div className="header-utilities"><a className="explore-button" href="/app/">Explore the app <ArrowUpRight size={16}/></a><form method="post" action="/__access/logout"><button className="site-lock" type="submit" aria-label="Lock site" title="Lock site"><LockKeyhole size={16}/></button></form></div></header>
        <div className="journey-content">
          <div className="chapter-copy" key={current.id}>
            <div className="chapter-eyebrow"><span/>{current.eyebrow}</div>
            <h1>{current.title}<br/><em>{current.accent}</em></h1><p>{current.copy}</p>{chapter===0&&<small className="designer-credit">Chris Foisy | BECU Staff Product Designer</small>}
            <div className="chapter-actions">
              {chapter===0&&<Button className="journey-primary" onClick={()=>navigate(1)}>Go beneath the design <ArrowRight size={17}/></Button>}
              {chapter===6&&<Button className="journey-primary" asChild><a href="/app/">Explore the experience <ArrowUpRight size={17}/></a></Button>}
              {chapter===1&&<div className="source-stack"><span><Code2 size={16}/> treXis source</span><i>↓</i><span><Layers size={16}/> BECU experience layer</span><i>↓</i><span><Smartphone size={16}/> Working Flutter app</span></div>}
              
              {chapter===3&&<MemberMomentPicker selected={memberMoment} onSelect={setMemberMoment}/>}
              {chapter===5&&<BrandThemePicker selected={brandTheme} onSelect={setBrandTheme}/>}
              {chapter===6&&<div className="implementation-path">SOURCE <span>→</span> DESIGN <span>→</span> CODE <span>→</span> IMPLEMENTATION</div>}
            </div>
          </div>
          <div className={`product-world ${chapter===3?'member-world':chapter===5?'extension-world':chapter===6?'desktop-world':''}`}>
            <div className="world-orbit"/><div className="world-plinth"/>
            {chapter!==5&&chapter!==3&&chapter!==6&&<><div className="source-plane plane-back"><span>treXis / FOUNDATION</span><code>Accounts<br/>Transactions<br/>Transfers<br/>Banking Hub</code><small>Platform capabilities</small></div><div className="source-plane plane-front"><span>BECU / EXPERIENCE</span><code>AccountSummary<br/>TransactionList<br/>MoneyMovement</code><small>Illustrative component lineage</small></div></>}
            {chapter===6?<button className="desktop-reference" onClick={()=>setDialog('desktop-design')} aria-label="Expand BECU desktop experience"><img src="/becu/accounts-desktop-final.png" alt="BECU desktop banking experience with accounts, welcome tasks, and a personalized financial picture." width={2048} height={1427}/></button>:chapter===3?<MemberExamples selected={memberMoment} onSelect={setMemberMoment} onExpand={()=>setDialog('member-design')}/>:chapter===5?<BrandExtension selected={brandTheme} onExpand={()=>setDialog('brand-design')}/>:chapter===4?<button className="reference-device money-reference" onClick={()=>setDialog('money-design')} aria-label="Expand BECU money movement design"><img src="/becu/move-money.png" alt="BECU money movement design showing destination, funding account, an $82 amount, and date selection." width={1206} height={2625}/></button>:<button className="reference-device account-reference" onClick={()=>{setExpandedScreen(accountScreen);setDialog('design')}} aria-label="Expand BECU design reference"><img src={accountScreen.image} alt={accountScreen.alt} width={1206} height={2625}/></button>}
            <div className="world-caption"><span className="red-indicator"/>{chapter===3?'INDIVIDUAL MEMBERS · PERSONALIZED EXPERIENCES':chapter===5?'treXis FOUNDATION / EVERY BRAND':chapter===4?'ONE MONEY MOVEMENT PATTERN':'BECU DESIGN / treXis FOUNDATION'}</div>
          </div>
        </div>
        <div className="journey-bottom"><div className="scroll-instruction"><span>{motion?'SCROLL TO MOVE FORWARD':'CHOOSE A CHAPTER'}</span><ArrowRight size={16}/></div><nav className="chapter-navigation" aria-label="Experience chapters">{chapters.map((c,i)=><button key={c.id} aria-label={`Chapter ${i+1}: ${c.label}`} aria-current={chapter===i?'step':undefined} onClick={()=>navigate(i)}><span>{String(i+1).padStart(2,'0')}</span><b>{c.label}</b></button>)}</nav><div className="journey-arrows"><button aria-label="Previous chapter" disabled={chapter===0} onClick={()=>navigate(chapter-1)}><ArrowLeft size={17}/></button><button aria-label={chapter===6?'Restart journey':'Next chapter'} onClick={()=>navigate(chapter===6?0:chapter+1)}><ArrowRight size={17}/></button></div></div>
        <footer className="site-credit">This website was designed and coded by Chris Foisy | BECU Staff Product Designer to showcase the team's collaboration and the power of the treXis platform</footer>
        <div className="journey-progress"><span style={!motion?{transform:`scaleX(${chapter/6})`}:undefined}/></div>
        <span className="sr-only" aria-live="polite">Chapter {chapter+1} of 7: {current.label}</span>
      </div>
    </div>
    <Dialog open={dialog!==null} onOpenChange={open=>{if(!open)setDialog(null)}}><DialogContent className={`experience-dialog ${dialog==='desktop-design'?'desktop-reference-dialog':dialog==='brand-design'||dialog==='design'||dialog==='member-design'||dialog==='money-design'?'reference-dialog':''}`}><DialogTitle>{dialog==='brand-design'?`${brandThemes[brandTheme].label}. One shared foundation.`:dialog==='desktop-design'?'One BECU experience. Built together.':dialog==='money-design'?'Money movement, made clear':dialog==='money'?'Moving money, made simple':dialog==='journey'?'Meet Molly. One connected beginning.':dialog==='design'?'BECU account experience':dialog==='member-design'?memberMoments[memberMoment].title:'Explore the member experience'}</DialogTitle><DialogDescription>{dialog==='brand-design'?'A different brand and theme, built around the same banking experience.':dialog==='desktop-design'?'The BECU desktop experience, bringing accounts, next steps, and financial insights together.':dialog==='money-design'?'A guided BECU experience for choosing where money goes, where it comes from, how much, and when.':dialog==='member-design'?memberMoments[memberMoment].copy:dialog==='design'?'The BECU accounts design, shaped around a member’s next step.':'Interactive demonstration with fictional data. No banking service is connected.'}</DialogDescription>
      {dialog==='desktop-design'&&<img className="full-desktop-reference" src="/becu/accounts-desktop-final.png" alt="Full BECU desktop banking design showing accounts, welcome tasks, and Financial Picture." width={2048} height={1427}/>}
      {dialog==='money-design'&&<img className="full-reference" src="/becu/move-money.png" alt="BECU money movement design with destination, funding account, amount, and date selection." width={1206} height={2625}/>}
      {dialog==='brand-design'&&<img className="full-reference" src={brandThemes[brandTheme].image} alt={brandThemes[brandTheme].alt} width={1206} height={2625}/>}
      {dialog==='member-design'&&<img className="full-reference" src={memberMoments[memberMoment].image} alt={memberMoments[memberMoment].alt}/>}
      {dialog==='design'&&<img className="full-reference" src={expandedScreen.image} alt={expandedScreen.alt} width={1206} height={2625}/>}
      {dialog==='product'&&<div className="dialog-product"><div><div className="journey-members">{members.map(m=><button key={m.id} aria-pressed={memberId===m.id} onClick={()=>setMemberId(m.id)}>{m.firstName}</button>)}</div><h2>Every member.<br/>Their own experience.</h2><p>{member.description}</p><p>Personalization for each individual.<br/>A familiar BECU foundation.</p><Button className="journey-primary" onClick={()=>setDialog('money')}>Try a transfer <ArrowRight size={16}/></Button><button className="journey-text" onClick={()=>setDialog('journey')}>Explore the new-member journey →</button></div><FlutterExperience member={member} scenario={member.id} src={process.env.NEXT_PUBLIC_FLUTTER_URL} onCapability={id=>{if(id==="transfers")setDialog("money")}}/></div>}
      {dialog==='money'&&<MoneyMovement/>}
      {dialog==='journey'&&<div className="dialog-product"><div className="dialog-steps">{journey.map((j,i)=><button key={j.title} aria-pressed={step===i} onClick={()=>setStep(i)}><span>0{i+1}</span><div><strong>{j.title}</strong><p>{j.detail}</p></div>{i===step&&<Check size={18}/>}</button>)}</div><JourneyPhone step={step}/></div>}
    </DialogContent></Dialog>
  </main>;
}

