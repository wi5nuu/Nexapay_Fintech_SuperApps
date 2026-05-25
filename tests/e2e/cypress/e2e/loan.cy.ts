import { generateTestUser } from '../support/commands';

describe('Loan Flow', () => {
  const user = generateTestUser();
  const apiUrl = Cypress.env('apiUrl');

  before(() => {
    cy.intercept('GET', `${apiUrl}/loans/**`).as('loanRequest');
    cy.intercept('POST', `${apiUrl}/loans/**`).as('loanMutation');

    cy.request({
      method: 'POST',
      url: `${Cypress.env('authUrl')}/test/setup`,
      body: { ...user, kycVerified: true, creditScore: 720 },
      failOnStatusCode: false,
    });
  });

  beforeEach(() => {
    cy.login({ email: user.email, password: user.password });
  });

  it('should display loan products', () => {
    cy.visit('/loans');
    cy.wait('@loanRequest');
    cy.getByTestId('loan-products-grid').should('be.visible');
    cy.getByTestId('loan-product-card').should('have.length.at.least', 1);
    cy.getByTestId('loan-product-card').first().within(() => {
      cy.getByTestId('product-name').should('be.visible');
      cy.getByTestId('product-interest-rate').should('be.visible');
      cy.getByTestId('product-max-amount').should('be.visible');
    });
  });

  it('should apply for a loan', () => {
    cy.visit('/loans/apply');
    cy.wait('@loanRequest');

    cy.getByTestId('loan-amount-input').clear().type('5000');
    cy.getByTestId('loan-tenure-select').click();
    cy.contains('[role="option"]', '12 months').click();
    cy.getByTestId('loan-purpose-input').type('Home renovation');
    cy.getByTestId('loan-employment-status-select').click();
    cy.contains('[role="option"]', 'Employed').click();
    cy.getByTestId('loan-monthly-income-input').clear().type('6000');
    cy.getByTestId('loan-submit').click();

    cy.wait('@loanMutation').its('response.statusCode').should('eq', 201);
    cy.waitForToast('Loan application submitted');
    cy.url().should('include', '/loans/status');
  });

  it('should display loan application status', () => {
    cy.visit('/loans');
    cy.wait('@loanRequest');

    cy.getByTestId('loan-applications-section').should('be.visible');
    cy.getByTestId('loan-application-card').should('have.length.at.least', 1);
    cy.getByTestId('loan-application-card').first().within(() => {
      cy.getByTestId('loan-amount').should('contain.text', '$5,000');
      cy.getByTestId('loan-status').should('be.visible');
      cy.getByTestId('loan-interest-rate').should('be.visible');
      cy.getByTestId('loan-created-date').should('be.visible');
    });
  });

  it('should view loan details', () => {
    cy.visit('/loans');
    cy.wait('@loanRequest');
    cy.getByTestId('loan-application-card').first().click();
    cy.url().should('include', '/loans/');

    cy.getByTestId('loan-detail-card').should('be.visible');
    cy.getByTestId('loan-detail-amount').should('be.visible');
    cy.getByTestId('loan-detail-status').should('be.visible');
    cy.getByTestId('loan-detail-schedule').should('be.visible');
    cy.getByTestId('loan-repayment-table').should('be.visible');
    cy.getByTestId('repayment-row').should('have.length.at.least', 1);
  });

  it('should make a loan repayment', () => {
    cy.visit('/loans');
    cy.wait('@loanRequest');
    cy.getByTestId('loan-application-card').first().click();
    cy.getByTestId('make-payment-button').click();
    cy.getByTestId('repayment-modal').should('be.visible');

    cy.getByTestId('repayment-amount-input').clear().type('500');
    cy.getByTestId('repayment-source-select').click();
    cy.contains('[role="option"]', 'Primary Wallet').click();
    cy.getByTestId('confirm-repayment').click();

    cy.wait('@loanMutation').its('response.statusCode').should('eq', 200);
    cy.waitForToast('Repayment successful');
    cy.getByTestId('repayment-modal').should('not.exist');
  });

  it('should reject loan application with insufficient credit', () => {
    cy.visit('/loans/apply');
    cy.getByTestId('loan-amount-input').clear().type('100000');
    cy.getByTestId('loan-tenure-select').click();
    cy.contains('[role="option"]', '6 months').click();
    cy.getByTestId('loan-purpose-input').type('Luxury purchase');
    cy.getByTestId('loan-submit').click();
    cy.wait('@loanMutation').its('response.statusCode').should('eq', 422);
    cy.waitForToast('Loan amount exceeds credit limit');
  });
});
