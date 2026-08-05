# Wedding Venue Media Design

**Date:** 2026-08-05

## Goal

Enhance the wedding information section by adding a venue photo and an external venue link inside the existing left-side event card without changing the current two-column layout.

## Confirmed Requirements

- Keep the current two-column structure in the `#events` section.
- Add the hall image from `images/hall.jpg` inside the left event information card.
- Add a link to `https://thenewwed.kr/` as a supporting venue action.
- Make the image and link feel natural within the existing invitation content rather than as a separate block.
- Preserve the current date, venue name, address, and countdown card behavior.

## Recommended Approach

Extend the existing left invitation card with a compact venue preview area placed between the invitation copy and the metadata list:

- Show the hall image as a full-width preview within the card.
- Place a short link action directly below the image.
- Keep the existing metadata list under the preview so the information hierarchy remains stable.

This is the best fit because it adds venue context where guests already read the ceremony details, while avoiding a larger layout change or a visual imbalance against the countdown card.

## Architecture

### 1. Invitation Card Content Flow

The left card keeps its current title and invitation copy. After that copy:

- Insert a venue preview image using `images/hall.jpg`.
- Insert a short venue link such as "장소 자세히 보기" or equivalent.
- Keep the existing metadata list after the new preview block.

This creates the reading order:

1. Invitation context
2. Venue atmosphere preview
3. Venue details

### 2. Venue Preview Presentation

The new preview block should visually match the existing card language:

- Rounded corners aligned with the current card style.
- A restrained shadow or border tone consistent with the card.
- Spacing that separates the image from both the invitation copy above and the metadata list below.

The image should remain a horizontal thumbnail sized to the card width, not a gallery-style interactive element.

### 3. Link Behavior

The venue link should behave as a standard external action:

- Open the venue site in a new tab.
- Include safe external-link attributes.
- Be styled as a small supporting call-to-action rather than a primary button.

## Component Responsibilities

- `index.html`
  - Add the venue image and venue link markup to the left event card.
- `styles/main.css`
  - Add styles for the venue preview block, image treatment, and supporting link presentation.
- Existing countdown-related scripts
  - No behavioral changes required.

## Data Flow

1. The event section renders its static invitation content.
2. The new venue preview image loads from `images/hall.jpg`.
3. The venue link points to `https://thenewwed.kr/`.
4. Guests can view the venue atmosphere inline and choose to open the external venue site.

## Error Handling

- If the image fails to load, the rest of the invitation card content should remain readable and intact.
- If the external site is unavailable, the link simply behaves as a normal failed external navigation; no custom fallback is required.
- The new markup should not affect layout stability on mobile screens.

## Testing Strategy

### Markup Verification

Verify:

- The left event card contains the new venue image.
- The left event card contains the external venue link with correct URL and external-link attributes.
- The metadata list remains present below the venue preview block.

### Layout Verification

Verify in the browser:

- The two-column event layout is unchanged on desktop.
- The image scales correctly within the card.
- The mobile stacked layout remains readable and balanced.
- The link remains visible and tappable without crowding the metadata list.

## Scope Notes

- This change is limited to the `예식 안내` section.
- The countdown card remains in place.
- No gallery, map, or navigation behavior changes are included.
