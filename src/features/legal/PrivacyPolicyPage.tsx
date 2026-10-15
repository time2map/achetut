import './privacy-policy.css';

export function PrivacyPolicyPage() {
  return (
    <main className="privacy-page" id="main-content">
      <header className="privacy-header">
        <a className="privacy-brand" href="/design-1" aria-label="Back to Achetut">Achetut</a>
        <a className="privacy-back" href="/design-1">Back to the map</a>
      </header>

      <article className="privacy-document">
        <p className="privacy-kicker">Legal</p>
        <h1>Privacy policy</h1>
        <p className="privacy-updated">Effective 15 October 2026</p>

        <p className="privacy-lead">
          Achetut is a curated city-guide web application. This policy explains what information the current web application uses and which external services are involved when you explore the map.
        </p>

        <section>
          <h2>Information stored on your device</h2>
          <p>
            Achetut stores your last selected city in your browser’s local storage so the guide can reopen in the same place. This preference remains on your device until you clear your browser data. The application does not currently provide user accounts or use first-party advertising or analytics cookies.
          </p>
        </section>

        <section>
          <h2>Map and media providers</h2>
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

        <section>
          <h2>External links</h2>
          <p>
            Achetut contains links to Google Maps, publishers, architects’ resources and photo licensing pages. When you follow one of these links, the destination service processes data according to its own policy. Achetut does not control those external websites.
          </p>
          <p><a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google privacy policy</a></p>
        </section>

        <section>
          <h2>Hosting and security</h2>
          <p>
            The hosting infrastructure may process standard technical logs needed to deliver and protect the service, such as request time, requested page, IP address and browser information. These logs should be retained only for operational and security purposes.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <p>
            You can remove the saved city preference by clearing this site’s local storage in your browser. You can also block third-party requests through browser privacy settings, although doing so may prevent maps or photographs from loading.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions or requests, email <a href="mailto:feedback@time2map.com">feedback@time2map.com</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
