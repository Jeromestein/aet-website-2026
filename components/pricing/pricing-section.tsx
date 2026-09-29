import { useTranslations } from 'next-intl';
import { certifiedTranslation, evaluationGroups, pricingAnchors, expertOpinion, interpretation, generalTranslation, shipping, pricingPolicy, type PricingSectionId } from '@/lib/pricing';
import { PricingTable } from './pricing-table';
import styles from './pricing.module.css';

export function PricingSection({ section }: { section: PricingSectionId }) {
  const t = useTranslations('pricing');
  const title = t(`sections.${section}`);
  return <section id={pricingAnchors[section]} aria-labelledby={`${section}-title`} className={styles.section}>
    <div className={styles.sectionHeading}><h2 id={`${section}-title`}>{title}</h2><p>{t(`intro.${section}`)}</p></div>
    {section === 'translation' && <>
      <p className={styles.scope}>{t('notes.translationScope')} <a href="https://www.americantranslationservice.com/c_fee.html">{t('chinesePriceList')}</a></p>
      <PricingTable rates={certifiedTranslation} caption={title} />
      <p className={styles.note}>{t('notes.translationQuote')}</p>
    </>}
    {section === 'evaluation' && <>
      {evaluationGroups.map(({ id, rates }) => <div key={id} className={styles.tierGroup}>
        <h3>{t(`services.${id}`)}</h3>
        <PricingTable rates={rates} caption={t(`services.${id}`)} showService={false} />
      </div>)}
      <p className={styles.note}>{t('notes.cutoff', { time: pricingPolicy.sameDayCutoff })}</p>
    </>}
    {section === 'expert' && <PricingTable rates={expertOpinion} caption={title} showService={false} />}
    {section === 'interpretation' && <><PricingTable rates={interpretation} caption={title} showTime={false} showNotes /><p className={styles.note}>{t('notes.interpretation')}</p></>}
    {section === 'general' && <><PricingTable rates={generalTranslation} caption={title} showTime={false} /><p className={styles.note}>{t('notes.general')}</p></>}
    {section === 'shipping' && <>
      <PricingTable rates={shipping} caption={title} showTracking />
      <p className={styles.note}>{t('notes.shipping')}</p>
    </>}
  </section>;
}
