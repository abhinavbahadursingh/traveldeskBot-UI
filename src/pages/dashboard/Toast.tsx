import { Icon } from '../../components/ui/Icon';

export function Toast({ text, onUndo }: { text: string; onUndo?: () => void }) {
  return (
    <div className="toastwrap">
      <div className="toast pop" role="status">
        <Icon name={onUndo ? 'check' : 'warn'} size={18} aria-hidden="true" />
        <span>{text}</span>
        {onUndo && <button className="undo" onClick={onUndo}>Undo</button>}
      </div>
    </div>
  );
}
