import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import FormData from 'form-data';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class JiraIntegration {
    constructor() {
        // Normalize Jira URL - remove trailing slashes
        const baseUrl = process.env.JIRA_BASE_URL;
        this.jiraBaseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : null;
        this.jiraEmail = process.env.JIRA_EMAIL;
        this.jiraApiToken = process.env.JIRA_API_TOKEN;
        this.projectKey = process.env.JIRA_PROJECT_KEY;

        // Validate required configuration
        if (!this.jiraBaseUrl) {
            console.warn('JIRA_BASE_URL is not set in environment variables. Jira integration will be disabled.');
        }
    }

    // Check if values are placeholder/template values
    isPlaceholderValue(value) {
        if (!value) return true;
        const placeholderPatterns = [
            /your-domain\.atlassian\.net/i,
            /your-email@example\.com/i,
            /your-api-token/i,
            /your-api-token-here/i,
            /example\.com/i,
            /placeholder/i,
            /^your-/i
        ];
        return placeholderPatterns.some(pattern => pattern.test(value));
    }

    isConfigured() {
        // Check if all required values exist and are not placeholders
        const hasBaseUrl = this.jiraBaseUrl && !this.isPlaceholderValue(this.jiraBaseUrl);
        const hasEmail = this.jiraEmail && !this.isPlaceholderValue(this.jiraEmail);
        const hasToken = this.jiraApiToken && !this.isPlaceholderValue(this.jiraApiToken);

        return !!(hasBaseUrl && hasEmail && hasToken);
    }

    getAuthHeader() {
        const auth = Buffer.from(`${this.jiraEmail}:${this.jiraApiToken}`).toString('base64');
        return {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        };
    }

    async attachFileToIssue(issueKey, filePath, fileName) {
        try {
            if (!this.isConfigured()) {
                console.warn('Jira is not configured. Skipping file attachment.');
                return null;
            }

            console.log(`Attempting to attach ${fileName} to Jira issue ${issueKey}`);

            // Read the file as a Buffer
            const fileData = await fs.promises.readFile(filePath);

            // Create form data
            const form = new FormData();
            form.append('file', fileData, {
                filename: fileName,
                contentType: fileName.endsWith('.html') ? 'text/html' : 'text/csv'
            });

            // Attach the file to the issue
            const response = await axios.post(
                `${this.jiraBaseUrl}/rest/api/3/issue/${issueKey}/attachments`,
                form,
                {
                    headers: {
                        ...this.getAuthHeader(),
                        'X-Atlassian-Token': 'no-check',
                        ...form.getHeaders()
                    },
                    validateStatus: false
                }
            );

            if (response.status !== 200 && response.status !== 201) {
                console.error(`Failed to attach ${fileName}:`, response.status, response.data);
                throw new Error(`Failed to attach ${fileName}: ${response.status}`);
            }

            console.log(`Successfully attached ${fileName} to Jira issue ${issueKey}`);
            return response.data;
        } catch (error) {
            console.error(`Error attaching ${fileName} to Jira:`, error.message);
            throw error;
        }
    }

    async updateTestResult(issueKey, status, comment) {
        try {
            if (!this.isConfigured()) {
                console.warn('Jira is not configured. Skipping test result update.');
                return null;
            }

            console.log(`Attempting to update Jira issue ${issueKey} with status ${status}`);

            // First add the comment (catch errors but continue)
            let commentResponse = null;
            try {
                commentResponse = await this.addComment(issueKey, comment);
            } catch (commentError) {
                console.warn(`Failed to add comment to issue ${issueKey}: ${commentError.message}`);
                // Continue with status update even if comment fails
            }

            // Then update the status (catch errors but continue)
            try {
                await this.updateIssueStatus(issueKey, status);
            } catch (statusError) {
                console.warn(`Failed to update status for issue ${issueKey}: ${statusError.message}`);
                // Continue with file attachments even if status update fails
            }

            // Create reports directory if it doesn't exist
            const reportsDir = path.join(__dirname, 'reports');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            // Attach the HTML report (catch errors but continue)
            const htmlReportPath = path.join(reportsDir, 'cucumber_report.html');
            if (fs.existsSync(htmlReportPath)) {
                try {
                    console.log('Attaching HTML report...');
                    await this.attachFileToIssue(issueKey, htmlReportPath, 'cucumber_report.html');
                } catch (attachError) {
                    console.warn(`Failed to attach HTML report: ${attachError.message}`);
                }
            } else {
                console.warn('HTML report file not found');
            }

            // Attach the CSV report (catch errors but continue)
            const csvReportPath = path.join(reportsDir, 'test_results.csv');
            if (fs.existsSync(csvReportPath)) {
                try {
                    console.log('Attaching CSV report...');
                    await this.attachFileToIssue(issueKey, csvReportPath, 'test_results.csv');
                } catch (attachError) {
                    console.warn(`Failed to attach CSV report: ${attachError.message}`);
                }
            } else {
                console.warn('CSV report file not found');
            }

            console.log(`Completed Jira update attempt for issue ${issueKey}`);
            return commentResponse;
        } catch (error) {
            console.error('Error updating Jira:', error.message);
            // Don't throw - allow test to continue even if Jira update fails
            return null;
        }
    }

    async generateAndAttachCSVReport(issueKey, csvPath) {
        try {
            // Read the cucumber JSON report
            const jsonReportPath = path.join(__dirname, 'reports', 'cucumber_report.json');
            const jsonReport = JSON.parse(await fs.promises.readFile(jsonReportPath, 'utf8'));

            // Convert to CSV format
            let csvContent = 'Feature,Scenario,Status,Duration\n';

            jsonReport.forEach(feature => {
                feature.elements.forEach(scenario => {
                    const duration = scenario.steps.reduce((total, step) =>
                        total + (step.result.duration || 0), 0) / 1e9; // Convert to seconds

                    csvContent += `"${feature.name}","${scenario.name}","${scenario.result.status}","${duration.toFixed(2)}s"\n`;
                });
            });

            // Write CSV file
            await fs.promises.writeFile(csvPath, csvContent);

            // Attach to Jira
            await this.attachFileToIssue(issueKey, csvPath, 'test_results.csv');
        } catch (error) {
            console.error('Error generating/attaching CSV report:', error.message);
            throw error;
        }
    }

    async addComment(issueKey, comment) {
        if (!this.isConfigured()) {
            throw new Error('Jira is not configured. Cannot add comment.');
        }

        const commentData = {
            body: {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                text: comment,
                                type: "text"
                            }
                        ]
                    }
                ]
            }
        };

        try {
            const response = await axios.post(
                `${this.jiraBaseUrl}/rest/api/3/issue/${issueKey}/comment`,
                commentData,
                {
                    headers: this.getAuthHeader(),
                    validateStatus: false
                }
            );

            if (response.status !== 201 && response.status !== 200) {
                // Provide more detailed error information
                let errorMsg = `Failed to add comment: ${response.status}`;
                if (response.status === 404) {
                    errorMsg += ` - Issue ${issueKey} not found or URL is incorrect. Please verify the Jira URL and issue key.`;
                } else if (response.status === 401 || response.status === 403) {
                    errorMsg += ` - Authentication failed. Please check your Jira credentials.`;
                } else if (response.data && response.data.errorMessages) {
                    errorMsg += ` - ${response.data.errorMessages.join(', ')}`;
                }
                throw new Error(errorMsg);
            }

            return response.data;
        } catch (error) {
            // Handle network errors or invalid URLs
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw new Error(`Cannot connect to Jira at ${this.jiraBaseUrl}. Please verify the JIRA_BASE_URL is correct.`);
            }
            throw error;
        }
    }

    async updateIssueStatus(issueKey, status) {
        try {
            if (!this.isConfigured()) {
                throw new Error('Jira is not configured. Cannot update issue status.');
            }

            // First get available transitions
            const transitionsResponse = await axios.get(
                `${this.jiraBaseUrl}/rest/api/3/issue/${issueKey}/transitions`,
                {
                    headers: this.getAuthHeader(),
                    validateStatus: false
                }
            );

            if (transitionsResponse.status === 404) {
                console.warn(`Issue ${issueKey} not found. Skipping status update.`);
                return;
            }

            if (transitionsResponse.status !== 200) {
                throw new Error(`Failed to get transitions: ${transitionsResponse.status}`);
            }

            const transitions = transitionsResponse.data.transitions;
            const transition = transitions.find(t => t.name.toLowerCase() === status.toLowerCase());

            if (transition) {
                // Perform the transition
                const updateResponse = await axios.post(
                    `${this.jiraBaseUrl}/rest/api/3/issue/${issueKey}/transitions`,
                    {
                        transition: { id: transition.id }
                    },
                    {
                        headers: this.getAuthHeader(),
                        validateStatus: false
                    }
                );

                if (updateResponse.status !== 204 && updateResponse.status !== 200) {
                    throw new Error(`Failed to update issue status: ${updateResponse.status}`);
                }
            } else {
                console.warn(`No transition found for status: ${status}`);
            }
        } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                throw new Error(`Cannot connect to Jira at ${this.jiraBaseUrl}. Please verify the JIRA_BASE_URL is correct.`);
            }
            console.error('Error updating issue status:', error.message);
            throw error;
        }
    }

    mapStatusToJira(cucumberStatus) {
        switch (cucumberStatus.toLowerCase()) {
            case 'passed':
                return 'Done';
            case 'failed':
                return 'To Do';
            case 'skipped':
                return 'In Progress';
            default:
                return 'To Do';
        }
    }

    async updateJiraIssue(issueKey, status) {
        try {
            if (!this.isConfigured()) {
                throw new Error('Jira is not configured. Cannot update Jira issue.');
            }

            const response = await axios({
                method: 'PUT',
                url: `${this.jiraBaseUrl}/rest/api/3/issue/${issueKey}`,
                auth: {
                    username: this.jiraEmail,
                    password: this.jiraApiToken
                },
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                data: {
                    fields: {
                        status: {
                            name: status
                        }
                    }
                }
            });

            console.log(`Successfully updated Jira issue ${issueKey}`);
            return response;
        } catch (error) {
            console.error('Error updating Jira:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            throw error;
        }
    }
}

export default JiraIntegration;

