# Contributing to MySociety

## Development repository

All issues, branches, pull requests and ordinary development must happen in
`mysociety-development`.

Do not develop features directly in `mysociety-production`.

## Initial setup

````bash
git clone https://github.com/YOUR_ORGANIZATION/mysociety-development.git
cd mysociety-development
npm install
cp client/.env.example client/.env
cp server/.env.example server/.env
npm run dev
Starting a task
Find or create a GitHub issue.
Assign the issue to yourself.
Update your local develop branch.
Create a task branch from develop.
git switch develop
git pull origin develop
git switch -c feature/issue-number-short-description

Example:

git switch -c feature/26-create-complaint-api
Branch names

Use one of these prefixes:

feature/
fix/
chore/
docs/
refactor/
test/

Use lowercase kebab-case after the prefix.

Commit messages

Use concise conventional commit messages:

feat(complaints): add complaint creation endpoint
fix(auth): reject suspended users during login
test(payments): verify invalid signatures are rejected
docs(api): document complaint status endpoint
chore(ci): add GitHub Actions validation
Before opening a pull request

Run:

npm run validate

The command must complete successfully.

Pull requests

Pull requests must:

Target develop during normal development.
Link to a GitHub issue.
Have one clear purpose.
Pass all automated checks.
Receive at least one approval.
Resolve all review conversations.
Include screenshots for visible user-interface changes.
Include tests for important business behavior.
Prohibited actions

Do not:

Push directly to develop.
Push directly to main.
Force-push protected shared branches.
Commit .env files.
Commit access tokens or credentials.
Develop directly in the production repository.
Merge your own pull request without independent review.

Replace the repository URL placeholder.

---

# 20. Create GitHub Actions CI

Create:

```bash
touch .github/workflows/ci.yml

Add:

name: Continuous Integration

on:
  pull_request:
    branches:
      - develop
      - main

  push:
    branches:
      - develop
      - main

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality Gate
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Check formatting
        run: npm run format:check

      - name: Run ESLint
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build workspaces
        run: npm run build

GitHub’s official Node.js CI guidance uses repository checkout, Node setup, dependency installation and build/test commands in a workflow.

Important properties
npm ci

CI uses:

npm ci

rather than:

npm install

npm ci installs exactly what is recorded in package-lock.json and fails when the lock file and package manifest disagree.

Dependency cache
cache: npm

lets actions/setup-node cache npm’s package download data. It does not commit or reuse node_modules.

Concurrency
cancel-in-progress: true

cancels an older CI run when a developer pushes another commit to the same pull request.

Permissions
permissions:
  contents: read

gives the workflow only the repository permission needed to read the code.

No path filters

Do not initially use filters such as:

paths:
  - "client/**"

When a required workflow is skipped because of path filtering, the required check can remain pending and block merging. GitHub documents this behavior for required checks.
````
