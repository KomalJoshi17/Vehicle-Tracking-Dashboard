function MapThemeToggle({ theme, onToggle, inStack = false }) {
  const nextThemeLabel = theme === 'dark' ? 'Light' : 'Dark'

  return (
    <div className={inStack ? 'pointer-events-auto' : 'pointer-events-auto absolute right-3 top-3 z-[500]'}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Switch to ${nextThemeLabel.toLowerCase()} map theme`}
        aria-pressed={theme === 'dark'}
        className="map-theme-toggle rounded-md border border-slate-500/70 bg-slate-900/85 px-3 py-2 text-xs font-semibold tracking-wide text-slate-100 shadow-sm transition hover:border-slate-300/70 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        Theme: {nextThemeLabel}
      </button>
    </div>
  )
}

export default MapThemeToggle