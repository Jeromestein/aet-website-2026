import {afterEach,describe,expect,it,vi} from 'vitest';
import {readStaffMembership} from '../lib/staff/read-retry';
import {AppError} from '../lib/preeval/domain';
import {staffSession} from '../lib/staff/session';
const m=vi.hoisted(()=>({read:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/headers',()=>({cookies:async()=>({getAll:()=>[{name:'aet_staff_auth',value:'fixture'}]})}));
vi.mock('../lib/staff/client',()=>({staffClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'fixture'}},error:null})}})}));
vi.mock('../lib/staff/db',()=>({staffDb:()=>m.read}));
vi.mock('../lib/preeval/db',()=>({db:vi.fn(),table:vi.fn()}));
afterEach(()=>vi.clearAllMocks());
describe('staff membership connection recovery',()=>{
  it('retries a failed DNS lookup and returns only freshly read membership',async()=>{
    const read=vi.fn().mockRejectedValueOnce({code:'ENOTFOUND'}).mockResolvedValueOnce([{id:'fixture'}]);
    expect(await readStaffMembership(read)).toEqual([{id:'fixture'}]);expect(read).toHaveBeenCalledTimes(2);
  });
  it('bounds persistent outages and returns a sanitized service error',async()=>{
    const read=vi.fn().mockRejectedValue({code:'ENOTFOUND',message:'private host'});
    await expect(readStaffMembership(read)).rejects.toMatchObject({code:'service_unavailable',status:503});expect(read).toHaveBeenCalledTimes(2);
  });
  it('does not retry permission or query failures',async()=>{
    const error={code:'42501'},read=vi.fn().mockRejectedValue(error);
    await expect(readStaffMembership(read)).rejects.toBe(error);expect(read).toHaveBeenCalledTimes(1);
  });
  it('does not invent membership when the account is disabled',async()=>{
    m.read.mockRejectedValueOnce({code:'EAI_AGAIN'}).mockResolvedValueOnce([]);
    expect(await staffSession()).toBeNull();expect(m.read).toHaveBeenCalledTimes(2);
  });
  it('does not treat an outage as signed out or bypass membership checks',async()=>{
    m.read.mockRejectedValue({code:'ENOTFOUND'});
    await expect(staffSession()).rejects.toBeInstanceOf(AppError);
    expect(m.read).toHaveBeenCalledTimes(2);
  });
});
