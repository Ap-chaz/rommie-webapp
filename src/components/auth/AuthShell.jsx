export function AuthShell({ title, subtitle, children, footer }) {
    return (<div className="page-container py-8 md:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-xl bg-card p-6 md:p-8">
          <h1 className="text-page">{title}</h1>
          {subtitle && <p className="mt-2 text-foggy">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-foggy">{footer}</div>}
      </div>
    </div>);
}
