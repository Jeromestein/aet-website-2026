import {describe,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {evalueeName,workspaceCsv} from '../lib/crm/contracts';
import {liveRow} from '../lib/crm/live-server';

describe('CRM evaluee identity',()=>{
  const source={id:'case-1',name:'Different Contact',pronouns:'ms',first_name:'Rachelle',middle_name:'Pierre',last_name:'Louis',status:'submitted'};
  it('uses the evaluee fields instead of the contact across list and export',()=>{
    const row=liveRow('formal',source);
    expect(row.name).toBe('Ms. Rachelle Pierre Louis');
    const csv=workspaceCsv([row]);
    expect(csv).toContain('"Evaluee Name"');
    expect(csv).toContain('Ms. Rachelle Pierre Louis');
    expect(csv).not.toContain('Different Contact');
  });
  it('preserves a multiword last name and formats the stored title',()=>{
    expect(evalueeName({pronouns:' mr ',first:'Yunhe',last:'Liu'})).toBe('Mr. Yunhe Liu');
    expect(evalueeName({pronouns:'mx',first:'Alex',last:'Van Dijk'})).toBe('Mx. Alex Van Dijk');
  });
  it('does not invent a title or fall back to the contact for missing names',()=>{
    expect(evalueeName({first:'Alex',last:'Chen'})).toBe('Alex Chen');
    expect(liveRow('formal',{id:'missing',name:'Contact Only',pronouns:'ms'}).name).toBe('Name not recorded');
    expect(liveRow('payment',{id:'payment',source:'Payment link'}).name).toBe('Payment link');
  });
});
