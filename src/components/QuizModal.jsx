import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { quiz, contactSection } from '@/data/homepageContent';
import GlassSurface from './GlassSurface';

export default function QuizModal({ onClose }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const dialogRef = useRef(null);

  const isResult = step >= quiz.questions.length;
  const currentQuestion = quiz.questions[step];

  useEffect(() => {
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
  }, [onClose]);

  const selectAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    setStep((s) => s + 1);
  };

  return (
    <div className="quiz-modal__backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <GlassSurface
        as="div"
        className="quiz-modal glass-surface--calm glass-surface--solid"
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

        {!isResult ? (
          <>
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
          </>
        ) : (
          <div className="quiz-modal__result">
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
