'use client';

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/i18n/client';
import { getUiTheme } from '@/lib/architecture-variants';

type ContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ContactResponse = {
  ok?: boolean;
  error?: string;
  details?: string;
  data?: {
    accepted?: boolean;
    messageId?: string;
  };
};

const EMPTY_FORM: ContactForm = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export function ContactButton() {
  const theme = getUiTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const getFocusableElements = (container: HTMLElement | null) => {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
  };

  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      const target = firstInputRef.current ?? closeButtonRef.current;
      requestAnimationFrame(() => target?.focus());
      return;
    }

    if (lastFocusedRef.current) {
      requestAnimationFrame(() => lastFocusedRef.current?.focus());
    }
  }, [open]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      if (!submitting) {
        setOpen(false);
        setError(null);
        setSuccess(null);
      }
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const openModal = () => {
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }
    setOpen(false);
    setError(null);
    setSuccess(null);
  };

  const updateField = (field: keyof ContactForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
      pageUrl: window.location.href,
      locale: document.documentElement.lang || undefined,
    };

    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setError(t('contact.modal.errorRequired'));
      setSuccess(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as ContactResponse | null;
      if (!response.ok || !body?.ok || !body.data?.accepted) {
        throw new Error(
          body?.error || body?.details || `Contact request failed: ${response.status}`,
        );
      }

      setForm(EMPTY_FORM);
      setSuccess(t('contact.modal.success'));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t('contact.modal.errorGeneric'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`rounded-full px-4 py-1.5 text-xs font-semibold sm:text-sm ${theme.chipPrimary}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
      >
        {t('contact.button')}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4">
          <div
            ref={dialogRef}
            id={titleId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-label`}
            aria-describedby={descriptionId}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onKeyDown={handleDialogKeyDown}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id={`${titleId}-label`} className="text-lg font-semibold text-slate-900">
                  {t('contact.modal.title')}
                </h2>
                <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                  {t('contact.modal.description')}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
              >
                {t('contact.modal.close')}
              </button>
            </div>

            {error ? (
              <p
                role="alert"
                className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700"
              >
                {error}
              </p>
            ) : null}

            {success ? (
              <p
                role="status"
                className="mb-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700"
              >
                {success}
              </p>
            ) : null}

            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">
                  {t('contact.modal.name')}
                </span>
                <input
                  ref={firstInputRef}
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  maxLength={80}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">
                  {t('contact.modal.email')}
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  maxLength={320}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">
                  {t('contact.modal.subject')}
                </span>
                <input
                  value={form.subject}
                  onChange={(event) => updateField('subject', event.target.value)}
                  maxLength={120}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-800">
                  {t('contact.modal.message')}
                </span>
                <textarea
                  value={form.message}
                  onChange={(event) => updateField('message', event.target.value)}
                  rows={7}
                  maxLength={5000}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                >
                  {t('contact.modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {submitting ? t('contact.modal.sending') : t('contact.modal.send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
