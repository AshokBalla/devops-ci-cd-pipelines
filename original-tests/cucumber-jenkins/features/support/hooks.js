import { Before, After, Status } from '@cucumber/cucumber';
import JiraIntegration from '../../jiraIntegration.js';

const jiraIntegration = new JiraIntegration();

// Extract Jira issue key from scenario tags
function getJiraIssueKey(scenario) {
    // First check for direct issue tag
    const jiraTag = scenario.pickle.tags.find(tag =>
        tag.name.startsWith('@TA-') ||
        tag.name.startsWith('@JIRA-TA-')
    );

    if (jiraTag) {
        // Remove @ and JIRA- prefix if present
        return jiraTag.name.substring(1).replace('JIRA-', '');
    }

    // If no specific tag found, return the project key from env
    return process.env.JIRA_PROJECT_KEY;
}

Before(async function () {
    // Initialize world context for each scenario
    this.loginHandler = null;
});

After(async function (scenario) {
    // Clean up browser if it exists
    if (this.loginHandler && this.loginHandler.browser) {
        try {
            await this.loginHandler.close();
        } catch (error) {
            console.error(`Error closing browser: ${error.message}`);
        }
    }

    // Update Jira with test results
    try {
        // Only attempt Jira update if Jira is configured
        if (!jiraIntegration.isConfigured()) {
            console.log('Jira is not configured. Skipping Jira update.');
            return;
        }

        const issueKey = getJiraIssueKey(scenario);
        if (issueKey) {
            // Get the actual test status
            const testStatus = scenario.result.status;
            const status = jiraIntegration.mapStatusToJira(testStatus);

            // Build detailed comment with error information if test failed
            let comment = `Test executed on ${new Date().toISOString()}\n` +
                `Scenario: ${scenario.pickle.name}\n` +
                `Status: ${testStatus}`;

            // If test failed, include error details
            if (testStatus === Status.FAILED && scenario.result.exception) {
                comment += `\n\nError Details:\n${scenario.result.exception.message}`;
                if (scenario.result.exception.stack) {
                    comment += `\n\nStack Trace:\n${scenario.result.exception.stack}`;
                }
            }

            console.log(`Updating Jira issue: ${issueKey} with status: ${testStatus}`);
            await jiraIntegration.updateTestResult(issueKey, status, comment);
        }
    } catch (error) {
        console.error(`Failed to update Jira issue: ${error.message}`);
        // Don't fail the test if Jira update fails, but log the error
    }
});

