'use client';

import { Visit } from '@/types';

interface CoachingSuggestionsProps {
  visits: Visit[];
}

export default function CoachingSuggestions({ visits }: CoachingSuggestionsProps) {
  const nonNoShow = visits.filter(v => !v.is_no_show);

  // Peak day of week
  const dayRVU: Record<number, number[]> = {};
  nonNoShow.forEach(v => {
    const d = new Date(v.date + 'T12:00:00').getDay();
    const rvu = v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0);
    (dayRVU[d] ||= []).push(rvu);
  });
  const dayFullNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  let peakDay = 1, peakAvg = 0;
  for (const [day, rvus] of Object.entries(dayRVU)) {
    const avg = rvus.reduce((a, b) => a + b, 0) / rvus.length;
    if (avg > peakAvg) { peakAvg = avg; peakDay = Number(day); }
  }
  const overallAvg = nonNoShow.length > 0
    ? nonNoShow.reduce((sum, v) => sum + v.procedures.reduce((s, p) => s + Number(p.work_rvu) * (p.quantity || 1), 0), 0) / nonNoShow.length
    : 1;
  const peakPctOver = Math.round(((peakAvg - overallAvg) / overallAvg) * 100);

  // G2211 opportunity
  const qualifiedVisits = nonNoShow.filter(v =>
    v.procedures.some(p => ['99213', '99214', '99215', '99203', '99204', '99205'].includes(p.hcpcs)));
  const g2211Visits = qualifiedVisits.filter(v => v.procedures.some(p => p.hcpcs === 'G2211'));
  const missedG2211 = qualifiedVisits.length - g2211Visits.length;

  // End-of-day drop
  const lateVisits = nonNoShow.filter(v => v.time && parseInt(v.time.split(':')[0], 10) >= 16);
  const earlyVisits = nonNoShow.filter(v => v.time && parseInt(v.time.split(':')[0], 10) < 16 && parseInt(v.time.split(':')[0], 10) >= 8);
  const lateAvg = lateVisits.length > 0
    ? lateVisits.reduce((s, v) => s + v.procedures.reduce((ss, p) => ss + Number(p.work_rvu) * (p.quantity || 1), 0), 0) / lateVisits.length
    : 0;
  const earlyAvg = earlyVisits.length > 0
    ? earlyVisits.reduce((s, v) => s + v.procedures.reduce((ss, p) => ss + Number(p.work_rvu) * (p.quantity || 1), 0), 0) / earlyVisits.length
    : 0;
  const dropPct = earlyAvg > 0 ? Math.round(((earlyAvg - lateAvg) / earlyAvg) * 100) : 0;

  const suggestions = [
    {
      color: '#059669',
      title: `${dayFullNames[peakDay]} are your peak`,
      body: `You bill ${peakPctOver > 0 ? peakPctOver : 0}% more on ${dayFullNames[peakDay]}. Consider scheduling complex cases there.`,
    },
    {
      color: '#d97706',
      title: 'Add G2211 more often',
      body: `${qualifiedVisits.length} of your visits qualified, only ${g2211Visits.length} had it. ${missedG2211} missed add-ons.`,
    },
    {
      color: '#0070cc',
      title: 'End-of-day drop',
      body: `After 4pm RVU/visit falls ${dropPct > 0 ? dropPct : 0}%. Block that time for documentation.`,
    },
  ];

  return (
    <div className="bg-zinc-50 rounded-xl border border-zinc-200/80 p-6">
      <h3 className="text-xl font-semibold text-[#1f1f1f] tracking-tight mb-4">Suggestions for this week</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-zinc-200/80 p-4">
            <div className="w-2 h-2 rounded-full mb-2.5" style={{ backgroundColor: s.color }} />
            <p className="font-semibold text-sm text-[#1f1f1f] mb-1">{s.title}</p>
            <p className="text-xs text-zinc-500 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
