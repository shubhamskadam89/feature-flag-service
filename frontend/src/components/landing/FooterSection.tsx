const REPO_URL = "https://github.com/shubhamskadam89/feature-flag-service";

const GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Release preview", href: "#preview" },
      { label: "Workflow", href: "#workflow" },
      { label: "Engineering proof", href: "#proof" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Integration", href: "#developers" },
      { label: "GitHub", href: REPO_URL },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export function FooterSection() {
  return (
    <footer className="surface-cream border-t border-[var(--color-line)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
           <img src="/logo-light.png" alt="Logo" className="h-6" />
          </div>
          <p className="max-w-xs font-mono text-xs text-[var(--color-muted-text)]">
            Feature flags for informed releases
          </p>
        </div>

        {GROUPS.map((group) => (
          <div key={group.title} className="space-y-3">
            <p className="label-mono">{group.title}</p>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[var(--color-secondary-text)] transition-colors hover:text-[var(--color-foreground)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-6xl border-t border-[var(--color-line)] px-5 py-6 sm:px-8">
        <p className="font-mono text-[11px] text-[var(--color-muted-text)]">
          © {new Date().getFullYear()} flags.dev · Exposure figures shown on this page are
          deterministic demo projections.
        </p>
      </div>
    </footer>
  );
}
