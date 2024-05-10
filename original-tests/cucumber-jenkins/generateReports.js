import reporter from 'cucumber-html-reporter';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// HTML Report Options
const htmlOptions = {
    theme: 'bootstrap',
    jsonFile: path.join(reportsDir, 'cucumber_report.json'),
    output: path.join(reportsDir, 'cucumber_report.html'),
    reportSuiteAsScenarios: true,
    scenarioTimestamp: true,
    launchReport: true,
    metadata: {
        "App Version": "1.0.0",
        "Test Environment": "QA",
        "Browser": "Chrome",
        "Platform": "Windows 10",
        "Parallel": "Scenarios",
        "Executed": "Remote"
    }
};

try {
    // Generate HTML Report
    reporter.generate(htmlOptions);

    // Read JSON file
    const jsonData = JSON.parse(fs.readFileSync(path.join(reportsDir, 'cucumber_report.json'), 'utf8'));

    // Prepare CSV data
    const csvData = [];
    jsonData.forEach(feature => {
        feature.elements.forEach(scenario => {
            const scenarioData = {
                Feature: feature.name,
                Scenario: scenario.name,
                Status: scenario.steps.every(step => step.result.status === 'passed') ? 'PASSED' : 'FAILED',
                Duration: (scenario.steps.reduce((total, step) => total + (step.result.duration || 0), 0) / 1e9).toFixed(2) + 's',
                Steps: scenario.steps.length,
                PassedSteps: scenario.steps.filter(step => step.result.status === 'passed').length,
                FailedSteps: scenario.steps.filter(step => step.result.status === 'failed').length,
                Tags: scenario.tags.map(tag => tag.name).join(', ')
            };
            csvData.push(scenarioData);
        });
    });

    // CSV Fields
    const fields = ['Feature', 'Scenario', 'Status', 'Duration', 'Steps', 'PassedSteps', 'FailedSteps', 'Tags'];

    // Generate CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // Write CSV file
    fs.writeFileSync(path.join(reportsDir, 'test_results.csv'), csv);

    console.log('Reports generated successfully!');
} catch (error) {
    console.error('Error generating reports:', error);
    process.exit(1);
}

