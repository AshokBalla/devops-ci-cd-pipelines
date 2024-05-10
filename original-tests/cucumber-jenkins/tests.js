import puppeteer from 'puppeteer';

class LoginHandler {
    constructor(page) {
        this.page = page;
        this.browser = null;
        this.timeout = 30000; // 30 seconds default timeout
    }

    async init() {
        try {
            this.browser = await puppeteer.launch({
                headless: false,
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                slowMo: 10,
                args: ['--start-maximized'],
                defaultViewport: null
            });
            this.page = await this.browser.newPage();
            this.page.setDefaultTimeout(this.timeout);
        } catch (error) {
            throw new Error(`Failed to initialize browser: ${error.message}`);
        }
    }

    async logins(username = 'Admin', password = 'Qedge123!@#') {
        try {
            // Navigate to login page and verify it loaded
            await this.page.goto('http://orangehrm.qedgetech.com/', {
                waitUntil: 'networkidle2',
                timeout: this.timeout
            });

            // Verify we're on the login page by checking for login form elements
            await this.page.waitForSelector('input[name="txtUsername"]', { timeout: 10000 });
            await this.page.waitForSelector('input[name="txtPassword"]', { timeout: 10000 });
            await this.page.waitForSelector('input[name="Submit"]', { timeout: 10000 });

            // Fill in credentials
            await this.page.type('input[name="txtUsername"]', username, { delay: 50 });
            await this.page.type('input[name="txtPassword"]', password, { delay: 50 });

            // Click submit and wait for navigation
            await Promise.all([
                this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
                this.page.click('input[name="Submit"]')
            ]);

        } catch (error) {
            throw new Error(`Login failed: ${error.message}`);
        }
    }

    async verifyLoginSuccess() {
        try {
            // Wait for dashboard or any element that indicates successful login
            // Common indicators: dashboard URL, welcome message, menu items, etc.
            await this.page.waitForSelector('#menu_dashboard_index, #welcome, #menu_admin_viewAdminModule', {
                timeout: 10000
            });

            // Verify we're not on the login page anymore
            const currentUrl = this.page.url();
            if (currentUrl.includes('auth/login') || currentUrl.includes('login')) {
                throw new Error('Still on login page - login may have failed');
            }

            // Check for error messages that might indicate login failure
            const errorMessage = await this.page.$eval('span#spanMessage', el => el.textContent).catch(() => null);
            if (errorMessage && errorMessage.trim()) {
                throw new Error(`Login error message found: ${errorMessage}`);
            }

            return true;
        } catch (error) {
            // Take screenshot for debugging
            await this.page.screenshot({ path: 'reports/login_failure.png' }).catch(() => { });
            throw new Error(`Login verification failed: ${error.message}`);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time);
        });
    }
}

export const logins = async function () {
    const loginhandler = new LoginHandler();
    await loginhandler.init();
    await loginhandler.logins();
    // Store handler in a way that step definitions can access it
    return loginhandler;
}

export const verifyLogin = async function (loginHandler) {
    if (!loginHandler) {
        throw new Error('Login handler not initialized');
    }
    await loginHandler.verifyLoginSuccess();
    return loginHandler;
}

