import "server-only";
import { cookies } from "next/headers";
import { staffCookieName } from "./config";
import { staffClient } from "./client";
import { staffDb } from "./db";
import { readStaffMembership } from "./read-retry";
import { table, db } from "../preeval/db";
import { AppError } from "../preeval/domain";
export interface StaffSession {
  id: string;
  email: string;
  role: "admin";
  staffRole: "admin" | "staff";
  offices: string[];
  include_unassigned: boolean;
}
export function canAccessOffice(
  staff: Pick<StaffSession, "offices" | "include_unassigned">,
  office: string | null,
) {
  return office === null
    ? staff.include_unassigned
    : staff.offices.includes(office);
}
export async function staffSession(): Promise<StaffSession | null> {
  const jar = await cookies();
  if (
    !jar
      .getAll()
      .some(
        (c) =>
          c.name === staffCookieName ||
          c.name.startsWith(staffCookieName + "."),
      )
  )
    return null;
  const {
    data: { user },
    error,
  } = await (await staffClient()).auth.getUser();
  if (error || !user) return null;
  const [row] =
    await readStaffMembership(() => staffDb()`select auth_user_id as id,email,role as "staffRole",offices,include_unassigned
    from aet_private.staff_accounts where auth_user_id=${user.id} and active`);
  return row ? ({ ...row, role: "admin" } as StaffSession) : null;
}
export async function requireStaff() {
  const staff = await staffSession();
  if (!staff) throw new AppError("access_denied", 401);
  return staff;
}
export async function requireStaffApplication(
  kind: "formal" | "preeval",
  id: string,
  staff?: StaffSession,
) {
  const current = staff || (await requireStaff());
  const rows =
    kind === "formal"
      ? await db()`select case when l.id is null then nullif(a.data->'client'->>'office','') else l.office end as office
      from ${table("evaluation.applications")} a left join ${table("public.fce_applications")} l on l.id=a.id where a.id=${id}`
      : await db()`select office from ${table("preeval.applications")} where id=${id}`;
  if (!rows[0] || !canAccessOffice(current, rows[0].office))
    throw new AppError("access_denied", 403);
  return current;
}
