import '@fontsource-variable/jost/wght.css';

export function Archi2goLogo() {
  return (
    <div className="archi2go-logo" role="img" aria-label="Archi2go">
      <i className="archi2go-mark" aria-hidden="true">
        <svg viewBox="200 210 623 628">
          <path d="M200 590 630 210v283L200 838Z" fill="currentColor" />
          <path d="M632 495h191v343H632Z" fill="currentColor" />
        </svg>
      </i>
      <span className="archi2go-word" aria-hidden="true">Archi2go</span>
    </div>
  );
}
