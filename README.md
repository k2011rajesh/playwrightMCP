# Playwright MCP - Test Automation Suite

[![Playwright Tests](https://github.com/k2011rajesh/playwrightMCP/actions/workflows/playwright-tests.yml/badge.svg)](https://github.com/k2011rajesh/playwrightMCP/actions)
[![Live Allure Report](https://img.shields.io/badge/Live%20Report-Allure-brightgreen)](https://k2011rajesh.github.io/playwrightMCP/allure/)

A comprehensive Playwright test automation suite with Jira/Xray integration, Allure reporting, self-healing locators, and API testing.

## 📊 Live Reports & Dashboards

- **[View Latest Allure Report](https://k2011rajesh.github.io/playwrightMCP/allure/)** - Live interactive dashboard with all test results
- **[GitHub Actions](https://github.com/k2011rajesh/playwrightMCP/actions)** - Real-time test execution and status
- **Test Results:** 14 tests | ✅ 100% Pass Rate

## Features

- **UI Testing:** Playwright browser automation with self-healing locator strategies
- **API Testing:** REST API testing with GET, POST, PUT, DELETE operations
- **Self-Healing:** Resilient locators with multi-strategy fallback and retry logic
- **Allure Reports:** Beautiful interactive test reports with timeline and metrics
- **Email Notifications:** Automated notifications to k2011.rajesh@gmail.com after each report generation
- **Jira Integration:** Automatic test-case mapping with Jira issue keys
- **Xray Upload:** Direct test result import to Jira via Xray Cloud API
- **CI/CD Ready:** GitHub Actions workflow with automatic report publishing
- **Git Integration:** Complete version control setup
- **GitHub Pages:** Live dashboard for test reports

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Installation

```bash
git clone <repository>
cd PlaywrightMCP
npm install
npx playwright install
```

### Running Tests

```bash
# Run all tests (UI + API)
npm run test:local

# Run API tests only
npm run test:api

# Run UI tests only
npx playwright test tests/self-healing.spec.ts tests/demo.spec.ts

# Run single URL test
npm run test:single

# Run with JUnit reporter
npm test
```

### Viewing Reports

```bash
# Generate and open Allure report
npm run allure:report

# Just open existing report
npm run allure:open

# Run tests, generate report, and send email notification
npm run test:full

# Send email for existing report
npm run notify:email
```

## 📧 Email Notifications

Get automatic email notifications whenever tests complete and reports are generated!

### Setup (One-Time)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password** at https://myaccount.google.com/apppasswords
3. **Add GitHub Secrets:**
   - `EMAIL_FROM`: Your Gmail address
   - `EMAIL_PASSWORD`: The generated app password  
   - `EMAIL_TO`: Recipient email (optional)

### Local Testing

```bash
# Set environment variables (PowerShell example)
$env:EMAIL_FROM = "your-email@gmail.com"
$env:EMAIL_PASSWORD = "your-app-password"
$env:EMAIL_TO = "recipient@gmail.com"

# Run tests and send email
npm run test:full

# Or just send email for existing report
npm run notify:email
```

**→ Full guide: [EMAIL_NOTIFICATION_SETUP.md](EMAIL_NOTIFICATION_SETUP.md)**

## Test Cases Summary

**Total: 14 tests (100% pass rate)**

### API Tests (10 tests - `tests/api.spec.ts`)
- PROJ-201 to PROJ-210: JSONPlaceholder and httpbin REST APIs

### UI Tests (4 tests)
- PROJ-101: Homepage Playwright (demo.spec.ts)
- PROJ-102: Self-healing demo site (self-healing.spec.ts)
- PROJ-103: Self-healing form interaction
- Single URL run (single.spec.ts)

## Git Workflow

### Initial Setup

```bash
# Repository already initialized with .gitignore
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Initial commit
git commit -m "Initial: Playwright suite with API, UI, self-healing, and Jira integration"

# Push to remote (after adding remote)
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

### Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feature/new-tests

# Make changes and test
npm run test:local

# Commit changes
git add .
git commit -m "feat: add new test cases"

# Push to remote
git push origin feature/new-tests

# Create Pull Request on GitHub
# GitHub Actions will automatically run tests
## npm Scripts

```bash
npm test                # Run all with JUnit
npm run test:local      # Run all locally
npm run test:api        # API tests only
npm run test:single     # Single URL test
npm run test:allure     # Tests + Allure report
npm run test:full       # Tests + Allure + Email notification
npm run allure:open     # Open Allure report
npm run allure:report   # Tests + open report
npm run upload:xray     # Upload to Xray
npm run notify:email    # Send email for existing report
```

## GitHub Actions CI/CD

Automated testing on every push and pull request:
- Runs on `main` and `develop` branches
- Installs dependencies
- Runs all Playwright tests
- Generates Allure report
- Sends email notification (if configured)
- Uploads artifacts
- Deploys to GitHub Pages
- Comments on PRs with results

**Workflow file:** `.github/workflows/playwright-tests.yml`

## Jira/Xray Integration

### Upload Results to Xray

```bash
export XRAY_CLIENT_ID=<your_client_id>
export XRAY_CLIENT_SECRET=<your_client_secret>
export XRAY_TEST_EXEC=PROJ-EXEC-1  # Optional

npm run upload:xray
```

## Project Structure

```
.
├── tests/
│   ├── api.spec.ts              # API tests
│   ├── demo.spec.ts             # Demo UI test
│   ├── self-healing.spec.ts     # Self-healing tests
│   ├── single.spec.ts           # Single URL test
│   └── helpers/
│       └── self-healing.ts      # Locator utilities
├── scripts/
│   ├── upload-xray.js           # Xray upload
│   └── xray-samples.md          # API docs
├── .github/
│   └── workflows/
│       └── playwright-tests.yml # CI/CD
├── .gitignore                    # Git ignore rules
├── playwright.config.ts          # Playwright config
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Configuration Files

### .gitignore
Excludes: node_modules, test results, allure reports, IDE files, logs

### .github/workflows/playwright-tests.yml
GitHub Actions workflow for automated testing and reporting

### playwright.config.ts
- Reporters: JUnit + Allure
- Browser: Chromium (headless)
- Test directory: `./tests`

## Troubleshooting

**API tests not in Allure?**
```bash
rm -rf allure-results allure-report
npm run test:local
npm run allure:open
```

**Git commit fails?**
```bash
# Check git config
git config --list

# Set credentials if needed
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
```

**Tests failing locally?**
```bash
npx playwright install
npm run test:local --headed  # View browser
```

## License

ISC
