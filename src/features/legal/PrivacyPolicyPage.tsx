import '@fontsource-variable/instrument-sans/wdth.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import { Archi2goLogo } from '../web-map/Archi2goLogo';
import { Time2mapMark } from '../web-map/Time2mapMark';
import './privacy-policy.css';

export function PrivacyPolicyPage() {
  const requestedReturnPath = new URLSearchParams(window.location.search).get('return');
  const returnPath =
    requestedReturnPath?.startsWith('/') && !requestedReturnPath.startsWith('//') ? requestedReturnPath : '/';
  const returnsToContact = new URL(returnPath, window.location.origin).searchParams.get('contact') === '1';

  return (
    <main className="privacy-page" id="main-content">
      <header className="privacy-header">
        <div className="privacy-header-inner">
          <a className="privacy-brand" href={returnPath} aria-label={returnsToContact ? 'Back to contact form' : 'Back to Archi2go'}>
            <Archi2goLogo />
          </a>
          <a className="privacy-back" href={returnPath}>
            <span aria-hidden="true">←</span>
            {returnsToContact ? 'Back to contact form' : 'Back to the map'}
          </a>
        </div>
      </header>

      <div className="privacy-layout">
        <nav className="privacy-index" aria-label="Privacy policy sections">
          <p>Document index</p>
          <ol>
            <li><a href="#device-storage"><span aria-hidden="true">01</span>Device storage</a></li>
            <li><a href="#providers"><span aria-hidden="true">02</span>Map and media</a></li>
            <li><a href="#external-links"><span aria-hidden="true">03</span>External links</a></li>
            <li><a href="#hosting"><span aria-hidden="true">04</span>Hosting</a></li>
            <li><a href="#choices"><span aria-hidden="true">05</span>Your choices</a></li>
            <li><a href="#contact"><span aria-hidden="true">06</span>Contact</a></li>
          </ol>
        </nav>

        <article className="privacy-document">
          <header className="privacy-title">
            <p className="privacy-kicker">Legal / Archi2go</p>
            <h1>Privacy<br />policy</h1>
            <p className="privacy-updated">Effective 15 October 2026</p>
          </header>

          <p className="privacy-lead">
            Archi2go is a curated city-guide web application. This policy explains what information the current web application uses and which external services are involved when you explore the map.
          </p>

          <section id="device-storage">
            <div className="privacy-section-title"><span aria-hidden="true">01</span><h2>Information stored on your device</h2></div>
            <p>
              Archi2go stores your last selected city in your browser’s local storage so the guide can reopen in the same place. This preference remains on your device until you clear your browser data. The application does not currently provide user accounts or use first-party advertising or analytics cookies.
            </p>
          </section>

          <section id="providers">
            <div className="privacy-section-title"><span aria-hidden="true">02</span><h2>Map and media providers</h2></div>
            <p>
              The interactive map is provided by Mapbox. Loading and using the map sends technical request information, which may include your IP address, browser information and map interactions, to Mapbox under its own privacy terms.
            </p>
            <p>
              Place photographs are loaded from Wikimedia Commons. Your browser connects directly to Wikimedia servers when those images are displayed.
            </p>
            <ul>
              <li><a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noreferrer">Mapbox privacy policy</a></li>
              <li><a href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy" target="_blank" rel="noreferrer">Wikimedia Foundation privacy policy</a></li>
            </ul>
          </section>

          <section id="external-links">
            <div className="privacy-section-title"><span aria-hidden="true">03</span><h2>External links</h2></div>
            <p>
              Archi2go contains links to Google Maps, publishers, architects’ resources and photo licensing pages. When you follow one of these links, the destination service processes data according to its own policy. Archi2go does not control those external websites.
            </p>
            <p><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google privacy policy</a></p>
          </section>

          <section id="hosting">
            <div className="privacy-section-title"><span aria-hidden="true">04</span><h2>Hosting and security</h2></div>
            <p>
              The hosting infrastructure may process standard technical logs needed to deliver and protect the service, such as request time, requested page, IP address and browser information. These logs should be retained only for operational and security purposes.
            </p>
          </section>

          <section id="choices">
            <div className="privacy-section-title"><span aria-hidden="true">05</span><h2>Your choices</h2></div>
            <p>
              You can remove the saved city preference by clearing this site’s local storage in your browser. You can also block third-party requests through browser privacy settings, although doing so may prevent maps or photographs from loading.
            </p>
          </section>

          <section id="contact">
            <div className="privacy-section-title"><span aria-hidden="true">06</span><h2>Contact</h2></div>
            <p>
              For privacy questions or requests, email <a href="mailto:contact@time2map.com">contact@time2map.com</a>.
            </p>
          </section>

          <footer className="privacy-footer">
            <span>Archi2go / City guide</span>
            <a href="https://time2map.com/" target="_blank" rel="noreferrer" aria-label="time2map — Maps and GIS solutions">
              <span aria-hidden="true">by</span>
              <Time2mapMark className="privacy-time2map-mark" />
              <span>time2map</span>
            </a>
          </footer>
        </article>
      </div>
    </main>
  );
}
