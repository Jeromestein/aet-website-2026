# Application and CRM Design Patterns

Read the [shared design guide](README.md) first. This reference owns customer
forms, Status and staff UI. It specifies presentation and interaction, not which
backend features are enabled; use [status](../status.md) for that boundary.

| Work area | Jump to / implementation reference |
| --- | --- |
| Unified three-step application | [General application](#general-application) / [intake guide](../credential-intake-testing.md) |
| Customer Status and documents | [Customer status](#customer-status-and-documents) / [Dropbox](../dropbox.md) |
| Dedicated pre-evaluation | [Pre-evaluation](#dedicated-pre-evaluation) / [workflow guide](../pre-evaluation-local.md) |
| Staff workspace | [CRM](#crm-workspace) / [authentication](../staff-auth.md) |
| Business email | [Email design and delivery](../email-templates.md) |

## Shared customer shell

Reuse the website `Navigation` and `SiteFooter` for pre-evaluation landing/form/
status/access/result, formal application/access/receipt and payment-return pages.
Scope form styles to their main content so shared colors stay intact. Preserve
language/query behavior from the core guide; protected formal token exchange
keeps language switching disabled while the private link is held in memory.
Staff use their own English-only workspace shell.

## General application

Localized `/application` accepts `service=pre-evaluation`, `service=evaluation`
or `service=translation`. Keep existing destinations until the corresponding
submission is connected; a visible service choice does not enable its backend.
The older four-step formal pilot is a separate flow, documented in
[evaluation-application.md](../evaluation-application.md).

### Steps and fields

1. **Contact, service and office:** client/organization name, email and phone,
   each with a visible required asterisk; then service and eligible office.
2. **Service details:** evaluee identity, education, evaluation services and
   report/delivery, followed by service-specific additional requirements.
3. **Review:** saved selections, qualification associations, fee estimate and full
   delivery details, followed by the enabled submission action.

| Control | Rule |
| --- | --- |
| Offices | Native dropdown, disabled until a service is chosen. Evaluation/pre-evaluation: Miami, Los Angeles, San Francisco. Translation: those three plus Boston and New York. Exclude Beijing. Clear an ineligible office on service change/draft restore while retaining other answers. |
| Name | Required Mr./Ms./Mx. dropdown before required first/last names; optional middle name and date of birth. Chinese labels are Chinese-only, with the optional marker beside middle name. Align desktop name inputs. |
| Education | All education fields required. School and country share a desktop row; degree name spans the next full row. Stack on phones. Include identity/education in drafts and review. |
| Dropdowns | Consistent chevron inset 14px from the right, with enough text padding. |
| Progress/actions | Three-step indicator; no duplicate counter in the first-step action bar. Forward action right-aligned and green; Back black with white text throughout this form. |
| Start over | Error-red text, reset icon, no underline; confirm clearing and offer Cancel before removing answers. |

### Evaluation services and delivery

- Place service cards **directly below education**. Document-by-Document and
  Course-by-Course are mutually exclusive radio choices. Hide expert/position
  services and the help-choosing option in this intake.
- Each card has a separate, always-available sample PDF link: pale blue, navy
  “View Evaluation Sample”, document/external-link icons and localized accessible
  name. Open separately without changing the radio. Beside the service heading,
  use a question-mark link to localized `/evaluation#service` in a new tab.
- Use shared 2026 tiers. Mark 24-hour and same-day choices with an asterisk and
  show the complete-document/payment deadline beside the selector; repeat it in
  expedited fee summaries/review: **13:00 in the handling office's local time**.
  Pricing/Evaluation tables follow the same rule, including course same-day $450.
- Charge only selected qualifications: first included, additional ones at catalog
  rates. Preserve education associations when switching. Translation remains a
  separate optional quoted add-on. Sidebar/review estimates must agree, include
  selected report/shipping charges and exclude payment-processing fees.
- Place Report & delivery next. Default to PDF-only; offer PDF plus one mailed
  paper report and optional extra copies. Use shared report/shipping fees and
  preserve additional-copy price ranges. Required for paper: recipient, country,
  street and city; U.S. state/valid ZIP; applicable non-U.S. province/postal code.
  Apartment/suite is optional. Filter shipping by country and clear incompatible
  methods. Switching to PDF clears mailing charges but retains the draft address.
  Review shows report format, complete address, shipping and copy count.
- Under formal evaluation Additional requirements, retain the legacy notes
  example, request guidance and full acceptance notice in restrained amber.
  Sample PDFs stay beside service cards; other services do not inherit this guidance.

### Drafts and submission feedback

Keep a service/office summary and tab-scoped draft for up to 24 hours. Restore
older answers while requesting missing pronouns/current processing tier. Remove
retired options; conflicting document/course choices require reselection without
discarding contact or education answers.

Disable controls while saving; preserve the submission request ID across retries
and reloads. Display a saved ID/link only after persistence succeeds. Email failure
must not look like submission failure; retain the saved application and expose the
available retry. Customer access uses the ID/confirmation link, not a new account.
Read test-recipient policy and enabled service scope from the intake guide; do not
duplicate changing provider configuration in design rules.

## Customer Status and documents

Use one Status layout/data contract for live and isolated test applications.
`source=preview` selects data only: show a small test label, not a separate receipt
or simplified test page. Show available saved service, education, qualification
associations, quote, delivery and mail details in shared cards; missing historical
fields remain explicitly unavailable.

Organize Status into application status, supporting documents, payment and report
delivery. Gate controls by connected capabilities: never give isolated IDs a
production payment link or an invented deadline. Clearly label test payments;
keep staff notes and unreleased reports private. Implementation scope comes from
[current status](../status.md), not the older intake-only milestone.

Document selection/upload actions are orange; saved rows, checkmarks and completion
feedback are green. Keep file limits and office help compact/readable on phones.
Completion audio supplements visible feedback. Preserve the saved application's
document context through refresh and do not present a failed upload as saved.

## Dedicated pre-evaluation

Preserve the legacy applicant → education → review flow, required fields,
optional supporting documents and USD 19.88 total. Use pale blue, navy, white
cards and orange main actions; preserve tab progress and provide Start over.
This dedicated flow is distinct from the general application's service choice.

Use `public/images/graduates.jpg` as a wide photographic landing hero: navy gradient
behind white copy and orange application action, central/right graduates visible.
A compact white fee card crosses the lower edge with three steps alongside. On
phones crop central graduates, transition to navy behind copy and place the fee
card below the hero. Keep descriptive localized alt text and full fee breakdown;
never overlay pricing on the photo. Application/status actions stay inside the hero.

Customers use the complete Application ID or reusable confirmation link. Add no
registration, password or extra email-verification step; label lookup as application
status. Keep ID/education visible and show payment/assessment progress. Release the
preliminary result automatically after confirmed payment, subject to workflow guards;
retain staff correction. Confirmation includes education/fees; result mail includes
paid equivalency/reasoning. Customer controls are multilingual; assessment text and
mail remain English. Staff sign-in is separate.

## CRM workspace

### Access and shell

- Preserve `/admin/CRM` and the intended existing app-domain address. Canonicalize
  prefixed staff URLs and lowercase `/admin/crm` to unprefixed English staff routes.
  Hide language controls and preserve the customer's saved website language.
- Login: compact email/password card, full logo, navy action, cool-white surface,
  visible labels and password visibility control. No registration, password recovery,
  email-link login or repeat invitations. The owner maintains staff accounts;
  [staff-auth.md](../staff-auth.md) owns account/permission configuration.
- Enforce office scope on the server before returning statistics, searches,
  documents, payment data or exports. Selectors show only permitted offices and
  authorized Unassigned; selecting an office never grants access.
- Formal/preliminary evaluations share the sidebar, status tabs, table/mobile
  cards and right detail drawer. Older list/detail/preview URLs open the matching
  workspace state. Keep persistence through authorized APIs, with real success/error
  feedback. Clearly explain unavailable bulk-import/payment-draft actions.
- Show Applications, Pre-evaluation and Test navigation. Test selects `source=preview`;
  the others return to live data. Hide FCE/Payment navigation while preserving
  direct URLs and each application's Payment shortcut. Hide all four overview cards
  and workspace-level Documents entry/strip; Documents belongs in the case drawer.
- Start content at the heading: no breadcrumb/live-data/date/avatar top bar or empty
  statistics area. Mobile navigation sits by the heading; sidebar retains refresh
  and account controls. New application/import-dialog shortcuts use `/application`
  in both Live/Test. Test labels and unavailable delivery actions reflect capability.
- Desktop sidebar collapses to a remembered 72px icon rail with emblem, accessible
  labels/tooltips, active state, refresh, website and account actions. Expand content
  without resetting filters/refetching. Mobile keeps the full drawer. Visit AET
  website uses orange text, pale orange background and globe, without trailing arrow.

### List and drawer

- Use Poppins 500 body / 600 names, headings and emphasis. Primary table text:
  14–15px; secondary: ≥12px; mobile client names: 16px.
- Lead with continuous row number, Updated At, then client/application information.
  Use 20 rows per page and filtered totals. Updated At is `YYYY-MM-DD`, no time;
  show Created At alongside Updated At inside the overview drawer.
- Use Evaluee Name for list/drawer/search/sort/export: stored Mr./Ms./Mx., first,
  optional middle and last name. Never substitute contact name or infer a title.
- Replace initials with stable BOS/NYC/MIA/LA/SF badges, consistent office color,
  full-name accessible text/tooltip; omit a separate Office column.
- Education and Service remain separate: academic degree/institution/country/study
  period are not application purpose. Explicitly show missing records as plain text.
- Clicking a row opens its drawer; keyboard Enter/Space also works. Omit the final
  arrow column. Education/Service/Payment have independent blue underlined triggers,
  persistent chevrons, destination labels and full hover/focus highlights/touch targets.
  Payment precedes Status and opens its own tab; preserve payment-state colors.
  Mobile cards keep the same shortcuts, education/service and Updated At.
- A small blue truck in Service indicates recorded mailing, using legacy or saved
  test delivery selection; absent/no delivery gets no icon. Narrow desktop tables
  scroll locally rather than dropping columns.
- Below Status show estimated timing with a 6px elapsed-time bar, remaining/overdue
  days and muted completion date. Green: >2 calendar days; amber: 0–2; red: overdue.
  This measures elapsed payment-to-deadline time, not work completed. Preserve the
  legacy Eastern 1 pm/weekday calculation and saved turnaround snapshots; it is
  distinct from the new application catalog's office-local cutoff. Do not invent
  dates for unknown services, missing payment time, completed/cancelled or unsupported
  cases. Reuse the authorized snapshot and manual refresh.
- Keep drawer width, identity header, service/status badges, six tabs and open/close
  behavior shared across Live/Test. No embedded customer “Application saved” receipt.
  Matching visuals do not enable writes; preserve the current v2 read-only boundary.
- Information cards: white, light border, 8px radius, 20px padding / 16px mobile;
  13px muted labels, 14px navy values. Reserve tints for badges/interactive states.
- Education: one card per record, School/Country then Degree/Study Period; stack on
  phones, use country names and month/year. Service order: purpose, notes,
  turnaround/fees, delivery, extras, total, fee note. Prefer saved quotes/amounts;
  never infer unknown prices or mutate business records for display.
- Place Copy ID and customer Status below the drawer ID. Only supported formal
  evaluations get the Status link; test links retain their preview context.
- Documents show Dropbox names, sizes, update dates and manual refresh; open preview
  through the office account. Recheck staff application access per request. Use the
  saved office/name/application-ID resolver shared with Status; a preview database
  flag does not isolate storage accounts. [Dropbox](../dropbox.md) owns storage rules.
- Keep explicit final-report release and other workflow actions capability-gated.

### GPA calculator

Open `/admin/CRM/gpa-calculator` in a new tab. Input one course per line with
tab/space-separated course name, credits and letter grade. Preserve AET's 4.35
scale, credit-only grades and copyable GPA Summary precision; show row errors
instead of silently omitting invalid input. Input/result panels sit side by side
on desktop and stack on phones, with Reset and Copy summary controls.
