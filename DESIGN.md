# CV & Cover Letter Generator - Design Document

## Single-Page Workflow
The entire application flow is on one page, organized into three steps:

1. **Profile**: Upload CV or enter details manually
2. **Job**: Paste or enter job description details
3. **Generate**: Live preview and download CV & Cover Letter

A horizontal step indicator highlights the current step. On mobile (<640px), steps collapse into an accordion.

## UI Components

- **Step Indicator**: Interactive circles with numbers and labels
- **Accordion**: Collapsible sections on mobile; only one open at a time
- **Profile Section**:
  - Tabs: Upload CV / Manual Entry
  - Form fields with validation, autosave, and example placeholders
- **Job Section**:
  - Tabs: URL Extraction / Manual Entry (description textarea)
  - Progress bar with estimated time during AI extraction
- **Generate Section**:
  - Live preview with toggles for formatted vs. plain-text
  - Download buttons for PDF and DOCX
  - Regenerate and edit-in-place options

## Mobile-First Design

- **Breakpoints**:
  - Mobile: <640px – accordion layout, full-width stacked
  - Tablet: 640–1024px – two-column cards
  - Desktop: >1024px – multi-column or full-width
- **Touch Targets**: Minimum 44×44px interactive areas
- **Font Sizes**: Base 16px on mobile, scalable in design system
- **Spacing**: 8px modular scale

## Styling & Theming

- **Design System**: `app-` prefixed utility classes defined in `app-design-system.css`
- **Color Palette**: Primary, Secondary, Success, Warning, Error (accessible contrast)
- **Typography**: Sans-serif base font, line-height 1.5
- **Icons**: Inline SVG with `app-icon` classes

## Accessibility

- Keyboard navigation and focus management
- ARIA roles and properties for tabs, accordion, and form fields
- Contrast ratio ≥4.5:1 for all text and icons 