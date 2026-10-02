# Application compatibility with the existing AET system

October 2, 2026. The original form fields and business-table contracts are the
authority for applicant data. The website catalog is the authority for current
formal-evaluation fees and offered turnaround options.

## Storage contract

The local fixture contains the original columns, types, defaults, nullability,
primary/foreign keys and check constraints from these five tables:

| Form data | Existing table / field | Compatibility behavior |
| --- | --- | --- |
| Pre-evaluation applicant | `aet_core_applications` | Original name/email fields; `purpose=degree-equivalency`; original status values. |
| Pre-evaluation education | `aet_core_educations` | Individual education ID; country code; dates as `{year, month}`; `ai_output` as a JSON string. |
| Pre-evaluation payment | `aet_core_payments` | Dollar amount, payment status, provider reference and original paid timestamp. |
| Formal client/evaluee | `fce_applications` | Original name/address/contact/office/pronouns/birth-date fields; `purpose=evaluation-*`; notes in `purpose_other`. |
| Formal education | `fce_educations` | One row per education, country codes, `{year, month}` dates; no flattened or discarded degrees. |
| Formal services | `fce_applications.service_type` | Existing service keys and objects; actual turnaround codes, plus optional `websiteQuote` metadata in the existing JSON field. |
| Formal report/shipping | `additional_services`, `additional_services_quantity`, `delivery_method` | Original report and shipping codes; extra-copy quantity remains separate. |
| Formal payment | `due_amount`, `payment_status`, `payment_id`, `paid_at` | Dollars in the original `numeric(6,2)` column; unconfirmed quotes remain null; existing status values. |

No columns or constraints were added to the original five tables. The schema
metadata in `scripts/legacy/schema-metadata.json` contains no customer rows.
Local RLS denies anonymous access; production policies were not copied.

The previously implemented private `preeval` and `evaluation` schemas remain
auxiliary storage for authentication, files, AI runs, payment events, audit,
quote confirmation and local workflow. This is an additive local pilot, not a
claim that the whole new workflow runs using only the five existing tables.
Submission writes both parts atomically. Auxiliary triggers translate local
workflow updates into the existing business columns. They do not alter public
table definitions. Public business fields are read back by the new receipt.

Pre-evaluation residence country has no column in the original core table. It
remains in the auxiliary record; adding a new core column is unnecessary.
The visible pre-evaluation form still creates one education. Existing records
with multiple degrees are not imported or truncated; result updates target only
the linked education ID. The new workflow is not a general editor for historical
orders, nor a bidirectional synchronizer for simultaneous edits in both systems.

## Form alignment

- Countries and regions submit the same codes as the old country/state dataset.
  Fixed translated country labels prevent browser/server translation differences.
  Source data is from `country-state-city` 3.2.1; its license is retained beside it.
- Dates use separate year/month/day selectors, as in the old form. Birth dates
  remain calendar dates, and education dates keep the original month/year object.
- Original phone/fax and postal validation is retained for all countries. No
  unsupported international address format is silently converted before saving.
- Formal service notes are back in the client step and remain optional. Education
  entries can be removed; each entry that remains must be complete.
- PDF only, PDF with one paper copy, and extra copies are three independent
  report choices. Extra copies require a quantity and shipping. Choosing extra
  copies does not also charge the one-paper-copy fee.
- Mailing uses the client address. The unsupported independent recipient fields
  have been removed rather than accepted without a corresponding stored field.
- Pre-evaluation optional documents are selected in the education step and
  uploaded after the application is saved. The saved application reports a
  partial upload failure and permits retry. No document is required to continue.

## Website prices and old readers

New formal applications use `lib/pricing.ts`, also used by the public website.
The optional `service_type.websiteQuote` object stores version 1, currency,
itemized cents, quantities, actual turnaround and min/max totals. It also stores
education IDs to preserve their presentation order. This is JSON metadata in an
existing column, not a new table or column. Historical orders without this object
keep their original price calculation.

Expert service codes use the actual website 21/14/8-day options. A 14-day website
order is never encoded as a historical 7-day service. Historical options absent
from the website remain historical; they are not reinterpreted by the new form.
Extra-copy prices remain the website's $40–$60 range until confirmed. Unconfirmed
ranges and custom/translation work cannot become a charge through parsing the
lower end of a displayed range. Totals must fit the existing amount column.

The sibling `aet-app` has a small reader patch for service cards, estimated
completion, confirmation-email details and payment eligibility. It reads the
saved snapshot and confirmed due amount; old rows without a snapshot retain the
existing path. Both repositories' changes must be reviewed together before any
production cutover. The old application editor and every historical reporting
surface have not been migrated to edit new website orders.

The separately approved online pre-evaluation charge remains $19 + $0.88. This
pass does not resolve the differing $40–$60 public pre-evaluation listing or
invent an explanation for that difference. It changes no pre-evaluation rate.

## Local setup and verification

After applying this project's local Supabase migrations:

```sh
pnpm legacy:setup
pnpm test:legacy
pnpm test:legacy:integration
```

Setup rejects remote database hosts and a partial existing fixture. It creates
the five business tables only in an empty local fixture and installs triggers on
the auxiliary workflow tables. Existing local tables are not rebuilt. The
integration check compares their metadata against the captured original schema,
then exercises fictional records inside a rolled-back transaction.

The compatibility pass verified 98 new-site unit tests, 13 database compatibility
checks, 24 formal API checks and 59 workflow API checks. The old reader passed
29 focused tests, including rendering its existing service card with a new
website quote. Both repositories passed type checks. The in-app browser walked
the Chinese formal form through all four steps and a synthetic saved receipt,
then its stored row was loaded through the actual old form reader. Desktop and
390px mobile views were inspected. The pre-evaluation form was walked through
review, including its optional document control; it was not submitted to the
external-service workflow during this pass.

No production database write, historical data migration, real charge, email,
AI assessment, external upload, build, push or deployment was performed in this
compatibility pass. The old full application was not started in a browser;
its patch was checked with type checks, component rendering and reader tests.
