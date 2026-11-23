export interface SchemaRow { key: string; val: string; cls: string; href?: string; id?: string }

export function SchemaGroup({ title, open, rows }: { title: string; open: boolean; rows: SchemaRow[] }) {
  return (
    <details className="group" open={open}>
      <summary><span>{title}</span><svg className="ic chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg></summary>
      <div style={{ paddingBottom: '6px' }}>
        {rows.map((r) => (
          <div key={r.id || r.key} className="kv"><span className="kv-k">{r.key}</span>{r.href ? <a className={r.cls} href={r.href} target="_blank" rel="noopener noreferrer">{r.val}</a> : <span className={r.cls} style={{ whiteSpace: 'pre-line' }}>{r.val}</span>}</div>
        ))}
      </div>
    </details>
  );
}
