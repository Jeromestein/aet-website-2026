# Application and CRM Design Patterns

Read the [shared design guide](README.md) first. This reference owns customer
forms, Status and staff UI. It specifies presentation and interaction, not which
backend features are enabled; use [status](../status.md) for that boundary.

| Work area | Jump to / implementation reference |
| --- | --- |
| Unified three-step application | [General application](#general-application) / [intake guide](../credential-intake-testing.md) |
| Customer Status and documents | [Customer status](#customer-status-and-documents) / [Dropbox](../dropbox.md) |
| Pre-evaluation lifecycle | [Pre-evaluation](#dedicated-pre-evaluation) / [workflow guide](../pre-evaluation-local.md) |
| Staff workspace | [CRM](#crm-workspace) / [authentication](../staff-auth.md) |
| Business email | [Email design and delivery](../email-templates.md) |

## Shared customer shell

Reuse the website `Navigation` and `SiteFooter` for pre-evaluation intake and status, formal application/access/receipt and payment-return pages.
Scope form styles to their main content so shared colors stay intact. Preserve
language/query behavior from the core guide. Retired token-only URLs show localized
recovery guidance instead of a token-exchange button.
Staff use their own English-only workspace shell.

## General application

Localized `/application` offers pre-evaluation and formal evaluation. The
service picker and URL preselection use these same two choices. Existing
standalone translation drafts reopen at service selection with contact details retained. Redirect the old dedicated
pre-evaluation form to its selected service here; retain saved application links.
Public website destinations remain controlled by the release gate.
The retired four-step formal pilot redirects here. See
[evaluation-application.md](../evaluation-application.md) for access boundaries.

### Steps and fields

1. **Contact, service and office:** client/organization name, email and phone,
   each with a visible required asterisk; then service and eligible office.
2. **Service details:** evaluee identity, education, evaluation services and
   report/delivery, followed by service-specific additional requirements.
3. **Review:** saved selections, qualification associations, fee estimate and full
   delivery details, followed by the enabled submission action.

| Control | Rule |
| --- | --- |
| Offices | Native dropdown, disabled until a service is chosen. Evaluation/pre-evaluation: Miami, Los Angeles, San Francisco. Exclude Beijing. Clear an ineligible office on service change/draft restore while retaining other answers. |
| Name | Required Mr./Ms./Mx. dropdown before required first/last names; optional middle name and date of birth. Chinese labels are Chinese-only, with the optional marker beside middle name. Align desktop name inputs. |
| Education | All education fields required. School and country share a desktop row; degree name spans the next full row. Stack on phones. Include identity/education in drafts and review. |
| Dropdowns | Follow the [global field rules](README.md#interaction-accessibility-and-language): custom chevron inset 14px, 44px right text padding and a single rounded blue focus ring; preserve native select behavior. |
| Progress/actions | Three-step indicator; no duplicate counter in the first-step action bar. Forward action right-aligned and green; Back black with white text throughout this form. |
| Start over | Error-red text, reset icon, no underline; confirm clearing and offer Cancel before removing answers. |

### Evaluation services and delivery

- Place service cards **directly below education**. Document-by-Document and
  Course-by-Course are mutually exclusive radio choices. Hide expert/position
  services and the help-choosing option in this intake.
- Each card has a separate, always-available sample PDF link: pale blue, navy
  “View Evaluation Sample”, a document icon and localized accessible
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

## Customer access policy

- Do not introduce customer session cookies, one-use email-link exchange, or
  arbitrary 24-hour access expiry for either application service. Do not require
  the same browser or ask customers to renew a link to continue their application.
- Reuse the accepted application-ID/confirmation-link flow. A link is an access
  credential, not proof of identity; tell staff to share it only with its applicant.
  Never describe a reusable link as single-use or say a new copy invalidates it.
- Keep employee login, office permissions, application/file ownership checks,
  payment validation, and paid/published-result gates. This rule does not retire
  employee sessions, Stripe Checkout sessions, signed upload credentials, or
  tab-scoped form draft retention.
- Retired token-only URLs show recovery guidance and remove the fragment locally;
  do not guess the application ID, recreate token tables or accept obsolete cookies.
- Future internal-only access should reuse employee authentication when implemented;
  this policy alone does not enable a gate or activate Production.

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

New applications use the general three-step form above. Include required residence
country separately from study country, one education and USD 19.88 total (USD 19
plus USD 0.88 processing). Review requires the existing terms and disclaimer.
Preserve per-service retry IDs, drafts and Start over. Submission opens the saved
application's document section; never show an unsaved-preview notice for this
connected service. Retain the existing result/status layout and saved URLs.

Supporting documents remain optional. Show an explicit continue-without-documents
choice only before any upload begins on a new unified application. Pending or
failed uploads and staff-requested materials must use the existing recovery flow.

Use `/application` for intake and `/status` for both services. Route by the
Application ID and show the relevant documents, payment and result controls.
Old pre-evaluation start and lookup addresses redirect to these pages.

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
- GPA calculator and all other sidebar destinations use their leading feature
  icon and text only, with no trailing outbound-link arrow. Opening a new tab
  does not exempt a link from the [global arrow prohibition](README.md#interaction-accessibility-and-language).

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
  arrow column. Education, Service and Payment each open their own drawer tab.
  Use a small leading right-panel icon and blue text with a full hover/focus
  highlight and touch target. Align the three desktop targets at the top and
  their secondary lines at the bottom of each row when a title wraps.
  Keep empty education values as plain text.
  Payment precedes Status and opens its own tab; preserve payment-state colors.
  Mobile cards keep the same shortcuts, education/service and Updated At.
- A small blue truck in Service indicates recorded mailing, using legacy or saved
  test delivery selection; absent/no delivery gets no icon. Narrow desktop tables
  scroll locally rather than dropping columns.
- Below Status show estimated timing with a 6px elapsed-time bar, remaining/overdue
  days and muted completion date. Green: >2 calendar days; amber: 0–2; red: overdue.
  Calculate elapsed time from payment to the estimated deadline. Historical formal
  orders follow the original 1 pm Eastern cutoff. New formal orders use the saved
  turnaround and the handling office's 1 pm cutoff. Omit timing for missing payment
  dates, unknown turnaround, completed or cancelled cases, and other order types.
  Show the same timing in mobile cards and preserve the existing case notes.
- Keep drawer width, identity header, service/status badges, six tabs and open/close
  behavior shared across Live/Test. No embedded customer “Application saved” receipt.
  Matching visuals do not enable writes; gate v2 operations on the connected workflow
  capability and enforce employee/office authorization on every staff request.
- The blue service badge shows saved selections in this order: Document by
  Document, Course by Course, Expert Opinion Letter, Position Evaluation,
  Translation, Customized Evaluation, Pre-Evaluation. Join selections with
  commas and show FCE when no recognized service is present.
- Information cards: white, light border, 8px radius, 20px padding / 16px mobile;
  13px muted labels, 14px navy values. Reserve tints for badges/interactive states.
- Education: one card per record, School/Country then Degree/Study Period; stack on
  phones, use country names and month/year. Service order: purpose, notes,
  turnaround/fees, delivery, extras, total, fee note. Prefer saved quotes/amounts;
  never infer unknown prices or mutate business records for display.
- Place Copy ID and customer Status in a dedicated row below the identity
  block. Both actions use 14px semibold system UI text, a 22px line height,
  matching icon spacing and 44px targets. Only supported formal
  evaluations get the Status link; test links retain their preview context.
- Documents show Dropbox names, sizes, update dates and manual refresh; open preview
  through the office account. Recheck staff application access per request. Use the
  saved office/name/application-ID resolver shared with Status; a preview database
  flag does not isolate storage accounts. [Dropbox](../dropbox.md) owns storage rules.
- Keep explicit final-report release and other workflow actions capability-gated.
  Put status/customer requests and internal notes in Overview, confirmed quotes and
  payment verification in Payment, and private PDF drafts/release in Documents.
  Save feedback refreshes the drawer and list. Never expose a draft download to
  customers; publication requires paid status and a report matching current inputs.
- Customer Status shows the confirmed total and quote explanation, missing-material
  request, and released report download. Hide “awaiting quote” after confirmation;
  preserve the original estimate and paper delivery details for comparison.

### GPA calculator

Open `/admin/CRM/gpa-calculator` in a new tab. Input one course per line with
tab/space-separated course name, credits and letter grade. Preserve AET's 4.35
scale, credit-only grades and copyable GPA Summary precision; show row errors
instead of silently omitting invalid input. Input/result panels sit side by side
on desktop and stack on phones, with Reset and Copy summary controls.

## Internal event calendar

For `/admin/calendar`, follow the owner's Google Calendar reference: a full-width
white month grid, thin neutral dividers, centered dates and a blue circle for
today. Keep the header compact and filters secondary; omit promotional copy,
summary cards and an upcoming-events rail. Use scoped Arial/Helvetica typography
and blue/green/purple category colors within this calendar only.

Timed month entries use a colored dot, time and one-line title. Date-only source
announcements use a solid bar, with their unconfirmed time retained in details
and the schedule view. Show three entries before a more-events popover; the
popover and detail dialog expose complete titles. Phones default to Schedule,
with full titles and explicit times. Never infer a time or recurrence from an
incomplete announcement. Read only dated records from the saved event archive;
unverified leads and artificial fixtures do not enter the page. Group colors and
filters by organizer rather than inferred AICE affiliation. Preserve original time
wording when its timezone is unknown. For a series without individual session
dates, show the announced opening session and retain the full range in details.
