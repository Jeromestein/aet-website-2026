# Contact provenance

- English, Chinese, and Spanish introductory wording, office names, hours, and
  secondary contacts come from `e-contact-content[{-zh,-es}].html` in the legacy
  checkout. Shared phone, email, address, and channel identifiers live in
  `lib/contact.ts` so locale variants and future office pages cannot drift.
- The owner explicitly selected **17802 Sky Park Cir, Suite 205 A, Irvine, CA
  92614-6403** for the Los Angeles office on September 29, 2026. The legacy
  Chinese Contact and Los Angeles detail pages instead show MacArthur Blvd;
  the owner's choice takes precedence here.
- The legacy Contact page has no submission form, map embed, or QR image. The
  new page offers callable/email links and address-based directions without
  introducing a backend form or unverified QR graphic.
- Removed channels explicitly labeled for the excluded visa/China consular
  authentication services. Kept general and retained-service channels, plus
  the source's separate NYC and Taiyuan Other Contact information.
- Office availability, hours, walk-in policy, and other legacy business facts
  have not been independently confirmed. Review them before production launch.

## Office page migration — September 30, 2026

- Four office pages use the shared catalog and `OfficeCard`; hours now live as
  structured values in `lib/contact.ts`, formatted per locale. Missing Beijing
  hours remain omitted. Beijing's telephone link includes China's country code.
- Page introduction, company history, services and guarantees are adapted from
  the local `e-office-{miami,boston,los-angeles,beijing}-content.html` files.
  The retained service scope excludes visa and consular authentication services.
  Beijing retains its coordination/document-support scope. Time-relative legacy
  experience copy is represented by the original founding/history dates.
- Directions are generated from the current catalog address, rather than copying
  legacy map embeds. Legacy office photos/promotional graphics were not migrated;
  the new pages prioritize contact information and service instructions.
- `legacy-references.json` records immutable source spellings for current contact
  text in imported articles/services. The HTML renderer resolves them against the
  catalog and escapes the result; article prose and historical image assets stay
  in their original checked-in sources. This does not change payment identities.

## Contact methods — October 8, 2026

- At the owner's request, the shared introduction now offers Phone, Email,
  WeChat, and Visit, in that order, across all three locales and office pages.
  The new phone/WeChat instructions point readers to the existing office details;
  they do not introduce new phone numbers, account IDs, or service commitments.
- Removed the old two-option numbering and unnecessary-phone-call sentence.
  Retained emailed scans, no-originals guidance, and the San Francisco reservation
  exception from the existing instructions.
