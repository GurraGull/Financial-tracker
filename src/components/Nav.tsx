export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1f1f1f] bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-semibold tracking-[0.15em] uppercase">
            Anduril
          </span>
          <span className="text-[#404040] text-sm tracking-[0.05em]">/</span>
          <span className="text-[#737373] text-sm tracking-[0.05em]">
            Financials
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[#404040] text-xs tracking-[0.1em] uppercase">
            Public Disclosure
          </span>
          <a
            href="#methodology"
            className="text-[#737373] text-xs tracking-[0.1em] uppercase hover:text-white transition-colors"
          >
            Methodology
          </a>
        </div>
      </div>
    </nav>
  );
}
