import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent
} from 'react';
import { Archi2goLogo } from '../Archi2goLogo';
import { Time2mapMark } from '../Time2mapMark';
import { APP_VERSION_LABEL, CONTACT_EMAIL, CONTACT_FORM_ENDPOINT, TIME2MAP_URL } from './config';
import { Icon } from './ui';

const CONTACT_DRAFT_STORAGE_KEY = 'archi2go-contact-draft';

function readContactDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem(CONTACT_DRAFT_STORAGE_KEY) ?? '{}') as {
      email?: unknown;
      comment?: unknown;
      consent?: unknown;
    };
    return {
      email: typeof draft.email === 'string' ? draft.email : '',
      comment: typeof draft.comment === 'string' ? draft.comment : '',
      consent: draft.consent === true
    };
  } catch {
    return { email: '', comment: '', consent: false };
  }
}

export function AppMenu({
  onOpen,
  onAbout,
  onContact
}: {
  onOpen?: () => void;
  onAbout: () => void;
  onContact: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = (restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === 'Tab') {
      close(false);
      return;
    }
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next =
      event.key === 'ArrowDown' ? index + 1
      : event.key === 'ArrowUp' ? index - 1
      : event.key === 'Home' ? 0
      : event.key === 'End' ? items.length - 1
      : null;
    if (next === null || !items.length) return;
    event.preventDefault();
    items[(next + items.length) % items.length].focus();
  };

  return (
    <div
      ref={rootRef}
      className={`v2-app-menu${isOpen ? ' is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="v2-app-menu-trigger"
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen) return close(false);
          setIsOpen(true);
          onOpen?.();
        }}>
        <Icon name="menu" />
      </button>
      {isOpen ? (
        <div
          ref={menuRef}
          className="v2-app-menu-list"
          role="menu"
          aria-label="Archi2go"
          onKeyDown={onMenuKeyDown}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onAbout();
            }}>
            About Archi2go
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onContact();
            }}>
            Contact us
          </button>
          <a
            role="menuitem"
            href="/privacy">
            Privacy policy
          </a>
          <a
            role="menuitem"
            href={TIME2MAP_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => close(false)}>
            time2map.com
            <Icon name="external" />
          </a>
          <p className="v2-app-menu-version">{APP_VERSION_LABEL}</p>
        </div>
      ) : null}
    </div>
  );
}

export function AboutDialog({ onClose, onContact }: { onClose: () => void; onContact: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="v2-about"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <section
        className="v2-about-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v2-about-title">
        <button
          ref={closeRef}
          type="button"
          className="v2-about-close"
          aria-label="Close"
          onClick={onClose}>
          <Icon name="close" />
        </button>
        <Archi2goLogo />
        <p className="v2-about-eyebrow">Independent city guides</p>
        <h2 id="v2-about-title">Good places, with a reason to go.</h2>
        <p>
          Archi2go gathers architecture, public spaces and unusual city stories into one concise map. Every place is
          thoughtfully selected, researched and presented with a clear reason to visit.
        </p>
        <dl className="v2-about-facts">
          <div>
            <dt>Photos</dt>
            <dd>Wikimedia Commons, credited on each photo</dd>
          </div>
          <div>
            <dt>Map</dt>
            <dd>© Mapbox © OpenStreetMap contributors</dd>
          </div>
        </dl>
        <div className="v2-about-actions">
          <button
            type="button"
            className="v2-about-primary"
            onClick={onContact}>
            <Icon name="message" />
            Contact us
          </button>
          <a href="/privacy">Privacy policy</a>
        </div>
        <footer className="v2-about-footer">
          <a
            className="v2-time2map"
            href={TIME2MAP_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="time2map — Maps and GIS solutions">
            <span aria-hidden="true">by</span>
            <Time2mapMark className="v2-time2map-mark" />
            <span>time2map</span>
          </a>
        </footer>
      </section>
    </div>
  );
}

export function ContactDialog({ onClose }: { onClose: () => void }) {
  const initialDraft = useRef(readContactDraft()).current;
  const closeRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState(initialDraft.email);
  const [comment, setComment] = useState(initialDraft.comment);
  const [consent, setConsent] = useState(initialDraft.consent);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; comment?: string; consent?: string }>({});
  const [status, setStatus] = useState<{ kind: 'idle' | 'sending' | 'success' | 'error'; message?: string }>({
    kind: 'idle'
  });

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Enter your email address.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Enter a valid email address.';
  };

  const validateComment = (value: string) =>
    value.trim().length >= 10 ? undefined : 'Add a little more detail (at least 10 characters).';

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    emailRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CONTACT_DRAFT_STORAGE_KEY, JSON.stringify({ email, comment, consent }));
  }, [comment, consent, email]);

  const onDialogKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [
      ...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, textarea, a[href]') ?? [])
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = {
      email: validateEmail(email),
      comment: validateComment(comment),
      consent: consent ? undefined : 'Please confirm that we may use your details to reply.'
    };
    setErrors(nextErrors);
    if (nextErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (nextErrors.comment) {
      commentRef.current?.focus();
      return;
    }
    if (nextErrors.consent) {
      consentRef.current?.focus();
      return;
    }

    const form = event.currentTarget;
    const website = new FormData(form).get('website');
    setStatus({ kind: 'sending' });

    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'fetch'
        },
        body: JSON.stringify({
          name: 'Archi2go visitor',
          email: email.trim(),
          budget: 'Not applicable — Archi2go',
          message: comment.trim(),
          privacy: consent,
          website: typeof website === 'string' ? website : ''
        })
      });

      if (response.ok) {
        sessionStorage.removeItem(CONTACT_DRAFT_STORAGE_KEY);
        setEmail('');
        setComment('');
        setConsent(false);
        setSubmitted(false);
        setErrors({});
        setStatus({ kind: 'success', message: 'Thanks! Your message has been sent.' });
      } else if (response.status === 422) {
        setStatus({ kind: 'error', message: 'Please check the form and try again.' });
      } else if (response.status === 429) {
        setStatus({ kind: 'error', message: 'Too many attempts. Please try again in a few minutes.' });
      } else {
        setStatus({ kind: 'error', message: 'Something went wrong. Please try again or email us.' });
      }
    } catch {
      setStatus({ kind: 'error', message: 'Network error. Please try again or email us.' });
    }
  };

  const directEmailHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Archi2go contact')}&body=${encodeURIComponent(
    `From: ${email.trim()}\n\n${comment.trim()}`
  )}`;
  const contactReturnUrl = new URL(window.location.href);
  contactReturnUrl.searchParams.set('contact', '1');
  const privacyHref = `/privacy?return=${encodeURIComponent(
    `${contactReturnUrl.pathname}${contactReturnUrl.search}${contactReturnUrl.hash}`
  )}`;

  return (
    <div
      className="v2-about v2-contact"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}>
      <section
        ref={dialogRef}
        className="v2-about-card v2-contact-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="v2-contact-title"
        aria-describedby="v2-contact-description"
        onKeyDown={onDialogKeyDown}>
        <button
          ref={closeRef}
          type="button"
          className="v2-about-close"
          aria-label="Close contact form"
          onClick={onClose}>
          <Icon name="close" />
        </button>

        <p className="v2-about-eyebrow">Contact Archi2go</p>
        <h2 id="v2-contact-title">Tell us what’s on your mind.</h2>
        <p id="v2-contact-description">
          Questions, corrections and ideas are welcome. Add a short note and we’ll get back to you as soon as possible.
        </p>

        <form
          className="v2-contact-form"
          noValidate
          onSubmit={submit}>
          <label htmlFor="v2-contact-email">Email</label>
          <input
            ref={emailRef}
            id="v2-contact-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby="v2-contact-email-error"
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
            }}
            onBlur={() => {
              if (email.trim() || submitted) {
                setErrors((current) => ({ ...current, email: validateEmail(email) }));
              }
            }}
          />
          <span
            id="v2-contact-email-error"
            className="v2-contact-error"
            aria-live="polite">
            {errors.email ?? ''}
          </span>

          <label htmlFor="v2-contact-comment">Comment</label>
          <textarea
            ref={commentRef}
            id="v2-contact-comment"
            name="comment"
            rows={5}
            required
            value={comment}
            aria-invalid={Boolean(errors.comment)}
            aria-describedby="v2-contact-comment-error"
            onChange={(event) => {
              setComment(event.target.value);
              if (errors.comment) setErrors((current) => ({ ...current, comment: undefined }));
            }}
            onBlur={() => {
              if (comment.trim() || submitted) {
                setErrors((current) => ({ ...current, comment: validateComment(comment) }));
              }
            }}
          />
          <span
            id="v2-contact-comment-error"
            className="v2-contact-error"
            aria-live="polite">
            {errors.comment ?? ''}
          </span>

          <label className="v2-contact-consent">
            <input
              ref={consentRef}
              type="checkbox"
              name="privacy"
              required
              checked={consent}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby="v2-contact-consent-error"
              onChange={(event) => {
                setConsent(event.target.checked);
                if (errors.consent) setErrors((current) => ({ ...current, consent: undefined }));
              }}
            />
            <span>
              I agree that time2map may use these details to respond to my inquiry. <a href={privacyHref}>Privacy policy</a>.
            </span>
          </label>
          <span
            id="v2-contact-consent-error"
            className="v2-contact-error"
            aria-live="polite">
            {errors.consent ?? ''}
          </span>

          <input
            className="v2-contact-honeypot"
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <button
            type="submit"
            className="v2-contact-submit"
            disabled={status.kind === 'sending'}>
            {status.kind === 'sending' ? 'Sending…' : 'Send message'}
            <Icon name="arrow-up-right" />
          </button>
          <div
            className={`v2-contact-status${status.kind === 'success' ? ' is-success' : ''}${status.kind === 'error' ? ' is-error' : ''}`}
            role="status"
            aria-live="polite">
            {status.message ?? ''}
            {status.kind === 'error' ? (
              <>
                {' '}
                <a href={directEmailHref}>Email {CONTACT_EMAIL} directly.</a>
              </>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
