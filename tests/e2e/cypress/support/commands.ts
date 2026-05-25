import { faker } from '@faker-js/faker';

interface LoginOptions {
  email?: string;
  password?: string;
  rememberMe?: boolean;
}

interface GraphQLOptions {
  operationName: string;
  query: string;
  variables?: Record<string, unknown>;
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(opts?: LoginOptions): Chainable<void>;
      loginByApi(opts?: LoginOptions): Chainable<Cypress.Response<void>>;
      interceptGraphQL(opts: GraphQLOptions, alias?: string): Chainable<void>;
      selectDropdown(selector: string, optionText: string): Chainable<void>;
      waitForToast(message?: string, timeout?: number): Chainable<void>;
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('login', (opts?: LoginOptions) => {
  const email = opts?.email || Cypress.env('testEmail') || 'test@nexapay.dev';
  const password = opts?.password || Cypress.env('testPassword') || 'TestPass123!';

  cy.session([email, password], () => {
    cy.visit('/login');
    cy.getByTestId('email-input').type(email);
    cy.getByTestId('password-input').type(password);
    cy.getByTestId('login-submit').click();
    cy.url().should('not.include', '/login');
    cy.getCookie('access_token').should('exist');
  });
});

Cypress.Commands.add('loginByApi', (opts?: LoginOptions) => {
  const email = opts?.email || 'test@nexapay.dev';
  const password = opts?.password || 'TestPass123!';
  const apiUrl = Cypress.env('apiUrl');

  return cy.request({
    method: 'POST',
    url: `${apiUrl}/auth/login`,
    body: { email, password },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add('interceptGraphQL', (opts: GraphQLOptions, alias?: string) => {
  const aliasName = alias || opts.operationName;

  cy.intercept('POST', Cypress.env('graphqlUrl'), (req) => {
    if (req.body.operationName === opts.operationName) {
      req.alias = aliasName;
      if (opts.variables) {
        req.body.variables = { ...req.body.variables, ...opts.variables };
      }
    }
  });
});

Cypress.Commands.add('selectDropdown', (selector: string, optionText: string) => {
  cy.get(selector).click();
  cy.get(`[role="option"]`).contains(optionText).click();
});

Cypress.Commands.add('waitForToast', (message?: string, timeout = 10000) => {
  if (message) {
    cy.getByTestId('toast-container').should('contain.text', message, { timeout });
  } else {
    cy.getByTestId('toast-container', { timeout }).should('be.visible');
  }
});

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

function generateTestUser() {
  return {
    email: faker.internet.email(),
    password: 'StrongP@ss123!',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number('+1##########'),
  };
}

export { generateTestUser };
