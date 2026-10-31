import { useEffect, type ReactNode } from 'react';
import '@fontsource-variable/instrument-sans/wdth.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import { Archi2goLogo } from '../web-map/Archi2goLogo';
import { Time2mapMark } from '../web-map/Time2mapMark';
import './privacy-policy.css';

// Change this, and only this, when publication slips or the policy changes.
const EFFECTIVE_DATE = '30 October 2026';

// The app and the store listings link to these ids: keep them stable.
const SECTIONS = [
  { id: 'controller', title: 'Who is responsible for your data' },
  { id: 'in-short', title: 'In short' },
  { id: 'website', title: 'Website' },
  { id: 'app', title: 'App (iOS and Android)' },
  { id: 'recipients', title: 'Who receives your data' },
  { id: 'emails', title: 'Emails to us' },
  { id: 'retention', title: 'How long we keep data' },
  { id: 'your-rights', title: 'Your rights' },
  { id: 'opt-out', title: 'How to opt out or delete your data' },
  { id: 'children', title: 'Children' },
  { id: 'security', title: 'Security' },
  { id: 'external-links', title: 'Links to other websites' },
  { id: 'changes', title: 'Changes to this policy' },
  { id: 'contact', title: 'Contact' }
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const sectionNumber = (index: number) => String(index + 1).padStart(2, '0');

function PolicySection({ id, children }: { id: SectionId; children: ReactNode }) {
  const index = SECTIONS.findIndex((section) => section.id === id);

  return (
    <section className="privacy-section" id={id} aria-labelledby={`${id}-title`}>
      <div className="privacy-section-title">
        <span aria-hidden="true">{sectionNumber(index)}</span>
        <h2 id={`${id}-title`}>{SECTIONS[index].title}</h2>
      </div>
      <div className="privacy-section-body">{children}</div>
    </section>
  );
}

function PolicySubsection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="privacy-subsection" id={id} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>{title}</h3>
      {children}
    </section>
  );
}

// Below 600px each row becomes a card and every cell after the first shows its column name.
function PolicyTable({ labelledBy, columns, rows }: { labelledBy: string; columns: string[]; rows: ReactNode[][] }) {
  return (
    <table className="privacy-table" aria-labelledby={labelledBy}>
      <thead>
        <tr>
          {columns.map((column) => <th key={column} scope="col">{column}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => <td key={columns[cellIndex]} data-label={columns[cellIndex]}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
}

const contactEmail = <a href="mailto:contact@time2map.com">contact@time2map.com</a>;

// The Archi2go app opens this page with ?from=app; its own link brings it forward as the user left it.
const APP_RETURN_URL = 'achetut://back';

export function PrivacyPolicyPage() {
  const query = new URLSearchParams(window.location.search);
  const fromApp = query.get('from') === 'app';
  const requestedReturnPath = query.get('return');
  const returnPath =
    requestedReturnPath?.startsWith('/') && !requestedReturnPath.startsWith('//') ? requestedReturnPath : '/';
  const returnsToContact = new URL(returnPath, window.location.origin).searchParams.get('contact') === '1';
  const backHref = fromApp ? APP_RETURN_URL : returnPath;
  const backText = fromApp ? 'Back to the app' : returnsToContact ? 'Back to contact form' : 'Back to the map';
  const brandLabel = fromApp ? 'Back to the Archi2go app' : returnsToContact ? 'Back to contact form' : 'Back to Archi2go';

  // The page renders after the browser has looked for the #fragment, so links such as /privacy#app land here.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    let id = hash;
    try {
      id = decodeURIComponent(hash);
    } catch {
      // A malformed fragment such as #100% stays as typed instead of blanking the page.
    }
    void document.fonts.ready.then(() => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }));
  }, []);

  return (
    <main className="privacy-page" id="main-content">
      <header className="privacy-header">
        <div className="privacy-header-inner">
          <a className="privacy-brand" href={backHref} aria-label={brandLabel}>
            <Archi2goLogo />
          </a>
          <a className="privacy-back" href={backHref}>
            <span aria-hidden="true">←</span>
            {backText}
          </a>
        </div>
      </header>

      <div className="privacy-layout">
        <nav className="privacy-index" aria-label="Privacy policy sections">
          <p>Document index</p>
          <ol>
            {SECTIONS.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`}><span aria-hidden="true">{sectionNumber(index)}</span>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="privacy-document">
          <header className="privacy-title">
            <p className="privacy-kicker">Legal / Archi2go</p>
            <h1>Privacy<br />policy</h1>
            <p className="privacy-updated">Effective {EFFECTIVE_DATE}</p>
          </header>

          <p className="privacy-lead">
            This policy explains what personal data Archi2go processes, why, for how long, and what you can do about it. It covers the Archi2go website at archi2go.com and the Archi2go app for iOS and Android.
          </p>

          <PolicySection id="controller">
            <p>
              The controller is Alexander Semenov, a self-employed developer (autónomo) in Spain. He is the developer of Archi2go named in the App Store and on Google Play.
            </p>
            <ul>
              <li>Address: Carrer de Galileu, 142, Sants-Montjuïc, 08028 Barcelona, Spain</li>
              <li>Tax ID (NIF): ESZ2405174T</li>
              <li>Email for privacy questions and requests: {contactEmail}</li>
            </ul>
            <p>
              Because the controller is established in the EU, the General Data Protection Regulation (GDPR) and Spanish data protection law apply, wherever you use Archi2go from.
            </p>
          </PolicySection>

          <PolicySection id="in-short">
            <ul>
              <li>No accounts, no sign-up, no advertising. We do not sell your data, build profiles or make automated decisions about you.</li>
              <li>Our server sees your IP address and which city you open. Server logs are deleted after 14 days.</li>
              <li>The map comes from Mapbox; place photos come from Wikimedia Commons, Flickr and Unsplash. Your device connects to them directly, so they see your IP address.</li>
              <li>Location is optional. Your coordinates are never sent to our server.</li>
              <li>In the app, Mapbox collects usage and location data (telemetry) to improve its maps unless you switch it off with the ⓘ button on the map.</li>
              <li>All connections use encrypted HTTPS.</li>
            </ul>
          </PolicySection>

          <PolicySection id="website">
            <p>This section covers archi2go.com.</p>

            <PolicySubsection id="website-server" title="Our server">
              <p>
                When you open the site, your browser loads the site and the city catalogue from our server. Like any web server, it logs your IP address, the date and time, the address requested (which shows the city you opened), the referring page and your browser and operating system.
              </p>
              <p>
                We use this to deliver the site, keep it running and protect it from abuse. Legal basis: our legitimate interests (Art. 6(1)(f) GDPR). Logs are deleted after 14 days.
              </p>
            </PolicySubsection>

            <PolicySubsection id="website-map" title="Map (Mapbox)">
              <p>
                The map is provided by Mapbox, Inc. (USA). To draw it, your browser requests map data directly from Mapbox. Mapbox receives your IP address, browser and device information, the address of the page and which areas of the map you view.
              </p>
              <p>
                The Mapbox map also stores a random identifier in your browser's local storage and sends it to Mapbox when the map loads, so Mapbox can count map loads. Mapbox keeps IP addresses for up to 30 days.
              </p>
              <p>
                The map cannot work without these requests. Legal basis: our legitimate interests in showing the map. Mapbox processes this data partly on our behalf and partly under its own <ExternalLink href="https://www.mapbox.com/legal/privacy">privacy policy</ExternalLink>.
              </p>
            </PolicySubsection>

            <PolicySubsection id="website-photos" title="Photos (Wikimedia Commons, Flickr and Unsplash)">
              <p>
                Place photos load directly from Wikimedia Commons, run by the Wikimedia Foundation (USA), and a few from Flickr, run by SmugMug, Inc. (USA), and Unsplash, run by Unsplash Inc. (Canada). They load automatically when you open a city, a place or the list of cities.
              </p>
              <p>
                These services receive your IP address, browser information and which photos were loaded, which reveals the city you are viewing. They process this data as independent controllers under their own policies: <ExternalLink href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy">Wikimedia Foundation privacy policy</ExternalLink>, <ExternalLink href="https://www.flickr.com/help/privacy">Flickr privacy policy</ExternalLink>, <ExternalLink href="https://unsplash.com/privacy">Unsplash privacy policy</ExternalLink>.
              </p>
            </PolicySubsection>

            <PolicySubsection id="website-location" title="Your location">
              <p>
                If you allow it in your browser, the site asks your browser for a low-accuracy position each time you open archi2go.com without a city in the address, to open the nearest city. The comparison happens in your browser. Your coordinates are not sent to our server or to Mapbox, and the site does not show your position on the map.
              </p>
              <p>
                Legal basis: your consent, given in your browser's permission prompt. You can withdraw it at any time in your browser's site settings. Without location, the site opens a default city and you can choose another.
              </p>
            </PolicySubsection>

            <PolicySubsection id="website-storage" title="Cookies and local storage">
              <p>We set no advertising or analytics cookies. The site uses the storage below.</p>
              <PolicyTable
                labelledBy="website-storage-title"
                columns={['Name', 'Set by', 'Type', 'Purpose', 'Kept for']}
                rows={[
                  [<code>archi2go-city-v2</code>, 'Archi2go', 'Local storage, necessary', 'Remembers the last city you opened', 'Until you clear site data'],
                  [<code>archi2go-3d-v2</code>, 'Archi2go', 'Local storage, necessary', 'Remembers whether 3D view is on', 'Until you clear site data'],
                  [<code>mapbox.eventData…</code>, 'Mapbox', 'Local storage, necessary for the map', 'Random identifier for counting map loads', 'Until you clear site data'],
                  [<code>mapbox-tiles</code>, 'Mapbox', 'Browser cache, necessary for the map', 'Copies of map tiles, so the map loads faster', 'Until the tiles expire or you clear site data'],
                  [<code>archi2go-contact-draft</code>, 'Archi2go', 'Session storage, necessary', 'Keeps what you type in the contact form until you send it', 'Until you send the message or close the tab']
                ]}
              />
              <p>
                Necessary storage does not require consent under Spanish law (LSSI, Art. 22.2) because the site cannot provide the features you use without it. You can delete all of it in your browser settings; the site will then forget your last city.
              </p>
            </PolicySubsection>
          </PolicySection>

          <PolicySection id="app">
            <p>
              This section covers the Archi2go app. The app has no accounts, no advertising, no analytics or crash reporting of our own and no push notifications. The privacy labels in the App Store and the Data safety section on Google Play list precise and approximate location, identifiers, product interaction and diagnostics: all of it is collected by Mapbox, as described below, is not linked to your identity and is not used for advertising. They also list your email address and your message, which the app sends only if you write to us with Contact us (see Emails to us).
            </p>

            <PolicySubsection id="app-server" title="Our server">
              <p>
                The app downloads the city catalogue from our server. Each request carries your IP address, the time, the city requested and technical request headers (on iPhone, the app and iOS version). It contains no account, device identifier or coordinates. Each time the app starts, unless you opened it from a link, the city requested may be the one nearest to you, if you allowed location.
              </p>
              <p>
                We use this to deliver the catalogue, keep the service running and protect it from abuse. Legal basis: our legitimate interests (Art. 6(1)(f) GDPR). Logs are deleted after 14 days.
              </p>
            </PolicySubsection>

            <PolicySubsection id="app-map" title="Map (Mapbox)">
              <p>
                The map is provided by Mapbox, Inc. (USA) through the Mapbox Maps SDK built into the app. To show the map, the app always sends Mapbox your IP address, device model and operating system, the map areas loaded and a random identifier Mapbox uses to count users. When the map shows your position, the map areas loaded reveal your area to about 1 km.
              </p>
              <p>
                This is sent even when telemetry is switched off, because the map cannot work without it. Legal basis: our legitimate interests in showing the map. Mapbox keeps IP addresses for up to 30 days.
              </p>
            </PolicySubsection>

            <PolicySubsection id="app-telemetry" title="Mapbox telemetry">
              <p>Mapbox telemetry is switched on by default. While it is on, the Mapbox SDK also sends Mapbox:</p>
              <ul>
                <li>your precise location, if you allowed location access, with a session identifier;</li>
                <li>a device identifier (on iPhone a persistent one; on Android a new random one for each event), device model, operating system and mobile carrier;</li>
                <li>how you use the map, and performance and diagnostic data.</li>
              </ul>
              <p>
                No advertising identifiers are collected. Mapbox uses this data, in de-identified form, to improve its maps, produce traffic data and train AI models. Mapbox separates identifiers from location within 24 hours and keeps IP addresses for up to 30 days.
              </p>
              <p>
                Mapbox decides how telemetry data is used and is responsible for it as an independent controller under its own privacy policy. We include the Mapbox SDK under Mapbox's terms, which require telemetry with an opt-out for every user. Our legal basis for including it is our legitimate interest in offering the map (Art. 6(1)(f) GDPR). Mapbox receives your precise location only after you allow location access for Archi2go, and the app names Mapbox when it asks for that permission.
              </p>
              <p>
                To switch it off, tap ⓘ on the map, then Mapbox Telemetry. After that, your location is no longer sent. On iPhone the device identifier may still be sent when the map loads, so switching telemetry off does not stop all data going to Mapbox.
              </p>
              <p>
                Mapbox processes this data partly on our behalf and partly as an independent controller under its own terms: <ExternalLink href="https://www.mapbox.com/legal/privacy">Mapbox privacy policy</ExternalLink>, <ExternalLink href="https://www.mapbox.com/legal/product-terms">Mapbox product terms</ExternalLink>, <ExternalLink href="https://www.mapbox.com/legal/dpa">Mapbox data processing addendum</ExternalLink>. To have Mapbox delete your data, use its <ExternalLink href="https://www.mapbox.com/legal/ccpa-deletion-request">data request form</ExternalLink> or write to <a href="mailto:privacy@mapbox.com">privacy@mapbox.com</a>.
              </p>
            </PolicySubsection>

            <PolicySubsection id="app-photos" title="Photos (Wikimedia Commons, Flickr and Unsplash)">
              <p>
                Place photos load directly from Wikimedia Commons (Wikimedia Foundation, USA) and a few from Flickr (SmugMug, Inc., USA) and Unsplash (Unsplash Inc., Canada), automatically when you open a city, a place or the list of cities. These services receive your IP address, the app's name and version and which photos were loaded, which reveals the city you are viewing. One Flickr photo is in Barcelona, the default city, so Flickr receives a request on almost every new installation.
              </p>
              <p>
                The app neither stores nor sends back their cookies. These services process this data as independent controllers under their own policies: <ExternalLink href="https://foundation.wikimedia.org/wiki/Policy:Privacy_policy">Wikimedia Foundation privacy policy</ExternalLink>, <ExternalLink href="https://www.flickr.com/help/privacy">Flickr privacy policy</ExternalLink>, <ExternalLink href="https://unsplash.com/privacy">Unsplash privacy policy</ExternalLink>. Photos cannot be shown without these requests.
              </p>
            </PolicySubsection>

            <PolicySubsection id="app-location" title="Your location">
              <p>
                Location access is optional. The app works without it, and you can choose a city by hand. The app uses location only while it is open, never in the background, to choose the nearest city each time it starts (unless you open it from a link), to show you on the map and to centre the map on you when you ask.
              </p>
              <p>When the app asks for permission, it tells you that Mapbox may also receive your location and how to turn that off.</p>
              <p>
                Your coordinates are processed on your phone and are never sent to our server or stored by us. Mapbox receives your precise location while telemetry is on (see above). On Android, your location is provided by Google Play services on your phone (Google LLC), under your device's Google location settings and <ExternalLink href="https://policies.google.com/privacy">Google's privacy policy</ExternalLink>.
              </p>
              <p>
                Legal basis: your consent, given when you allow location access. Where other laws require consent for precise location, as in several US states, this is the consent we rely on. You can withdraw it at any time in your phone's settings for Archi2go, and you can stop your location going to Mapbox with the ⓘ button.
              </p>
            </PolicySubsection>

            <PolicySubsection id="app-storage" title="Data stored on your phone">
              <p>
                The app stores the list of cities, copies of the cities you have opened (for offline use), the last city, the 3D setting, the Mapbox telemetry setting, and cached photos and map tiles. This data stays on your phone; on Android it is excluded from device backups. Uninstalling the app deletes all of it.
              </p>
            </PolicySubsection>
          </PolicySection>

          <PolicySection id="recipients">
            <p>We share personal data only with the recipients below and never sell it or use it for advertising.</p>
            <PolicyTable
              labelledBy="recipients-title"
              columns={['Recipient', 'What for', 'Role', 'Where', 'Transfer safeguard']}
              rows={[
                ['IONOS Cloud S.L.U.', 'Hosting our server and our email', 'Processor', 'Spain; servers in the EU', 'Not needed'],
                ['Mapbox, Inc.', 'Map and telemetry', 'Processor and, for telemetry, independent controller', 'USA', 'EU-US Data Privacy Framework'],
                ['Wikimedia Foundation, Inc.', 'Place photos', 'Independent controller', 'USA', 'Your device connects directly; see its policy'],
                ['SmugMug, Inc. (Flickr)', 'Place photos', 'Independent controller', 'USA', 'Your device connects directly; see its policy'],
                ['Unsplash Inc.', 'Place photos', 'Independent controller', 'Canada', 'Your device connects directly; see its policy'],
                ['Google LLC (Android app only)', 'Location services on your phone', 'Independent controller', 'USA', 'EU-US Data Privacy Framework']
              ]}
            />
            <p>
              We only work with recipients that protect personal data at least as well as this policy describes. Those acting for us are bound by data processing agreements and use the data only on our instructions. The others are bound by the GDPR and by their own published policies, linked in this policy.
            </p>
            <p>
              The European Commission recognises the EU-US Data Privacy Framework as giving adequate protection to data transferred to participating US companies.
            </p>
          </PolicySection>

          <PolicySection id="emails">
            <p>
              If you write to us, by email or with the Contact us form on the website or in the app, we receive your email address and your message. The form sends them to the time2map.com server, which passes them on to our mailbox as an email and does not store them. We use them only to reply. Legal basis: our legitimate interests in answering you; for privacy requests, our legal obligation to handle them (Art. 6(1)(c) GDPR). Our email is hosted by IONOS in the EU.
            </p>
          </PolicySection>

          <PolicySection id="retention">
            <PolicyTable
              labelledBy="retention-title"
              columns={['Data', 'Kept for']}
              rows={[
                ['Our server logs', '14 days'],
                ['Emails and contact form messages you send us', '12 months after our last exchange'],
                ['Records of privacy requests', '3 years, to show we handled them'],
                ['Data on your device', 'Until you clear site data or uninstall the app'],
                ['Data held by Mapbox', 'IP addresses up to 30 days; identifiers separated from location within 24 hours'],
                ['Data held by Wikimedia, Flickr, Unsplash and Google', 'As set out in their policies']
              ]}
            />
          </PolicySection>

          <PolicySection id="your-rights">
            <p>
              You can ask us to give you access to your personal data, correct it, delete it, restrict its use or send you a copy in a portable format. Where we rely on your consent, such as for location, you can withdraw it at any time; this does not affect processing before you withdrew.
            </p>
            <p>
              <strong>Right to object.</strong> Where we rely on our legitimate interests (server logs, map and photo requests, Mapbox telemetry), you can object at any time on grounds relating to your situation. For Mapbox telemetry, switching it off in the app takes effect immediately.
            </p>
            <p>
              To make a request, email {contactEmail}. Because Archi2go has no accounts, we can only find your data in our server logs by IP address and time, so please include your IP address and roughly when you used Archi2go. Requests are free. We reply within one month; for complex requests we may extend this by up to two more months and will tell you why.
            </p>
            <p>
              You can also complain to the Spanish Data Protection Agency (<ExternalLink href="https://www.aepd.es">AEPD</ExternalLink>, C/ Jorge Juan 6, 28001 Madrid) or to the data protection authority in your EU country.
            </p>
          </PolicySection>

          <PolicySection id="opt-out">
            <PolicyTable
              labelledBy="opt-out-title"
              columns={['What', 'How']}
              rows={[
                ['Location on the website', "Your browser's site settings"],
                ['Location in the app', "Your phone's settings for Archi2go"],
                ['Mapbox telemetry (app)', 'Tap ⓘ on the map, then Mapbox Telemetry'],
                ['Our server logs', 'Deleted automatically after 14 days; to delete sooner, email us your IP address and the time'],
                ['Data held by Mapbox', <>Mapbox's <ExternalLink href="https://www.mapbox.com/legal/ccpa-deletion-request">data request form</ExternalLink></>],
                ['Data on your device', "Clear the site's data in your browser, or uninstall the app"],
                ['Emails you sent us', 'Ask us to delete them']
              ]}
            />
          </PolicySection>

          <PolicySection id="children">
            <p>
              Archi2go is not directed at children under 16, and we do not knowingly collect their personal data. If you are a parent or guardian and believe your child has sent us personal data, email us and we will delete it.
            </p>
          </PolicySection>

          <PolicySection id="security">
            <p>
              All connections between Archi2go and our server, Mapbox, Wikimedia, Flickr and Unsplash use encrypted HTTPS. We keep as little data as possible: no accounts, and server logs are deleted after 14 days.
            </p>
          </PolicySection>

          <PolicySection id="external-links">
            <p>
              Archi2go links to place sources, architects' and publishers' websites, photo pages and licences, Wikimedia Commons search, time2map.com and Google Maps. They open in your browser only when you tap them, and their own privacy policies apply. Opening a place in Google Maps sends Google the place's coordinates, or its name and city, not your location.
            </p>
          </PolicySection>

          <PolicySection id="changes">
            <p>
              When we change this policy, we update the effective date at the top. Before significant changes take effect, such as collecting new kinds of data or adding recipients, we also announce them on the website and in the app's About screen. Earlier versions are available on request.
            </p>
          </PolicySection>

          <PolicySection id="contact">
            <p>Alexander Semenov, Carrer de Galileu, 142, Sants-Montjuïc, 08028 Barcelona, Spain — {contactEmail}</p>
          </PolicySection>

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
