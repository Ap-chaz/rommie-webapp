import { LEGAL_UPDATED } from "@/lib/site";
/** Long-form text page used by Privacy and Terms: narrow column, section headings, hairlines between sections. */
export function LegalPage({ title, intro, sections }) {
    return (<article className="page-container max-w-[760px] py-8 md:py-12">
      <h1 className="text-page">{title}</h1>
      <p className="mt-1 text-foggy">Last updated {LEGAL_UPDATED}</p>
      <p className="mt-6 text-base">{intro}</p>
      <div className="mt-8 divide-y divide-bebe">
        {sections.map((s, i) => (<section key={s.heading} className="space-y-3 py-6 first:pt-0">
            <h2 className="text-section">{i + 1}. {s.heading}</h2>
            <div className="space-y-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">{s.body}</div>
          </section>))}
      </div>
    </article>);
}
