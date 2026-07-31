## Summary

Explain what this pull request changes and why the change is required.

## Related issue

Closes #

## Change type

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Test
- [ ] Documentation
- [ ] Configuration or tooling

## Changes made

-
-
-

## Testing performed

Describe the commands and manual checks used to verify this work.

````bash
npm run validate
User-interface evidence

Add screenshots or recordings for visible frontend changes.

Not applicable when:

 This pull request has no visible user-interface changes.
API impact
 No API changes
 New endpoint
 Existing endpoint changed
 Existing endpoint removed
 Request validation changed
 Response structure changed

Document affected endpoints:

Database impact
 No database changes
 Schema changed
 Index added or changed
 Seed data changed
 Data migration required

Explain the impact:

Security review
 Input is validated
 Authentication is applied where required
 Authorization is applied where required
 Society-level data isolation is preserved
 No credentials or secrets are committed
 Sensitive data is not written to logs
Final checklist
 The pull request has one clear purpose
 The branch was created from the latest develop
 Formatting passes
 ESLint passes
 Tests pass
 Production builds pass
 Documentation was updated where required
 I reviewed my own changes

The `Closes #` syntax connects the pull request to its issue and allows GitHub to close the issue when the pull request merges.

---

# 15. Create the feature issue form

Create:

```bash
touch .github/ISSUE_TEMPLATE/feature.yml

Add:

name: Feature
description: Plan a new user-facing or technical feature
title: "feat: "
labels:
  - feature
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: Explain the user or system problem this feature solves.
      placeholder: Residents currently cannot...
    validations:
      required: true

  - type: textarea
    id: user-story
    attributes:
      label: User story
      description: Describe the user, desired action and expected benefit.
      placeholder: |
        As a resident,
        I want to raise a complaint,
        so that the committee can resolve it.
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Acceptance criteria
      description: Add objective, testable completion conditions.
      placeholder: |
        - [ ] Required fields are validated
        - [ ] Authorized users can complete the action
        - [ ] Unauthorized users receive an appropriate error
    validations:
      required: true

  - type: textarea
    id: technical-notes
    attributes:
      label: Technical notes
      description: Add expected endpoints, models, permissions or dependencies.
      placeholder: |
        Endpoint:
        Database model:
        Roles:
        Dependencies:

  - type: dropdown
    id: area
    attributes:
      label: Primary area
      options:
        - Client
        - Server
        - Full stack
        - Database
        - DevOps
        - Documentation
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - Low
        - Medium
        - High
        - Critical
    validations:
      required: true
````
