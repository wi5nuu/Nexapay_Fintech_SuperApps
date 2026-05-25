import './commands';

before(() => {
  cy.log('NexaPay E2E test suite starting');
  cy.session('warmup', () => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/health`,
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status !== 200) {
        cy.log(`WARNING: API health check returned ${resp.status}. Ensure services are running.`);
      }
    });
  });
});

beforeEach(() => {
  cy.log(`Starting test: ${Cypress.currentTest.title}`);
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});

afterEach(function onAfterEach() {
  if (this.currentTest?.state === 'failed') {
    cy.log(`Test failed: ${this.currentTest.title}`);
    cy.screenshot(`FAILED_${this.currentTest.title.replace(/[^a-zA-Z0-9]/g, '_')}`, {
      capture: 'fullPage',
    });
  }
  cy.log(`Finished test: ${this.currentTest.title}`);
});

after(() => {
  cy.log('NexaPay E2E test suite completed');
});

Cypress.on('uncaught:exception', (err) => {
  cy.log(`Uncaught exception: ${err.message}`);
  if (err.message.includes('ResizeObserver') || err.message.includes('NetworkError')) {
    return false;
  }
  return true;
});

Cypress.on('fail', (err) => {
  cy.log(`Cypress failure: ${err.message}`);
  throw err;
});
