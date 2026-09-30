'use client';

import { useState } from 'react';
import { paymentBankDetails, type PaymentContent, type PaymentOffice } from '@/lib/payment';
import styles from '@/app/[locale]/payment/payment.module.css';

const offices: PaymentOffice[] = ['miami', 'california', 'boston', 'nyc'];

export function ZelleOffices({ copy }: { copy: PaymentContent['alternatives'] }) {
  const [office, setOffice] = useState<PaymentOffice>('miami');
  const [selected, setSelected] = useState(false);
  const details = paymentBankDetails.zelle;
  const recipient = details.offices[office];
  // The source initially shows Chase, then Bank of America after a tab click.
  const bank = selected ? recipient.bank : details.initialBank;
  return <div className={styles.instructionCard}>
    <h3><span aria-hidden="true">🏦 </span>{copy.bankTitle}</h3>
    <p id="zelle-office-label" className={styles.officeLabel}>{copy.selectOffice}</p>
    <div className={styles.officeButtons} role="group" aria-labelledby="zelle-office-label">
      {offices.map(value => <button key={value} type="button" aria-pressed={office === value}
        aria-controls="zelle-bank-info" onClick={() => { setOffice(value); setSelected(true); }}>
        {copy.offices[value]}
      </button>)}
    </div>
    <dl id="zelle-bank-info" className={styles.bankDetails} aria-live="polite" aria-atomic="true">
      <div><dt>{copy.fields['Bank Name']}:</dt><dd>{bank}</dd></div>
      <div><dt>{copy.businessName}</dt><dd>{details.businessName}</dd></div>
      <div><dt>{copy.zelleEmail}</dt><dd><a href={`mailto:${recipient.email}`}>{recipient.email}</a></dd></div>
    </dl>
  </div>;
}
