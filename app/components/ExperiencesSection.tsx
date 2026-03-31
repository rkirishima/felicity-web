'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Experience {
  id: string;
  name: string;
  nameEn: string;
  desc: string;
  descEn: string;
  schedule: string;
  scheduleEn: string;
  photo: string;
  large?: boolean;
}

const EXPERIENCES: Experience[] = [
  {
    id: 'pilates',
    name: 'ピラティス',
    nameEn: 'Pilates',
    desc: '海を感じながら、意図を持ってコアを鍛える。ドリンク1杯で参加可。',
    descEn: 'Core training with intention, by the sea. Join with one drink.',
    schedule: '毎週火曜 10:00〜11:00',
    scheduleEn: 'Every Tuesday 10–11am',
    photo: '/experiences/pilates.jpg',
    large: true,
  },
  {
    id: 'roasting',
    name: '焙煎ワークショップ',
    nameEn: 'Roasting Workshop',
    desc: 'プロバットで直火焙煎を体験。豆の産地とプロセスを学ぶ。',
    descEn: 'Hands-on roasting on the Probat. Learn origins and process.',
    schedule: '不定期開催',
    scheduleEn: 'Occasional',
    photo: '/experiences/roasting-workshop.jpg',
  },
  {
    id: 'photo',
    name: '写真講座',
    nameEn: 'Photography',
    desc: '光、動き、瞬間を撮る。テクニックと遊び心を持って。',
    descEn: 'Capture light, motion, and the moment. Technique meets play.',
    schedule: '不定期開催',
    scheduleEn: 'Occasional',
    photo: '/experiences/photo-workshop.jpg',
  },
  {
    id: 'flower',
    name: 'フラワーワークショップ',
    nameEn: 'Flower Workshop',
    desc: '意図を花に込めて。茎を静寂に変える一時間。',
    descEn: 'Put intention into flowers. An hour of quiet craft.',
    schedule: '不定期開催',
    scheduleEn: 'Occasional',
    photo: '/experiences/flower-workshop.jpg',
  },
  {
    id: 'knitting',
    name: '編み物ワークショップ',
    nameEn: 'Knitting Workshop',
    desc: '手で作る。ゆっくりなクラフト、速い会話。',
    descEn: 'Make by hand. Slow craft, fast conversation.',
    schedule: '不定期開催',
    scheduleEn: 'Occasional',
    photo: '/experiences/knitting-workshop.jpg',
  },
];

const DAYS_JA = ['月', '火', '水', '木', '金', '土', '日'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  locale: 'ja' | 'en';
}

export function ExperiencesSection({ locale }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const isEn = locale === 'en';
  const days = isEn ? DAYS_EN : DAYS_JA;

  const scheduleEvents: (string | null)[] = [
    null,
    isEn ? 'Pilates\n10–11am' : 'ピラティス\n10:00-11:00',
    null,
    null,
    isEn ? 'Workshop\nOccasional' : 'ワークショップ\n不定期',
    isEn ? 'Workshop\nOccasional' : 'ワークショップ\n不定期',
    null,
  ];

  return (
    <section id="experiences" className="bg-[#F4EFE4] pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-8">
        <p className="font-mono text-[9px] tracking-[0.3em] text-[#7AAFC4] uppercase mb-8">
          {isEn ? 'Experiences' : 'Experiences'}
        </p>
        <h2 className="text-[clamp(28px,4vw,40px)] font-light text-[#2C2416] leading-tight mb-16">
          {isEn ? 'Connect through experience' : '体験を通じて、つながる'}
        </h2>

        {/* Schedule board */}
        <div className="bg-[#EDE5D8] border border-[#DDD5C5] rounded-sm p-6 md:p-8 mb-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#7AAFC4]" />
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#8C7B6B] uppercase">
              {isEn ? 'This week at Felicity' : '今週のFelicity'}
            </p>
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {days.map((day, i) => (
              <div key={day} className="text-center">
                <div className="font-mono text-[9px] tracking-[0.1em] text-[#8C7B6B] uppercase pb-2 border-b border-[#DDD5C5] mb-2">
                  {day}
                </div>
                <div className={`rounded-sm px-1 py-2 min-h-[56px] flex items-center justify-center text-center text-[9px] md:text-[10px] font-mono leading-tight whitespace-pre-line ${
                  scheduleEvents[i]
                    ? i === 1
                      ? 'bg-[#7AAFC4] text-white'
                      : 'bg-[#DDD5C5] text-[#8C7B6B]'
                    : ''
                }`}>
                  {scheduleEvents[i] || ''}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#7AAFC4]" />
              <span className="font-mono text-[9px] tracking-[0.1em] text-[#8C7B6B] uppercase">
                {isEn ? 'Regular' : '定期開催'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#DDD5C5]" />
              <span className="font-mono text-[9px] tracking-[0.1em] text-[#8C7B6B] uppercase">
                {isEn ? 'Occasional — see Instagram' : '不定期 — Instagramで告知'}
              </span>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#8C7B6B] uppercase mb-5 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#DDD5C5]" />
          {isEn ? 'All experiences' : '体験一覧'}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-[3px]">
          {EXPERIENCES.map((exp) => (
            <div
              key={exp.id}
              className={`relative overflow-hidden cursor-pointer group ${exp.large ? 'md:col-span-2' : ''}`}
              style={{ aspectRatio: '1' }}
              onClick={() => setActiveId(activeId === exp.id ? null : exp.id)}
            >
              <Image
                src={exp.photo}
                alt={exp.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className={`absolute inset-0 bg-[#2C2416]/70 flex flex-col justify-end p-5 transition-opacity duration-300 ${
                activeId === exp.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <p className="text-[11px] font-mono tracking-[0.12em] text-[#7AAFC4] uppercase mb-1">
                  {isEn ? exp.scheduleEn : exp.schedule}
                </p>
                <h3 className="text-white font-light text-[16px] md:text-[18px] mb-2">
                  {isEn ? exp.nameEn : exp.name}
                </h3>
                <p className="text-white/70 text-[12px] leading-relaxed">
                  {isEn ? exp.descEn : exp.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="font-mono text-[9px] tracking-[0.1em] text-[#8C7B6B] uppercase mt-4 text-center">
          {isEn ? 'tap for details' : 'タップで詳細'}
        </p>

        <div className="text-center mt-16 border-t border-[#DDD5C5] pt-12">
          <p className="text-[15px] font-light text-[#2C2416] mb-4">
            {isEn
              ? 'Follow us on Instagram for upcoming workshops and events.'
              : 'ワークショップ、イベントの最新情報はInstagramをフォローしてください。'}
          </p>
          <a
            href="https://www.instagram.com/felicity_hayama"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-[#7AAFC4] text-[#7AAFC4] font-mono text-[10px] tracking-[0.16em] uppercase px-6 py-3 hover:bg-[#7AAFC4] hover:text-[#2C2416] transition-colors"
          >
            @felicity_hayama
          </a>
        </div>
      </div>
    </section>
  );
}
