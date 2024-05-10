import { Given, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { logins, verifyLogin } from '../../tests.js';

setDefaultTimeout(60 * 1000);

Given('I am on the login page', async function () {
    try {
        // Store the login handler in the world context so we can use it in other steps
        this.loginHandler = await logins();
        console.log('Login page loaded successfully');
    } catch (error) {
        // Re-throw the error so Cucumber can mark the test as failed
        throw new Error(`Failed to load login page: ${error.message}`);
    }
});

Then('I should be logged in successfully', async function () {
    try {
        if (!this.loginHandler) {
            throw new Error('Login handler not found. Make sure the "Given" step executed successfully.');
        }

        // Verify login was successful with proper assertions
        await verifyLogin(this.loginHandler);
        console.log('Login verification passed - user is logged in successfully');
    } catch (error) {
        // Re-throw the error so Cucumber can mark the test as failed
        throw new Error(`Login verification failed: ${error.message}`);
    }
});

