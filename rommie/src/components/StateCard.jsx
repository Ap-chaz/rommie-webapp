import { Button } from "@/components/ui/button";
/** Empty and error states share one look: a white card, a heading, a line of help and an action. */
export function StateCard({ title, text, children }) {
    return (<div className="rounded-xl bg-card p-10 text-center">
      <p className="text-section">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-foggy">{text}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>);
}
export function ErrorCard({ title = "Something went wrong", text = "Check your connection and try again.", onRetry }) {
    return (<StateCard title={title} text={text}>
      <Button onClick={onRetry}>Retry</Button>
    </StateCard>);
}
