import {educationDetails,serviceDetails} from '@/lib/crm/detail-presentation';
import s from './crm.module.css';

export function EducationHistory({educations}:{educations:unknown[]}) {
  return <div className={s.educationHistory}>{educations.length?educations.map((row,index)=>{
    const education=educationDetails(row);
    return <article className={s.educationHistoryCard} key={index} aria-label={`Education ${index+1}`}><dl>
      <div><dt>School Name</dt><dd>{education.school}</dd></div>
      <div><dt>Country of Study</dt><dd>{education.country}</dd></div>
      <div><dt>Degree Obtained</dt><dd>{education.degree}</dd></div>
      <div><dt>Study Period</dt><dd>{education.period}</dd></div>
    </dl></article>;
  }):<p>No education records found.</p>}</div>;
}
export function SelectedServices({application}:{application:unknown}) {
  const details=serviceDetails(application);
  return <section className={s.selectedServices} aria-label="Selected Services">
    <h3>Selected Services</h3>
    <dl>{details.sections.map((section,index)=><div key={index}><dt>{section.title}</dt>{section.lines.map((line,i)=><dd key={i}>{line}</dd>)}</div>)}</dl>
    <div className={s.serviceTotal}><strong>{details.totalLabel}: {details.totalValue}</strong>
      <p>* This fee applies to most applications but it may vary for some applicants. We will reconfirm your service details during the evaluation process. If any adjustments are needed, we will contact you—any overpayment will be refunded, and underpayment will be collected. Thank you for your trust!</p>
    </div>
  </section>;
}
