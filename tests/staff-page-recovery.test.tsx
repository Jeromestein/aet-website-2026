import {beforeEach,describe,expect,it,vi} from 'vitest';
import {AppError} from '../lib/preeval/domain';
const m=vi.hoisted(()=>({session:vi.fn(),redirect:vi.fn((url:string)=>{throw new Error('redirect:'+url);})}));
vi.mock('next/navigation',()=>({redirect:m.redirect}));
vi.mock('../lib/staff/session',()=>({staffSession:m.session}));
vi.mock('../lib/preeval/auth',()=>({session:m.session}));
vi.mock('../components/staff/unavailable',()=>({default:()=>null}));
vi.mock('../components/staff/auth-form',()=>({default:()=>null}));
vi.mock('../components/preeval/shell',()=>({default:()=>null}));
vi.mock('../components/crm/workspace',()=>({default:()=>null}));
import Login from '../app/[locale]/admin/login/page';
import Workspace from '../app/[locale]/admin/CRM/page';
import Unavailable from '../components/staff/unavailable';
beforeEach(()=>vi.clearAllMocks());
describe.each([['login',Login],['workspace',Workspace]] as const)('%s service recovery',(name,Page)=>{
  it('renders a retry state instead of a crash or sign-out on a membership outage',async()=>{
    m.session.mockRejectedValue(new AppError('service_unavailable',503));
    const result=await Page({searchParams:Promise.resolve({})});
    expect(result.type).toBe(Unavailable);expect(m.redirect).not.toHaveBeenCalled();
  });
  it('does not conceal an unexpected programming failure',async()=>{
    const error=new Error('Unexpected failure');m.session.mockRejectedValue(error);
    await expect(Page({searchParams:Promise.resolve({})})).rejects.toBe(error);
  });
});
it('retains sign-in requirements when the session is absent',async()=>{
  m.session.mockResolvedValue(null);
  await expect(Workspace({searchParams:Promise.resolve({})})).rejects.toThrow('redirect:/admin/login');
});
