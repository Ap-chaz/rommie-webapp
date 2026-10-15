import { SOCIALS } from "@/lib/site";
const svg = (children) => (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>);
const ALL = [
    {
        key: "instagram",
        label: "Instagram",
        icon: svg(<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></>),
    },
    {
        key: "tiktok",
        label: "TikTok",
        icon: svg(<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>),
    },
    {
        key: "facebook",
        label: "Facebook",
        icon: svg(<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>),
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        icon: svg(<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>),
    },
    {
        key: "whatsapp",
        label: "WhatsApp",
        icon: svg(<><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></>),
    },
];
/** Round, 44px tap targets. Items whose URL is empty are hidden. */
export function SocialIcons({ className = "" }) {
    return (<ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Rommie on social media">
      {ALL.filter((s) => SOCIALS[s.key]).map((s) => (<li key={s.key}>
          <a href={SOCIALS[s.key]} target="_blank" rel="noopener noreferrer" aria-label={`Rommie on ${s.label} (opens in a new tab)`} title={s.label} className="flex h-11 w-11 items-center justify-center rounded-full border border-deco bg-card text-hof transition-colors hover:border-hof hover:bg-hof hover:text-primary-foreground">
            {s.icon}
          </a>
        </li>))}
    </ul>);
}
