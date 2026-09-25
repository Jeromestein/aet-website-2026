# AET Implementation Status

Progress and verification evidence only. The design baseline lives in [design.md](design.md).

Status updated September 25, 2026 against implementation checkpoint `f3860e9`
and the current design targets. This update records previously completed checks
and known implementation gaps; it is not a new full-page acceptance test.
Checked items must be rechecked if later layout or content changes affect them.

### Completed — 5 Items

- [x] AET name, header/footer logos, and full-map browser icon are correct.
      Header and footer artwork were visually checked on desktop and mobile;
      the selected full-map icon was inspected and icon endpoints verified.
- [x] Pale blue, cool white, navy, and orange follow their defined roles.
      Shared color tokens are in use. The Apply Now button uses `#C7471D`
      with white text; computed colors and desktop/mobile appearance were checked.
- [x] Hero text and button labels match the fixed copy; BBB artwork is visible.
      The desktop and mobile Hero states were visually checked.
- [x] Institution logos appear immediately below Hero in two right-moving rows,
      without white cards or a visible pause button.
      The component implements these requirements and was previously previewed.
      Reduced-motion and keyboard behavior remain part of the wider pending audit.
- [x] Institution supporting text and Explore all institutions remain together.
      The required sentence and partner-page destination are present in the component.

### Partially Completed — 4 Items

- [ ] Poppins, Fraunces, and Gaegu follow their assigned roles and enlarged scale;
      four-digit figures use the compact metric size and remain unclipped.
      **Done:** the three families and their roles are implemented.
      **Remaining:** enlarged sizes, the four-digit variation, and clipping checks
      after applying the new typography targets.
- [ ] Service wording, testimonials, facts, and link destinations remain faithful
      to the existing AET content.
      **Done:** fixed Hero and institution wording is aligned.
      **Remaining:** replace the remaining aspirational headings and descriptions;
      complete the section-by-section copy, attribution, fact, and destination audit.
- [ ] Graduation imagery is retained, sharp at display size, and cropped correctly.
      **Done:** the selected graduation image remains in the page.
      **Remaining:** verify source resolution, responsive image selection, and crop
      at the final desktop and mobile dimensions after layout changes.
- [ ] TypeScript and browser checks pass; deployment checks are completed by the
      owner before launch.
      **Done:** TypeScript passed before checkpoint `f3860e9`. Earlier browser
      checks covered the Hero, logos, icons, and selected desktop/mobile sections.
      **Remaining:** repeat the relevant checks after implementation changes and
      complete deployment validation on the owner's chosen deployment.

### Pending — 4 Items

- [ ] Headings, paragraphs, and cards have the specified breathing room without
      reducing important copy to preserve the old layout.
      Apply the new content width, section spacing, and card padding together
      with the enlarged type scale, then inspect wrapping and section balance.
- [ ] Mobile service, testimonial, and at-a-glance fact rails expose all cards and
      actions with manual horizontal scrolling and snap alignment. Required process
      steps and essential content remain vertical.
      Implement the three rails at 760px and below; the current mobile groups still
      use stacked layouts. Preserve a partial next-card cue and disable autoplay.
      Verify touch, keyboard access, focus visibility, last-card reachability,
      reduced motion, no-JavaScript behavior, and normal vertical page scrolling.
- [ ] Desktop, mobile, zoom, keyboard access, focus, alt text, disclosures, and
      reduced-motion behavior have been checked on the actual page.
      Complete the full acceptance pass, including 200% zoom and reduced motion.
      Earlier spot checks do not satisfy this combined requirement.
- [ ] Application, contact, payment, office, language, and legal destinations work.
      Audit all actual destinations for availability and correct routing without
      submitting applications, contact forms, or payments.
