// Fictional fixtures for the UI preview. Never use these records as live business data.
export type Stage = 'submitted' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type DocumentStatus = 'Received' | 'Reviewed' | 'Missing';
export type Office = 'Boston' | 'New York' | 'Miami' | 'Los Angeles' | 'San Francisco';
export type Service = 'Document by Document' | 'Course by Course' | 'Certified Translation' | 'Expert Opinion Letter' | 'Pre-Evaluation';

export interface Education {
  degree: string;
  school: string;
  country: string;
  start: string;
  end: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  office: Office;
  service: Service;
  purpose: string;
  country: string;
  educations: Education[];
  stage: Stage;
  payment: PaymentStatus;
  amount: number;
  updated: string;
  due: string;
  documents: { name: string; status: DocumentStatus }[];
  notes: string;
}

export interface PaymentRequest {
  id: string;
  applicationId: string;
  amount: number;
  status: 'Draft' | 'Pending' | 'Paid';
  method: string;
}

export const offices: Office[] = ['Boston', 'New York', 'Miami', 'Los Angeles', 'San Francisco'];
export const officeCodes: Record<Office, string> = { Boston: 'BOS', 'New York': 'NYC', Miami: 'MIA', 'Los Angeles': 'LA', 'San Francisco': 'SF' };
export const services: Service[] = ['Document by Document', 'Course by Course', 'Certified Translation', 'Expert Opinion Letter', 'Pre-Evaluation'];
export const stageLabels: Record<Stage, string> = { submitted: 'Submitted', processing: 'In progress', completed: 'Completed', cancelled: 'Cancelled' };
export const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
export const needsAttention = (row: Application) => !['completed', 'cancelled'].includes(row.stage) && (row.payment === 'pending' || row.documents.some(doc => doc.status !== 'Reviewed'));

const documents = (state: 'complete' | 'review' | 'missing'): Application['documents'] => [
  { name: 'Diploma.pdf', status: state === 'review' ? 'Received' : 'Reviewed' },
  { name: 'Transcript.pdf', status: state === 'missing' ? 'Missing' : state === 'review' ? 'Received' : 'Reviewed' },
];

export const demoApplications: Application[] = [
  { id: 'AET-1048', name: 'Olivia Chen', email: 'olivia.chen@example.com', office: 'Boston', service: 'Course by Course', purpose: 'Education', country: 'China', educations: [{ degree: 'Master’s degree', school: 'Sample Graduate University', country: 'China', start: '2018-09', end: '2020-06' }, { degree: 'Bachelor’s degree', school: 'Sample University', country: 'China', start: '2014-09', end: '2018-06' }], stage: 'submitted', payment: 'paid', amount: 250, updated: '2026-10-01', due: 'Oct 08', documents: documents('review'), notes: 'Sample: documents are ready for an initial review.' },
  { id: 'AET-1047', name: 'Mateo Garcia', email: 'mateo.garcia@example.com', office: 'Miami', service: 'Certified Translation', purpose: 'Immigration', country: 'Colombia', educations: [], stage: 'submitted', payment: 'pending', amount: 120, updated: '2026-10-01', due: 'Oct 06', documents: documents('complete'), notes: 'Sample: quote approved; awaiting payment.' },
  { id: 'AET-1046', name: 'Priya Sharma', email: 'priya.sharma@example.com', office: 'New York', service: 'Document by Document', purpose: 'Employment', country: 'India', educations: [{ degree: 'Bachelor’s degree', school: 'Sample Institute of Technology', country: 'India', start: '2015-08', end: '2019-05' }], stage: 'processing', payment: 'paid', amount: 100, updated: '2026-09-30', due: 'Oct 05', documents: documents('complete'), notes: 'Sample: evaluation is in progress.' },
  { id: 'AET-1045', name: 'Daniel Kim', email: 'daniel.kim@example.com', office: 'Los Angeles', service: 'Expert Opinion Letter', purpose: 'Immigration', country: 'South Korea', educations: [{ degree: 'Master’s degree', school: 'Sample Graduate University', country: 'South Korea', start: '2017-03', end: '2019-02' }], stage: 'submitted', payment: 'paid', amount: 400, updated: '2026-09-30', due: 'Oct 09', documents: documents('missing'), notes: 'Sample: an academic transcript is still needed.' },
  { id: 'AET-1044', name: 'Sofia Martins', email: 'sofia.martins@example.com', office: 'Boston', service: 'Pre-Evaluation', purpose: 'Education', country: 'Brazil', educations: [{ degree: 'Bachelor’s degree', school: 'Sample University', country: 'Brazil', start: '2016-02', end: '2020-12' }], stage: 'processing', payment: 'paid', amount: 25, updated: '2026-09-30', due: 'Oct 02', documents: documents('complete'), notes: 'Sample: preliminary assessment awaiting staff review. This is not a formal credential evaluation.' },
  { id: 'AET-1043', name: 'Ethan Wu', email: 'ethan.wu@example.com', office: 'San Francisco', service: 'Course by Course', purpose: 'Education', country: 'Taiwan', educations: [{ degree: 'Bachelor’s degree', school: 'Sample University', country: 'Taiwan', start: '2014-09', end: '2018-06' }], stage: 'completed', payment: 'paid', amount: 250, updated: '2026-09-29', due: 'Sep 29', documents: documents('complete'), notes: 'Sample: evaluation completed and delivered.' },
  { id: 'AET-1042', name: 'Amara Okafor', email: 'amara.okafor@example.com', office: 'New York', service: 'Document by Document', purpose: 'Employment', country: 'Nigeria', educations: [{ degree: 'Bachelor’s degree', school: 'Sample University', country: 'Nigeria', start: '2015-09', end: '2019-07' }], stage: 'submitted', payment: 'pending', amount: 100, updated: '2026-09-29', due: 'Oct 07', documents: documents('complete'), notes: 'Sample: payment request is awaiting a response.' },
  { id: 'AET-1041', name: 'Lucas Moreau', email: 'lucas.moreau@example.com', office: 'Miami', service: 'Certified Translation', purpose: 'Education', country: 'France', educations: [{ degree: 'Master’s degree', school: 'Sample Graduate University', country: 'France', start: '2018-09', end: '2020-06' }], stage: 'completed', payment: 'paid', amount: 160, updated: '2026-09-28', due: 'Sep 28', documents: documents('complete'), notes: 'Sample: translated documents delivered electronically.' },
  { id: 'AET-1040', name: 'Aisha Hassan', email: 'aisha.hassan@example.com', office: 'Boston', service: 'Pre-Evaluation', purpose: 'Employment', country: 'Egypt', educations: [{ degree: 'Bachelor’s degree', school: 'Sample University', country: 'Egypt', start: '2015-09', end: '2019-06' }], stage: 'submitted', payment: 'paid', amount: 25, updated: '2026-09-28', due: 'Oct 03', documents: documents('review'), notes: 'Sample: preliminary assessment documents are ready for review.' },
  { id: 'AET-1039', name: 'Noah Fischer', email: 'noah.fischer@example.com', office: 'Los Angeles', service: 'Course by Course', purpose: 'Education', country: 'Germany', educations: [{ degree: 'Bachelor’s degree', school: 'Sample University', country: 'Germany', start: '2016-10', end: '2020-07' }], stage: 'processing', payment: 'paid', amount: 250, updated: '2026-09-27', due: 'Oct 04', documents: documents('complete'), notes: 'Sample: course review in progress.' },
  { id: 'AET-1038', name: 'Isabella Rossi', email: 'isabella.rossi@example.com', office: 'New York', service: 'Pre-Evaluation', purpose: 'Education', country: 'Italy', educations: [{ degree: 'Bachelor’s degree', school: 'Sample University', country: 'Italy', start: '2015-09', end: '2018-07' }], stage: 'completed', payment: 'paid', amount: 25, updated: '2026-09-27', due: 'Sep 27', documents: documents('complete'), notes: 'Sample: preliminary assessment reviewed by staff.' },
  { id: 'AET-1037', name: 'Leo Nguyen', email: 'leo.nguyen@example.com', office: 'San Francisco', service: 'Document by Document', purpose: 'Employment', country: 'Vietnam', educations: [{ degree: 'Bachelor’s degree', school: 'Sample University', country: 'Vietnam', start: '2015-09', end: '2019-06' }], stage: 'completed', payment: 'paid', amount: 100, updated: '2026-09-26', due: 'Sep 26', documents: documents('complete'), notes: 'Sample: evaluation completed.' },
];

export const demoPayments: PaymentRequest[] = [
  { id: 'PAY-0204', applicationId: 'AET-1047', amount: 120, status: 'Pending', method: 'Stripe' },
  { id: 'PAY-0203', applicationId: 'AET-1042', amount: 100, status: 'Pending', method: 'PayPal' },
  { id: 'PAY-0202', applicationId: 'AET-1048', amount: 250, status: 'Paid', method: 'Stripe' },
  { id: 'PAY-0201', applicationId: 'AET-1046', amount: 100, status: 'Paid', method: 'Zelle' },
  { id: 'PAY-0200', applicationId: 'AET-1043', amount: 250, status: 'Paid', method: 'Stripe' },
];
