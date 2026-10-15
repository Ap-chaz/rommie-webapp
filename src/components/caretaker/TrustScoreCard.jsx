const R = 52;
const C = 2 * Math.PI * R;
/** 0 to 100 ring plus the breakdown. Monochrome on purpose: no traffic-light colors. */
export function TrustScoreCard({ trust }) {
    return (<section className="rounded-xl bg-card p-5 md:p-6" aria-labelledby="trust-heading">
      <h2 id="trust-heading" className="text-section">Trust score</h2>
      <div className="mt-4 flex items-center gap-4 sm:gap-5">
        <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32" role="img" aria-label={`Trust score ${trust.score} out of 100`}>
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--bebe)" strokeWidth="10"/>
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--hof)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - trust.score / 100)}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-page leading-none">{trust.score}</span>
            <span className="text-xs text-foggy">out of 100</span>
          </div>
        </div>
        <p className="text-foggy">Students see this on your listings. Keep rooms confirmed, get verified and avoid reports to raise it.</p>
      </div>

      <ul className="mt-6 space-y-4">
        {trust.items.map((i) => (<li key={i.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{i.label}</span>
              <span className="text-foggy">{i.points} / {i.max}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bebe" role="presentation">
              <div className="h-full rounded-full bg-hof" style={{ width: `${(i.points / i.max) * 100}%` }}/>
            </div>
            <p className="mt-1 text-sm text-foggy">{i.note}</p>
          </li>))}
      </ul>
    </section>);
}
