'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n/client';
import { getUiTheme } from '@/lib/architecture-variants';
import type { CvProfile } from '@/lib/cv-content';
import { ContactButton } from '@/components/contact-button';

type Envelope<T> = {
  ok: boolean;
  requestId: string;
  data: T;
};

type EditTarget =
  | { kind: 'personal' }
  | {
      kind: 'section';
      index: number;
    };

type PersonalDraft = {
  fullName: string;
  role: string;
  tagline: string;
  chipsText: string;
};

type SectionDraft = {
  summary: string;
  bulletsText: string;
};

function cloneProfile(profile: CvProfile): CvProfile {
  return {
    fullName: profile.fullName,
    role: profile.role,
    tagline: profile.tagline,
    chips: [...profile.chips],
    sections: profile.sections.map((section) => ({
      id: section.id,
      title: section.title,
      summary: section.summary,
      bullets: [...section.bullets],
    })),
    updatedAt: profile.updatedAt,
  };
}

function toPayload(profile: CvProfile) {
  return {
    fullName: profile.fullName,
    role: profile.role,
    tagline: profile.tagline,
    chips: profile.chips,
    sections: profile.sections.map((section) => ({
      id: section.id,
      title: section.title,
      summary: section.summary,
      bullets: section.bullets,
    })),
  };
}

function parseProfile(payload: Envelope<CvProfile> | CvProfile): CvProfile {
  const data = 'data' in payload ? payload.data : payload;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid CV payload');
  }
  return cloneProfile(data);
}

export function CvProfileView({
  initialProfile,
}: {
  initialProfile: CvProfile;
}) {
  const theme = getUiTheme();
  const { t } = useI18n();
  const [profile, setProfile] = useState<CvProfile>(() => cloneProfile(initialProfile));
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [personalDraft, setPersonalDraft] = useState<PersonalDraft | null>(null);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const firstTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const activeSectionTitle =
    editTarget?.kind === 'section' ? profile.sections[editTarget.index]!.title : null;
  const dialogTitleId = useMemo(
    () => (editTarget?.kind === 'personal' ? 'personal-dialog-title' : 'section-dialog-title'),
    [editTarget?.kind],
  );
  const dialogDescriptionId = useMemo(
    () =>
      editTarget?.kind === 'personal'
        ? 'personal-dialog-description'
        : 'section-dialog-description',
    [editTarget?.kind],
  );

  const openPersonalModal = () => {
    setError(null);
    setSectionDraft(null);
    setPersonalDraft({
      fullName: profile.fullName,
      role: profile.role,
      tagline: profile.tagline,
      chipsText: profile.chips.join('\n'),
    });
    setEditTarget({ kind: 'personal' });
  };

  const openSectionModal = (index: number) => {
    const section = profile.sections[index];
    if (!section) return;
    setError(null);
    setPersonalDraft(null);
    setSectionDraft({
      summary: section.summary,
      bulletsText: section.bullets.join('\n'),
    });
    setEditTarget({ kind: 'section', index });
  };

  const closeModal = () => {
    if (saving) return;
    setEditTarget(null);
    setPersonalDraft(null);
    setSectionDraft(null);
    setError(null);
  };

  const getFocusableElements = (container: HTMLElement | null) => {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length === 0) return;
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

  useEffect(() => {
    if (editTarget) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      const target =
        firstInputRef.current ?? firstTextareaRef.current ?? closeButtonRef.current;
      requestAnimationFrame(() => target?.focus());
      return;
    }
    if (lastFocusedRef.current) {
      requestAnimationFrame(() => lastFocusedRef.current?.focus());
    }
  }, [editTarget]);

  const persistProfile = async (nextProfile: CvProfile) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/cv', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(toPayload(nextProfile)),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const payload = (await response.json()) as Envelope<CvProfile> | CvProfile;
      setProfile(parseProfile(payload));
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const savePersonal = async () => {
    if (!personalDraft) return;

    const nextProfile = cloneProfile(profile);
    nextProfile.fullName = personalDraft.fullName.trim();
    nextProfile.role = personalDraft.role.trim();
    nextProfile.tagline = personalDraft.tagline.trim();
    nextProfile.chips = personalDraft.chipsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    await persistProfile(nextProfile);
  };

  const saveSection = async () => {
    if (editTarget?.kind !== 'section' || !sectionDraft) return;

    const nextProfile = cloneProfile(profile);
    const section = nextProfile.sections[editTarget.index];
    if (!section) return;

    section.summary = sectionDraft.summary.trim();
    section.bullets = sectionDraft.bulletsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    await persistProfile(nextProfile);
  };

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2">
        <article className={`rounded-2xl p-6 md:col-span-2 ${theme.card}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-semibold ${theme.title}`}>{profile.fullName}</h1>
              <p className={`mt-1 text-sm font-semibold ${theme.muted}`}>{profile.role}</p>
              <p className={`mt-3 text-sm leading-relaxed ${theme.text}`}>{profile.tagline}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ContactButton />
              <button
                type="button"
                onClick={openPersonalModal}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.chipPrimary}`}
                aria-label={t('cv.editPersonalAria')}
                aria-haspopup="dialog"
              >
                {t('cv.edit')}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.chips.map((chip) => (
              <span
                key={chip}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chipSecondary}`}
              >
                {chip}
              </span>
            ))}
          </div>
        </article>

        {profile.sections.map((section, index) => (
          <article key={section.id} className={`rounded-2xl p-6 ${theme.card}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className={`text-lg font-semibold ${theme.title}`}>{section.title}</h2>
              <button
                type="button"
                onClick={() => openSectionModal(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.chipPrimary}`}
                aria-label={t('cv.editSectionAria', { section: section.title })}
                aria-haspopup="dialog"
              >
                {t('cv.edit')}
              </button>
            </div>
            <p className={`mt-2 text-sm leading-relaxed ${theme.text}`}>{section.summary}</p>
            <ul className="mt-4 space-y-2">
              {section.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className={`rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ${theme.text}`}
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {editTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onKeyDown={handleDialogKeyDown}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id={dialogTitleId} className="text-lg font-semibold text-slate-900">
                {editTarget.kind === 'personal'
                  ? t('cv.modal.personalTitle')
                  : t('cv.modal.sectionTitle', { section: activeSectionTitle ?? '' })}
              </h3>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
              >
                {t('cv.modal.close')}
              </button>
            </div>

            <p id={dialogDescriptionId} className="sr-only">
              {editTarget.kind === 'personal'
                ? t('cv.modal.personalDescription')
                : t('cv.modal.sectionDescription')}
            </p>

            {error ? (
              <p
                role="alert"
                className="mb-3 rounded-lg bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700"
              >
                {error}
              </p>
            ) : null}

            {editTarget.kind === 'personal' && personalDraft ? (
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-800">
                    {t('cv.modal.fullName')}
                  </span>
                  <input
                    ref={firstInputRef}
                    value={personalDraft.fullName}
                    onChange={(event) =>
                      setPersonalDraft((prev) =>
                        prev ? { ...prev, fullName: event.target.value } : prev,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-800">
                    {t('cv.modal.role')}
                  </span>
                  <input
                    value={personalDraft.role}
                    onChange={(event) =>
                      setPersonalDraft((prev) =>
                        prev ? { ...prev, role: event.target.value } : prev,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-800">
                    {t('cv.modal.tagline')}
                  </span>
                  <textarea
                    value={personalDraft.tagline}
                    onChange={(event) =>
                      setPersonalDraft((prev) =>
                        prev ? { ...prev, tagline: event.target.value } : prev,
                      )
                    }
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-800">
                    {t('cv.modal.chips')}
                  </span>
                  <textarea
                    value={personalDraft.chipsText}
                    onChange={(event) =>
                      setPersonalDraft((prev) =>
                        prev ? { ...prev, chipsText: event.target.value } : prev,
                      )
                    }
                    rows={6}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    {t('cv.modal.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={savePersonal}
                    disabled={saving}
                    className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {saving ? t('cv.modal.saving') : t('cv.modal.save')}
                  </button>
                </div>
              </div>
            ) : null}

            {editTarget.kind === 'section' && sectionDraft ? (
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-800">
                    {t('cv.modal.summary')}
                  </span>
                  <textarea
                    ref={firstTextareaRef}
                    value={sectionDraft.summary}
                    onChange={(event) =>
                      setSectionDraft((prev) =>
                        prev ? { ...prev, summary: event.target.value } : prev,
                      )
                    }
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-800">
                    {t('cv.modal.bullets')}
                  </span>
                  <textarea
                    value={sectionDraft.bulletsText}
                    onChange={(event) =>
                      setSectionDraft((prev) =>
                        prev ? { ...prev, bulletsText: event.target.value } : prev,
                      )
                    }
                    rows={7}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    {t('cv.modal.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={saveSection}
                    disabled={saving}
                    className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    {saving ? t('cv.modal.saving') : t('cv.modal.save')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
