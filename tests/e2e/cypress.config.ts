import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    execTimeout: 60000,
    taskTimeout: 60000,
    video: true,
    videoCompression: 32,
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    trashAssetsBeforeRuns: true,
    chromeWebSecurity: false,
    watchForFileChanges: false,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      apiUrl: 'http://localhost:3000/api',
      graphqlUrl: 'http://localhost:3000/graphql',
      authUrl: 'http://localhost:4001',
      walletUrl: 'http://localhost:4003',
      loanUrl: 'http://localhost:4004',
      kycUrl: 'http://localhost:4002',
      adminUrl: 'http://localhost:3000/admin',
      coverage: false,
      codeCoverage: {
        url: 'http://localhost:3000/__coverage__',
      },
    },
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-dev-shm-usage');
        }
        return launchOptions;
      });

      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(data) {
          console.table(data);
          return null;
        },
      });

      return config;
    },
  },
});
