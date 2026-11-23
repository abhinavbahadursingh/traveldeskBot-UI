export function ProgressSteps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="steps" aria-label="Booking progress">
      {labels.map((label, j) => (
        <div key={label} className={j < current ? 'step done' : j === current ? 'step now' : 'step'}>
          <div className="bar"></div>
          <div className="lbl">{label}</div>
        </div>
      ))}
    </div>
  );
}
