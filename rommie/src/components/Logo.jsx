import { Link } from "@/lib/router";
export function Logo() {
    return (<Link to="/" className="flex items-center gap-1.5 text-rausch" aria-label="Rommie home">
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 15 16 5l12 10"/>
        <path d="M8 12.5V26h16V12.5"/>
        <path d="M13 26v-7h6v7"/>
      </svg>
      <span className="text-[22px] font-bold tracking-[-0.03em]">rommie</span>
    </Link>);
}
