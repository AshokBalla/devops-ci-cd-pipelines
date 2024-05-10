# Cucumber Jenkins Test Automation

This project contains automated tests for the OrangeHRM application using Puppeteer, Cucumber.js, and Jira integration.

## 🚀 Features

- Automated UI testing using Puppeteer
- BDD testing with Cucumber.js
- Jira integration for test results
- HTML and CSV report generation
- Automatic test result updates to Jira issues

## 📋 Prerequisites

- Node.js (v14 or higher)
- Google Chrome browser
- Jira account with API access (optional)
- OrangeHRM test environment access

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Jira integration (optional):
   
   The `.env` file has been created with template values. Update it with your actual Jira credentials:
   
   ```env
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-api-token
   JIRA_PROJECT_KEY=TA
   ```
   
   **Important Notes:**
   - `JIRA_BASE_URL` should NOT have a trailing slash (e.g., `https://mycompany.atlassian.net`)
   - Get your API token from: https://id.atlassian.com/manage-profile/security/api-tokens
   - If Jira is not configured, tests will still run but skip Jira updates

## 🧪 Running Tests

### Run tests only:
```bash
npm test
```

### Run tests with Jira integration and report generation:
```bash
npm run test:jira
```

## 📁 Project Structure

```
cucumber-jenkins/
├── features/
│   ├── login.feature          # Test scenarios (Gherkin)
│   ├── step_def/
│   │   └── steps.js           # Step definitions
│   └── support/
│       └── hooks.js           # Before/After hooks
├── reports/                   # Generated test reports
├── tests.js                   # Test logic (login automation)
├── jiraIntegration.js          # Jira API integration
├── generateReports.js         # Report generation
├── package.json
└── .env                       # Environment variables (create from .env.example)
```

## 📊 Reports

After running tests, reports are generated in the `reports/` directory:
- `cucumber_report.html` - HTML test report
- `cucumber_report.json` - JSON test report
- `test_results.csv` - CSV test results

## 🔗 Jira Integration

Tests can be linked to Jira issues using tags in feature files:
- `@TA-1` - Links to Jira issue TA-1
- `@JIRA-TA-1` - Alternative format

Test results are automatically updated in Jira when using `npm run test:jira`.

