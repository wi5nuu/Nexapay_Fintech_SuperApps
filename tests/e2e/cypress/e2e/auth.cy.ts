import { generateTestUser } from '../support/commands';

describe('Authentication Flow', () => {
  const user = generateTestUser();
  const apiUrl = Cypress.env('apiUrl');

  before(() => {
    cy.intercept('POST', `${apiUrl}/auth/**`).as('authRequest');
    cy.intercept('POST', `${apiUrl}/auth/2fa/**`).as('twoFactorRequest');
  });

  it('should register a new user', () => {
    cy.visit('/register');
    cy.getByTestId('first-name-input').type(user.firstName);
    cy.getByTestId('last-name-input').type(user.lastName);
    cy.getByTestId('email-input').type(user.email);
    cy.getByTestId('phone-input').type(user.phone);
    cy.getByTestId('password-input').type(user.password);
    cy.getByTestId('confirm-password-input').type(user.password);
    cy.getByTestId('terms-checkbox').check();
    cy.getByTestId('register-submit').click();

    cy.wait('@authRequest').its('response.statusCode').should('eq', 201);
    cy.waitForToast('Account created successfully');
    cy.url().should('include', '/verify-email');
  });

  it('should verify email', () => {
    cy.visit(`/verify-email?email=${encodeURIComponent(user.email)}`);
    cy.getByTestId('verification-code-input').type('123456');
    cy.getByTestId('verify-submit').click();

    cy.wait('@authRequest').its('response.statusCode').should('eq', 200);
    cy.waitForToast('Email verified successfully');
    cy.url().should('include', '/login');
  });

  it('should login with credentials', () => {
    cy.visit('/login');
    cy.getByTestId('email-input').type(user.email);
    cy.getByTestId('password-input').type(user.password);
    cy.getByTestId('login-submit').click();

    cy.wait('@authRequest').its('response.statusCode').should('eq', 200);
    cy.url().should('include', '/2fa-setup');
  });

  it('should complete 2FA setup', () => {
    cy.visit('/2fa-setup');
    cy.getByTestId('qr-code').should('be.visible');
    cy.getByTestId('totp-input').type('123456');
    cy.getByTestId('verify-2fa-submit').click();

    cy.wait('@twoFactorRequest').its('response.statusCode').should('eq', 200);
    cy.waitForToast('2FA enabled successfully');
    cy.url().should('include', '/dashboard');
  });

  it('should access protected routes when authenticated', () => {
    cy.login({ email: user.email, password: user.password });

    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.getByTestId('dashboard-content').should('be.visible');

    cy.visit('/profile');
    cy.getByTestId('profile-content').should('be.visible');

    cy.visit('/settings');
    cy.getByTestId('settings-content').should('be.visible');
  });

  it('should redirect to login when accessing protected routes unauthenticated', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});
