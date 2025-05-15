# CV & Cover Letter Generator - Project TODO List

## One-Page Workflow & Mobile UX
- [ ] Implement unified Profile → Job → Generate single-page flow
- [ ] Ensure responsive design: tabs collapse to accordion on mobile (<640px)
- [ ] Add step indicator with progress status
- [ ] Merge ProfileInput, JobInput, and DocumentPreview into one workflow component
- [ ] Implement autosave and idle detection for form fields
- [ ] Include context-sensitive tooltips and help text

## Testing & Quality Assurance
- [ ] Add Cypress end-to-end tests with mobile emulation
- [ ] Write unit tests for the unified workflow component
- [ ] Implement API endpoint tests for document generation and parsing
- [ ] Integrate continuous integration checks in GitHub Actions (lint, tests)

## Performance & Optimization
- [ ] Lazy-load components to reduce initial bundle size
- [ ] Optimize API calls and implement caching strategies
- [ ] Measure and improve initial page load speed (Lighthouse scores)
- [ ] Implement content security policies and rate limiting

## Documentation & Cleanup
- [ ] Update README.md with new one-page flow and architecture overview
- [ ] Rewrite DESIGN.md with mobile-first style guidelines and component specs
- [ ] Consolidate all deployment instructions into Deployment.md
- [ ] Prune obsolete documentation (LinkedIn OAuth, separate deployment docs)

## Future Enhancements
- [ ] Add paid subscription and usage limits on document generation
- [ ] Enhance template selection UI and preview options
- [ ] Support additional document formats (ODT, HTML export)
- [ ] Implement multi-language support and localization 