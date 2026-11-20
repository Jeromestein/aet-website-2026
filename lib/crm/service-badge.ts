import type { ApplicationData } from '../evaluation-application/domain';

export const formalServiceNames = {
  document: 'Document by Document',
  course: 'Course by Course',
  expert: 'Expert Opinion Letter',
  position: 'Position Evaluation',
  translation: 'Translation',
  customized: 'Customized Evaluation',
} satisfies Record<keyof ApplicationData['services'], string>;

const serviceNames = [...Object.values(formalServiceNames), 'Pre-Evaluation'];

export function serviceBadgeLabel(services: ApplicationData['services'] | string | undefined) {
  const selected = new Set<string>();
  if (typeof services === 'string') {
    for (const name of services.split(',')) selected.add(name.trim());
  } else if (services) {
    for (const key of Object.keys(formalServiceNames) as (keyof typeof formalServiceNames)[]) {
      const choice = services[key];
      if (choice === true || (typeof choice === 'object' && choice?.tier?.trim())) {
        selected.add(formalServiceNames[key]);
      }
    }
  }
  return serviceNames.filter(name => selected.has(name)).join(', ') || 'FCE';
}
