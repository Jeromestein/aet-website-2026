import { useTranslations } from 'next-intl';
import { visaServiceRates, visaExternalRates, visaPhotoRates } from '@/lib/pricing';
import { PricingTable } from './pricing-table';
import styles from './pricing.module.css';

export function VisaPricing() {
  const t = useTranslations('pricing');
  return <>
    {([['service', visaServiceRates], ['external', visaExternalRates], ['photo', visaPhotoRates]] as const).map(([group, rates]) => <div className={styles.visaGroup} key={group}>
      <h3>{t(`visaGroups.${group}`)}</h3>
      <PricingTable rates={rates} caption={t(`visaGroups.${group}`)} showTime={false} showNotes={group === 'service'} />
    </div>)}
    <p className={styles.note}>{t('notes.visaDisclaimer')}</p>
  </>;
}
