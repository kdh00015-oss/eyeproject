// 하단: 진행 로그

export default function LogPanel({ log }) {
  return (
    <footer className="panel log-panel">
      <h2 className="panel-title">📜 진행 로그</h2>
      <ul className="log-list">
        {log.map((entry, i) => (
          <li key={i} className={'log-entry log-' + entry.kind}>
            <span className="log-day">D{entry.day}</span>
            <span>{entry.text}</span>
          </li>
        ))}
      </ul>
    </footer>
  );
}
