'use client';

import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, ClipboardCheck, FileCheck2, GraduationCap, Info, Languages, Mail, MessageCircle, Pencil, Plus, RotateCcw, Save, Upload, UserRound } from 'lucide-react';
import { applicationCopy } from '@/lib/application/copy';
import { DRAFT_KEY, emptyEducation, initialDraft, restoreDraft, selectService, serviceIds, serviceOffices, validateStep, type ApplicationDraft, type EducationDraft, type FormErrors, type ServiceId } from '@/lib/application/model';
import { countryLabel, countryOptions } from '@/lib/legacy-application/countries';
import type { Locale } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import s from './application.module.css';

function Field({ id, label, requiredMark, optional, hint, error, children }: { id: string; label: string; requiredMark?: boolean; optional?: string; hint?: string; error?: string; children: ReactNode }) {
  return <div className={s.field}>
    <label htmlFor={id}>{label}{requiredMark && <span className={s.requiredMark} aria-hidden="true">*</span>}{optional && <span>{optional}</span>}</label>
    {children}
    {hint && <p className={s.hint} id={id + '-hint'}>{hint}</p>}
    {error && <p className={s.fieldError} id={id + '-error'}>{error}</p>}
  </div>;
}

export function GeneralApplication({ locale, initialService }: { locale: Locale; initialService: ServiceId | '' }) {
  const c = applicationCopy[locale];
  const [data, setData] = useState<ApplicationDraft>(() => initialDraft(initialService));
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [restored, setRestored] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [officeChanged, setOfficeChanged] = useState(false);
  const [clearing, setClearing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const clearConfirm = useRef<HTMLButtonElement>(null);
  const countries = countryOptions(locale);
  const years = Array.from({ length: new Date().getUTCFullYear() - 1900 + 6 }, (_, index) => String(new Date().getUTCFullYear() + 5 - index));
  const labels = [c.step0, c.step1, c.step2];
  const titles = [c.heading0, c.heading1, c.heading2];
  const intros = [c.intro0, c.intro1, c.intro2];
  const services = {
    'pre-evaluation': { title: c.preeval, description: c.preevalDescription, icon: GraduationCap },
    evaluation: { title: c.evaluation, description: c.evaluationDescription, icon: FileCheck2 },
    translation: { title: c.translation, description: c.translationDescription, icon: Languages },
  };
  const officeNames: Record<string, string> = { miami: c.miami, boston: c.boston, la: c.la, sf: c.sf, nyc: c.nyc };
  const purposes = [{ value: 'uscis', label: c.purposeUscis }, { value: 'education', label: c.purposeEducation }, { value: 'employment', label: c.purposeEmployment }, { value: 'other', label: c.purposeOther }];
  const reports = [{ value: 'document', label: c.document }, { value: 'course', label: c.course }, { value: 'expert', label: c.expert }, { value: 'unsure', label: c.unsure }];
  const translations = [{ value: 'certified', label: c.certified }, { value: 'general', label: c.general }, { value: 'technical', label: c.technical }, { value: 'unsure', label: c.unsure }];
  const errorText = { required: c.required, email: c.invalidEmail, phone: c.invalidPhone, date: c.invalidDate, dateOrder: c.invalidOrder, country: c.invalidCountry, languages: c.invalidLanguages, office: c.invalidOffice };

  useEffect(() => {
    try {
      const draft = restoreDraft(sessionStorage.getItem(DRAFT_KEY) || '');
      if (draft) {
        const changed = initialService && initialService !== draft.data.service;
        setData(changed ? selectService(draft.data, initialService) : draft.data);
        setStep(changed ? 0 : draft.step); setRestored(true);
      }
    } catch { /* Draft storage is optional; the form still works without it. */ }
    setReady(true);
  }, [initialService]);
  useEffect(() => {
    if (!ready) return;
    try {
      if (!data.contactName && !data.email && !data.phone && !data.service) {
        sessionStorage.removeItem(DRAFT_KEY); setSaved(false); return;
      }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, updatedAt: Date.now(), data, step })); setSaved(true);
    } catch { setSaved(false); }
  }, [data, step, ready]);
  useEffect(() => { if (clearing) clearConfirm.current?.focus(); }, [clearing]);

  function update(key: keyof ApplicationDraft, value: string) {
    setData(current => ({ ...current, [key]: value }));
    setErrors(current => { const next = { ...current }; delete next[key]; return next; });
  }
  function updateEducation(index: number, key: keyof EducationDraft, value: string) {
    setData(current => ({ ...current, educations: current.educations.map((education, i) => i === index ? { ...education, [key]: value } : education) }));
    setErrors(current => { const next = { ...current }; delete next['education.' + index + '.' + key]; return next; });
  }
  function chooseService(service: ServiceId) {
    const next = selectService(data, service);
    setOfficeChanged(Boolean(data.office && !next.office)); setData(next); setErrors({});
    const url = new URL(window.location.href); url.searchParams.set('service', service);
    window.history.replaceState(window.history.state, '', url);
  }
  function navigate(target: number) {
    if (target < 0 || target > 2) return;
    if (target > step) {
      for (let index = 0; index < target; index++) {
        const found = validateStep(data, index);
        if (Object.keys(found).length) {
          setErrors(found); setStep(index);
          requestAnimationFrame(() => errorBox.current?.focus()); return;
        }
      }
    }
    setErrors({}); setStep(target); setRestored(false);
    requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); });
  }
  function reset() {
    setData(initialDraft()); setStep(0); setErrors({}); setClearing(false); setRestored(false); setOfficeChanged(false);
    const url = new URL(window.location.href); url.searchParams.delete('service');
    window.history.replaceState(window.history.state, '', url);
    requestAnimationFrame(() => heading.current?.focus());
  }
  const accessibility = (id: string, hint?: string) => ({
    id, name: id, 'aria-invalid': Boolean(errors[id]),
    'aria-describedby': [hint ? id + '-hint' : '', errors[id] ? id + '-error' : ''].filter(Boolean).join(' ') || undefined,
  });
  const input = (key: keyof ApplicationDraft, label: string, options: InputHTMLAttributes<HTMLInputElement> & { requiredMark?: boolean; optional?: boolean; hint?: string } = {}) => {
    const { requiredMark, optional, hint, ...props } = options;
    return <Field id={key} label={label} requiredMark={requiredMark} optional={optional ? c.optional : undefined} hint={hint} error={errors[key] && errorText[errors[key]]}>
      <input {...props} {...accessibility(key, hint)} required={!optional} maxLength={300} value={data[key] as string} onChange={event => update(key, event.target.value)} />
    </Field>;
  };
  const select = (key: 'purpose' | 'evaluationType' | 'translationType', label: string, placeholder: string, options: { value: string; label: string }[]) => <Field id={key} label={label} error={errors[key] && errorText[errors[key]]}>
    <select {...accessibility(key)} value={data[key]} required onChange={event => update(key, event.target.value)}><option value="">{placeholder}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
  </Field>;
  const reviewRow = (label: string, value: string) => <div><dt>{label}</dt><dd>{value || '—'}</dd></div>;
  const activeEducations = data.service === 'pre-evaluation' ? data.educations.slice(0, 1) : data.educations;

  return <div className={s.shell}>
    <div className={s.introduction}><p className={s.eyebrow}>{c.eyebrow}</p><h1>{c.title}</h1><p>{c.intro}</p></div>
    <div className={s.preview}><Info size={17} aria-hidden="true" /><p><strong>{c.preview}</strong><span>{c.previewNote}</span></p></div>
    <nav className={s.steps} aria-label={c.progress}><ol>{labels.map((label, index) => <li key={label} className={index === step ? s.currentStep : index < step ? s.completedStep : ''}>
      <button type="button" onClick={() => navigate(index)} aria-current={index === step ? 'step' : undefined} disabled={!ready}>
        <span className={s.stepNumber}>{index < step ? <Check size={19} aria-hidden="true" /> : index + 1}</span><span>{label}</span>
      </button>
    </li>)}</ol></nav>
    <div className={s.layout}>
      <form className={s.form} noValidate onSubmit={event => { event.preventDefault(); if (step < 2) navigate(step + 1); }}>
        <div className={s.formHeading}><div><p className={s.stepCaption}>{c.stepOf} {step + 1} {c.of} 3</p><h2 ref={heading} tabIndex={-1}>{titles[step]}</h2><p>{intros[step]}</p></div><span className={s.headingIcon}>{step === 0 ? <UserRound aria-hidden="true" /> : step === 1 ? <Pencil aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}</span></div>
        <fieldset className={s.fields} disabled={!ready}>
          <legend className={s.srOnly}>{labels[step]}</legend>
          {Object.keys(errors).length > 0 && <div ref={errorBox} tabIndex={-1} className={s.errorBox} role="alert">{c.errorIntro}</div>}
          {restored && <p className={s.restored} role="status"><RotateCcw size={15} aria-hidden="true" />{c.restored}</p>}
          {step === 0 && <>
            <section className={s.section} aria-labelledby="contact-title"><h3 id="contact-title">{c.contactHeading}</h3>
              {input('contactName', c.contactName, { requiredMark: true, placeholder: c.contactPlaceholder, autoComplete: 'organization' })}
              <div className={s.grid}>{input('email', c.email, { requiredMark: true, type: 'email', autoComplete: 'email', placeholder: c.emailPlaceholder, hint: c.emailHint })}{input('phone', c.phone, { requiredMark: true, type: 'tel', autoComplete: 'tel', placeholder: c.phonePlaceholder, hint: c.phoneHint })}</div>
            </section>
            <fieldset className={s.section}><legend className={s.sectionLegend}>{c.serviceHeading}</legend><p className={s.sectionHint}>{c.serviceHint}</p>
              <div className={s.services}>{serviceIds.map(id => { const service = services[id]; const Icon = service.icon; return <label key={id} className={s.service + (data.service === id ? ' ' + s.selected : '')}>
                <input type="radio" name="service" value={id} checked={data.service === id} onChange={() => chooseService(id)} aria-describedby={errors.service ? 'service-error' : undefined} />
                <span className={s.serviceTop}><Icon size={24} strokeWidth={1.6} aria-hidden="true" /><span className={s.radioMark}>{data.service === id && <Check size={13} strokeWidth={3} aria-hidden="true" />}</span></span>
                <strong>{service.title}</strong><span className={s.serviceDescription}>{service.description}</span>
              </label>; })}</div>
              {errors.service && <p className={s.fieldError} id="service-error">{errorText[errors.service]}</p>}
            </fieldset>
            <div className={s.officeSection}>
              <Field id="office" label={c.officeHeading} hint={data.service ? c.officeHint : c.officeEmpty} error={errors.office && errorText[errors.office]}>
                <select {...accessibility('office', data.service ? c.officeHint : c.officeEmpty)} required disabled={!data.service} value={data.office} onChange={event => { update('office', event.target.value); setOfficeChanged(false); }}>
                  <option value="">{c.select}</option>
                  {data.service && serviceOffices[data.service].map(office => <option key={office} value={office}>{officeNames[office]}</option>)}
                </select>
              </Field>
              {officeChanged && <p className={s.fieldError} role="status">{c.officeChanged}</p>}
            </div>
          </>}
          {step === 1 && <>
            <div className={s.selectedService}><span>{data.service && services[data.service].title}</span><button type="button" onClick={() => navigate(0)}>{c.edit}<Pencil size={13} aria-hidden="true" /></button></div>
            {data.service === 'translation' ? <section className={s.section}>
              <div className={s.grid}>{input('sourceLanguage', c.sourceLanguage, { placeholder: c.sourcePlaceholder })}{input('targetLanguage', c.targetLanguage, { placeholder: c.targetPlaceholder })}</div>
              {select('translationType', c.translationType, c.translationSelect, translations)}
            </section> : <>
              <section className={s.section}><h3>{c.personHeading}</h3><p className={s.sectionHint}>{c.personHint}</p><div className={s.nameGrid}>
                {input('firstName', c.firstName, { autoComplete: 'off' })}{input('middleName', c.middleName, { optional: true, autoComplete: 'off' })}{input('lastName', c.lastName, { autoComplete: 'off' })}
              </div></section>
              {data.service === 'evaluation' && <div className={s.grid}>{select('evaluationType', c.reportType, c.reportSelect, reports)}{select('purpose', c.purpose, c.purposeSelect, purposes)}</div>}
              <section className={s.section}><h3>{c.educationHeading}</h3><p className={s.sectionHint}>{c.educationHint}</p>
                {activeEducations.map((education, index) => <fieldset className={s.education} key={index}><legend>{c.educationRecord} {index + 1}</legend>
                  <div className={s.grid}>{(['school', 'country', 'degree', 'start', 'end'] as const).map(key => {
                    const id = 'education.' + index + '.' + key;
                    const label = { school: c.school, country: c.studyCountry, degree: c.degree, start: c.start, end: c.end }[key];
                    return <Field key={key} id={id} label={label} error={errors[id] && errorText[errors[id]]}>{key === 'country' ?
                      <select {...accessibility(id)} required value={education[key]} onChange={event => updateEducation(index, key, event.target.value)}><option value="">{c.select}</option>{countries.map(country => <option key={country.value} value={country.value}>{country.label}</option>)}</select> :
                      key === 'start' || key === 'end' ? <div className={s.monthSelect}>
                        <select {...accessibility(id)} aria-label={label + ' · ' + c.year} required value={education[key].split('-')[0] || ''} onChange={event => updateEducation(index, key, event.target.value + '-' + (education[key].split('-')[1] || ''))}><option value="">{c.year}</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select>
                        <select {...accessibility(id)} id={id + '-month'} name={id + '-month'} aria-label={label + ' · ' + c.month} required value={education[key].split('-')[1] || ''} onChange={event => updateEducation(index, key, (education[key].split('-')[0] || '') + '-' + event.target.value)}><option value="">{c.month}</option>{Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map(month => <option key={month} value={month}>{month}</option>)}</select>
                      </div> : <input {...accessibility(id)} required maxLength={300} placeholder={key === 'school' ? c.schoolPlaceholder : c.degreePlaceholder} value={education[key]} onChange={event => updateEducation(index, key, event.target.value)} />}
                    </Field>;
                  })}</div>
                  {index > 0 && <button type="button" className={s.textButton} onClick={() => { setData(current => ({ ...current, educations: current.educations.filter((_, i) => i !== index) })); setErrors({}); }}>{c.remove} {c.educationRecord} {index + 1}</button>}
                </fieldset>)}
                {data.service === 'evaluation' && <button className={s.secondary} type="button" disabled={data.educations.length >= 10} onClick={() => setData(current => ({ ...current, educations: [...current.educations, emptyEducation()] }))}><Plus size={17} aria-hidden="true" />{c.addEducation}</button>}
              </section>
              {data.service === 'pre-evaluation' && <p className={s.inlineNote}><Info size={17} aria-hidden="true" />{c.preevalNote}</p>}
            </>}
            <Field id="notes" label={c.notes} optional={c.optional}><textarea id="notes" name="notes" rows={4} maxLength={3000} placeholder={c.notesPlaceholder} value={data.notes} onChange={event => update('notes', event.target.value)} /></Field>
            <div className={s.uploadLater}><Upload size={19} aria-hidden="true" /><div><strong>{c.documentsNotice}</strong><p>{c.uploadLater}</p></div></div>
          </>}
          {step === 2 && <>
            <section className={s.reviewSection}><div className={s.reviewHeading}><h3>{c.contactHeading}</h3><button type="button" onClick={() => navigate(0)} aria-label={c.edit + ' · ' + c.contactHeading}>{c.edit}<Pencil size={14} aria-hidden="true" /></button></div><dl className={s.reviewGrid}>
              {reviewRow(c.contactName, data.contactName)}{reviewRow(c.email, data.email)}{reviewRow(c.phone, data.phone)}{reviewRow(c.officeLabel, officeNames[data.office])}
            </dl></section>
            <section className={s.reviewSection}><div className={s.reviewHeading}><h3>{c.detailsLabel}</h3><button type="button" onClick={() => navigate(1)} aria-label={c.edit + ' · ' + c.detailsLabel}>{c.edit}<Pencil size={14} aria-hidden="true" /></button></div>
              <dl className={s.reviewGrid}>{reviewRow(c.serviceLabel, data.service ? services[data.service].title : '')}
                {data.service === 'translation' ? <>{reviewRow(c.translationType, translations.find(item => item.value === data.translationType)?.label || '')}{reviewRow(c.sourceLanguage, data.sourceLanguage)}{reviewRow(c.targetLanguage, data.targetLanguage)}</> : <>
                  {reviewRow(c.personHeading, [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' '))}
                  {data.service === 'evaluation' && <>{reviewRow(c.reportType, reports.find(item => item.value === data.evaluationType)?.label || '')}{reviewRow(c.purpose, purposes.find(item => item.value === data.purpose)?.label || '')}</>}
                </>}
              </dl>
              {data.service !== 'translation' && activeEducations.map((education, index) => <div key={index} className={s.reviewEducation}><GraduationCap size={22} aria-hidden="true" /><div><strong>{education.degree}</strong><p>{education.school} · {countryLabel(education.country, locale)}</p><small>{education.start} — {education.end}</small></div></div>)}
              {data.notes.trim() && <dl className={s.notesReview}>{reviewRow(c.notes, data.notes)}</dl>}
            </section>
            <div className={s.afterConfirmation}><h3>{c.laterTitle}</h3><p><Mail size={19} aria-hidden="true" />{c.laterEmail}</p><p><Upload size={19} aria-hidden="true" />{c.laterFiles}</p></div>
          </>}
        </fieldset>
        <div className={s.actions}>
          {step > 0 ? <button type="button" className={s.back} onClick={() => navigate(step - 1)}><ArrowLeft size={17} aria-hidden="true" />{c.back}</button> : <span className={s.stepCounter}>{c.stepOf} 1 {c.of} 3</span>}
          <button className={s.primary} type="submit" disabled={!ready || step === 2} aria-describedby={step === 2 ? 'submission-note' : undefined}>{step === 2 ? c.submit : step === 1 ? c.review : c.next}<ArrowRight size={18} aria-hidden="true" /></button>
        </div>
        {step === 2 && <p className={s.submissionNote} id="submission-note">{c.notConnected}</p>}
        <div className={s.draftBar}><span><Save size={14} aria-hidden="true" />{saved ? c.saved : c.notSaved}</span><button ref={clearButton} type="button" disabled={!ready} onClick={() => setClearing(true)}>{c.clear}</button></div>
        {clearing && <div className={s.clearPanel} role="group" aria-label={c.clearQuestion}><p>{c.clearQuestion}</p><button ref={clearConfirm} type="button" className={s.secondary} onClick={reset}>{c.clearConfirm}</button><button type="button" className={s.textButton} onClick={() => { setClearing(false); clearButton.current?.focus(); }}>{c.cancel}</button></div>}
      </form>
      <aside className={s.aside}>
        <section className={s.summary}><div className={s.summaryHeading}><ClipboardCheck size={22} strokeWidth={1.6} aria-hidden="true" /><h2>{c.summary}</h2></div>
          <dl>{reviewRow(c.serviceLabel, data.service ? services[data.service].title : c.notSelected)}{reviewRow(c.officeLabel, data.office ? officeNames[data.office] : c.notSelected)}{reviewRow(c.contactLabel, data.contactName.trim() || c.notEntered)}</dl>
          <p className={s.summaryNote}>{c.summaryNote}</p>
          <ol className={s.miniSteps}>{labels.map((label, index) => <li key={label} className={index <= step ? s.miniActive : ''}><span>{index < step ? <Check size={13} aria-hidden="true" /> : index + 1}</span>{label}</li>)}</ol>
        </section>
        <section className={s.help}><MessageCircle size={22} strokeWidth={1.6} aria-hidden="true" /><h3>{c.helpTitle}</h3><p>{c.helpBody}</p><a href={getPathname({ locale, href: '/contact' })} target="_blank" rel="noreferrer">{c.contactUs}<ChevronRight size={16} aria-hidden="true" /></a></section>
      </aside>
    </div>
  </div>;
}
