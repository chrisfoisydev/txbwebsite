"use client";
import { ArrowUpRight } from 'lucide-react';

export const memberMoments = [
  {
    id: 'welcome',
    label: 'A confident start',
    title: 'Make the first steps feel simple.',
    copy: 'A welcome shaped around getting started, with card activation and direct deposit close at hand.',
    image: '/becu/new-member.png',
    alt: 'BECU accounts with a welcome experience featuring debit card activation and direct deposit setup.',
  },
  {
    id: 'application',
    label: 'An unfinished next step',
    title: 'Pick up right where life paused.',
    copy: 'An application in progress becomes the next best action, so a member can continue with confidence.',
    image: '/becu/resume-application.png',
    alt: 'BECU accounts with a credit card application at three of four steps and a Resume Application action.',
  },
  {
    id: 'goal',
    label: 'A goal within reach',
    title: 'Turn progress into possibility.',
    copy: 'A member nearing a savings goal sees relevant auto-loan options, connecting today’s progress to tomorrow’s plans.',
    image: '/becu/financial-health.png',
    alt: 'BECU accounts with a new car goal at 75 percent saved and personalized auto-loan options.',
  },
] as const;

export function MemberMomentPicker({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  const moment = memberMoments[selected];
  return <div className="member-story">
    <div className="member-moment-picker" role="group" aria-label="Explore individual member needs">
      {memberMoments.map((item, index) => <button key={item.id} aria-pressed={selected === index} onClick={() => onSelect(index)}>
        <span>0{index + 1}</span><strong>{item.label}</strong>
      </button>)}
    </div>
    <div className="member-moment-copy" aria-live="polite" aria-atomic="true">
      <h2>{moment.title}</h2><p>{moment.copy}</p>
    </div>
    <button className="member-next" onClick={() => onSelect((selected + 1) % memberMoments.length)}>
      Explore the next moment <ArrowUpRight size={15}/>
    </button>
  </div>;
}

export default function MemberExamples({ selected, onSelect, onExpand }: { selected: number; onSelect: (index: number) => void; onExpand: () => void }) {
  return <div className="member-showcase" aria-label="BECU experiences tailored to individual needs">
    <div className="member-showcase-halo" aria-hidden="true"/>
    {memberMoments.map((moment, index) => {
      const position = index === selected ? 'center' : (index - selected + 3) % 3 === 1 ? 'right' : 'left';
      return <button key={moment.id} className="member-design" data-position={position}
        aria-label={index === selected ? `View full design: ${moment.label}` : `Show ${moment.label}`}
        onClick={() => index === selected ? onExpand() : onSelect(index)}>
        <img src={moment.image} alt={moment.alt} width={1206} height={2625}/>
      </button>;
    })}
    <div className="member-showcase-caption"><span>0{selected + 1} / 03</span> BECU design. Individual relevance.</div>
  </div>;
}
