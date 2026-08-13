export function EventDiagram() {
  return (
    <div className="event-diagram" aria-label="Corporate action protection sequence">
      <div className="diagram-axis mono">
        <span>09:30:04</span>
        <span>EVENT CA–014</span>
        <span>SIMULATION 98.2%</span>
      </div>
      <div className="diagram-track">
        <span className="track-label mono">SOURCE</span>
        <span className="track-line" />
        <span className="track-node node-incoming">×01</span>
        <span className="track-line track-line-hot" />
        <span className="track-node node-signal">×04</span>
        <span className="track-line track-line-split">
          <i />
          <i />
        </span>
        <span className="track-node node-proof">✓</span>
        <span className="track-label mono">PROOF</span>
      </div>
      <div className="diagram-notes mono">
        <span>DEMO EVENT PAYLOAD</span>
        <span>SIMULATED IMPACT MAP</span>
        <span>RECOMMEND: PAUSE_QUOTES</span>
        <span>NO CHAIN RECEIPT</span>
      </div>
    </div>
  );
}
