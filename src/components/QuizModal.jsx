import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { quiz, contactSection } from '@/data/homepageContent';
import usePresence from '@/hooks/usePresence';
import GlassSurface from './GlassSurface';

// Always mounted by PolishingBanner.jsx now (controlled via `open`) so usePresence can
// delay the actual unmount long enough for an exit animation to play — see that hook's
// comment for why a plain `{open && <QuizModal/>}` never showed a close animation.
export default function QuizModal({ open, onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const dialogRef = useRef(null);
  const { mounted, closing } = usePresence(open, 350);

  const isResult = step >= quiz.questions.length;
  const currentQuestion = quiz.questions[step];

  // Reset back to the first question once the close animation has actually finished —
  // otherwise reopening the quiz would resume mid-way through the last session's answers.
  useEffect(() => {
    if (!mounted) {
      setStep(0);
      setAnswers({});
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return undefined;

    const previouslyFocused = document.activeElement;
    dialogRef.current?.querySelector('button, a')?.focus();
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll('button, a[href]');
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const selectAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    setStep((s) => s + 1);
  };

  return (
    <div
      className={`quiz-modal__backdrop${closing ? ' is-closing' : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <GlassSurface
        as="div"
        className={`quiz-modal glass-surface--calm glass-surface--solid${closing ? ' is-closing' : ''}`}
        contentClassName="quiz-modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-modal-title"
        ref={dialogRef}
      >
        <button type="button" className="quiz-modal__close" onClick={onClose} aria-label="Kapat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Keyed by step/result so React remounts this block on every question change —
            that's what replays the quiz-step-in entrance animation each time (a plain
            conditional swap with no key change wouldn't trigger the CSS animation again). */}
        {!isResult ? (
          <div className="quiz-modal__step-block" key={step}>
            <p className="quiz-modal__step">
              {step + 1} / {quiz.questions.length}
            </p>
            <h2 id="quiz-modal-title" className="quiz-modal__question">
              {t(currentQuestion.question)}
            </h2>
            <ul className="quiz-modal__options">
              {currentQuestion.options.map((opt) => (
                <li key={opt.value}>
                  <button type="button" onClick={() => selectAnswer(opt.value)}>
                    {t(opt.label)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="quiz-modal__result quiz-modal__step-block" key="result">
            <h2 id="quiz-modal-title">{t(quiz.result.title)}</h2>
            <p>{t(quiz.result.body)}</p>
            <a
              className="quiz-modal__whatsapp"
              href={`${contactSection.whatsappHref}?text=${encodeURIComponent(
                'Merhaba, polisaj makinesi anketini tamamladım, ürün önerisi almak istiyorum.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t(quiz.result.cta)}
            </a>
          </div>
        )}
      </GlassSurface>
    </div>
  );
}
