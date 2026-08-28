import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { contactSection } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

// Real telephone-handset glyph (distinct from the WhatsApp mark below — they used to share
// the same outline and were easy to mistake for each other at 18px).
const PHONE_ICON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

// Same real WhatsApp brand mark as WhatsAppFab.jsx (currentColor instead of the hardcoded
// white used there, since this renders directly on the page rather than inside a green
// badge) — was previously a reused/modified phone-icon outline, easy to mistake for it.
const WHATSAPP_ICON = (
  <svg viewBox="0 0 32 32" width="18" height="18" fill="none" aria-hidden="true">
    <path
      fill="currentColor"
      d="M16.02 4C9.4 4 4 9.37 4 15.98c0 2.15.57 4.15 1.56 5.9L4 28l6.28-1.53a11.9 11.9 0 0 0 5.74 1.46h.01c6.62 0 12.01-5.37 12.01-11.98C28.04 9.37 22.65 4 16.02 4Zm0 21.6h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.75.92 1-3.66-.24-.38a9.86 9.86 0 0 1-1.53-5.3c0-5.47 4.46-9.92 9.95-9.92 2.66 0 5.15 1.03 7.03 2.9a9.85 9.85 0 0 1 2.91 7.03c0 5.47-4.46 9.92-9.95 10Z"
    />
    <path
      fill="currentColor"
      d="M22.4 18.68c-.32-.16-1.9-.94-2.2-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.02 1.25-.19.21-.37.24-.7.08-.32-.16-1.35-.5-2.57-1.6-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.22.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.4-.26-.62-.53-.54-.72-.55h-.62c-.21 0-.56.08-.86.4-.29.32-1.12 1.1-1.12 2.68 0 1.58 1.15 3.11 1.31 3.32.16.22 2.26 3.46 5.49 4.85.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.14-.29-.22-.61-.38Z"
    />
  </svg>
);

// Real Facebook brand mark (blue disc + white "f") — bare icons here read as their own
// brand identity, not a monochrome glyph, same as the WhatsApp mark above.
const FACEBOOK_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      d="M15.4 12.5h-2.1V19h-2.7v-6.5H9.1v-2.3h1.5V8.7c0-1.5.9-2.9 3.2-2.9h1.9v2.2h-1.4c-.3 0-.7.2-.7.8v1.5h2.1l-.3 2.2Z"
      fill="#fff"
    />
  </svg>
);

// Real Instagram brand mark (gradient square + camera glyph) — the gradient here is
// Instagram's own brand gradient, not the site's; it's a third-party logo, not UI chrome.
const INSTAGRAM_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <defs>
      <linearGradient id="contact-instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FEDA75" />
        <stop offset="30%" stopColor="#FA7E1E" />
        <stop offset="55%" stopColor="#D62976" />
        <stop offset="80%" stopColor="#962FBF" />
        <stop offset="100%" stopColor="#4F5BD5" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#contact-instagram-gradient)" />
    <circle cx="12" cy="12" r="4.4" stroke="#fff" strokeWidth="1.6" fill="none" />
    <circle cx="17" cy="7" r="1.2" fill="#fff" />
  </svg>
);

const INFO_ICONS = {
  phone: PHONE_ICON,
  facebook: FACEBOOK_ICON,
  instagram: INSTAGRAM_ICON,
  address: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  whatsapp: WHATSAPP_ICON,
};

export default function ContactSection() {
  const { t } = useLanguage();
  const [values, setValues] = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const { form, labels } = contactSection;

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((v) => ({ ...v, [field]: value }));
    // Clear an error the moment its field looks fixed, instead of making the user
    // resubmit to find out — errors otherwise only ever get set on submit below.
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const onSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!values.name.trim()) nextErrors.name = t(form.errors.nameRequired);
    if (!values.phone.trim()) nextErrors.phone = t(form.errors.phoneRequired);
    else if (!/^[+0-9()\s-]{7,}$/.test(values.phone.trim())) nextErrors.phone = t(form.errors.phoneInvalid);
    if (!values.message.trim()) nextErrors.message = t(form.errors.messageRequired);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // No backend — the "submit" is a pre-filled WhatsApp deep link, same channel as
    // every other CTA on the site (see CLAUDE.md: WhatsApp is the sales channel).
    const text = [
      'Merhaba, Vision Detail web sitesindeki iletişim formundan yazıyorum.',
      `Ad Soyad: ${values.name.trim()}`,
      `Telefon: ${values.phone.trim()}`,
      `Mesaj: ${values.message.trim()}`,
    ].join('\n');
    window.open(`${contactSection.whatsappHref}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="contact-section container" id="iletisim">
      <h2 className="contact-section__title" data-reveal>{t(contactSection.title)}</h2>

      <div className="contact-section__grid" data-reveal>
        <div className="contact-section__map">
          <iframe
            className="contact-section__map-frame"
            src={`https://www.google.com/maps?q=${contactSection.mapCoords}&z=16&output=embed`}
            title="Vision Detail konum haritası"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Transparent overlay spanning the whole frame — an iframe is its own browsing
              context, so clicks land inside the embedded map (pan/zoom) instead of bubbling
              to a wrapping link; this catches them and sends the whole map to Google Maps. */}
          <a
            className="contact-section__map-overlay"
            href={contactSection.mapHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(labels.addressCta)}
          />
        </div>

        <GlassSurface
          as="form"
          // --solid (not just --calm's 0.35-opacity base tint): the form's labels/inputs
          // need to stay legible even where backdrop-filter's blur doesn't render (see
          // GlassSurface.scss's --menu note on the mobile-menu/dropdowns) — --calm alone
          // was too faint once blur wasn't there to do the rest of the legibility work.
          className="contact-section__form glass-surface--calm glass-surface--solid"
          contentClassName="contact-section__form-content"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="contact-section__field">
            <label htmlFor="contact-name">{t(form.nameLabel)}</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={setField('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
            />
            {/* Always rendered (not conditionally) — see ContactSection.scss: the space is
                reserved via min-height + opacity so switching into/out of error state never
                grows or shrinks the field, which was pushing the rest of the form down. */}
            <p
              className={`contact-section__error${errors.name ? ' is-visible' : ''}`}
              id="contact-name-error"
              role={errors.name ? 'alert' : undefined}
            >
              {errors.name || ' '}
            </p>
          </div>
          <div className="contact-section__field">
            <label htmlFor="contact-phone">{t(form.phoneLabel)}</label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={setField('phone')}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
            />
            <p
              className={`contact-section__error${errors.phone ? ' is-visible' : ''}`}
              id="contact-phone-error"
              role={errors.phone ? 'alert' : undefined}
            >
              {errors.phone || ' '}
            </p>
          </div>
          <div className="contact-section__field">
            <label htmlFor="contact-message">{t(form.messageLabel)}</label>
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              value={values.message}
              onChange={setField('message')}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
            />
            <p
              className={`contact-section__error${errors.message ? ' is-visible' : ''}`}
              id="contact-message-error"
              role={errors.message ? 'alert' : undefined}
            >
              {errors.message || ' '}
            </p>
          </div>
          <GlassSurface
            as="button"
            type="submit"
            className="contact-section__submit glass-surface--tight glass-surface--solid"
            contentClassName="contact-section__submit-content"
          >
            <span className="btn-glass__label">{t(form.submit)}</span>
          </GlassSurface>
        </GlassSurface>
      </div>

      <ul className="contact-section__info-row" data-reveal>
        <li>
          {/* Whole row is the link now, not just the value text — icon and label are just
              as clickable as the number itself. */}
          <a className="contact-section__info-link" href={`tel:${contactSection.phone.replace(/\s/g, '')}`}>
            <span className="contact-section__info-icon">{INFO_ICONS.phone}</span>
            <span className="contact-section__info-text">
              <span className="contact-section__info-label">{t(labels.phone)}</span>
              <span className="contact-section__info-value">{contactSection.phoneDisplay}</span>
            </span>
          </a>
        </li>
        <li>
          <a
            className="contact-section__info-link"
            href={contactSection.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="contact-section__info-icon contact-section__info-icon--whatsapp">
              {INFO_ICONS.whatsapp}
            </span>
            <span className="contact-section__info-text">
              <span className="contact-section__info-label">WhatsApp</span>
              <span className="contact-section__info-value">{contactSection.phoneDisplay}</span>
            </span>
          </a>
        </li>
        <li>
          <a
            className="contact-section__info-link"
            href={contactSection.instagramHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="contact-section__info-icon">{INFO_ICONS.instagram}</span>
            <span className="contact-section__info-text">
              <span className="contact-section__info-label">{t(labels.instagram)}</span>
              <span className="contact-section__info-value">{contactSection.instagramHandle}</span>
            </span>
          </a>
        </li>
        <li>
          <a
            className="contact-section__info-link"
            href={contactSection.facebookHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="contact-section__info-icon">{INFO_ICONS.facebook}</span>
            <span className="contact-section__info-text">
              <span className="contact-section__info-label">Facebook</span>
              <span className="contact-section__info-value">Vision Detail</span>
            </span>
          </a>
        </li>
      </ul>
    </section>
  );
}
