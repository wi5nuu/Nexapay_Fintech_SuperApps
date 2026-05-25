import { generateTestUser } from '../support/commands';

describe('KYC Flow', () => {
  const user = generateTestUser();
  const apiUrl = Cypress.env('apiUrl');

  before(() => {
    cy.intercept('GET', `${apiUrl}/kyc/**`).as('kycRequest');
    cy.intercept('POST', `${apiUrl}/kyc/**`).as('kycMutation');

    cy.request({
      method: 'POST',
      url: `${Cypress.env('authUrl')}/test/setup`,
      body: user,
      failOnStatusCode: false,
    });
  });

  beforeEach(() => {
    cy.login({ email: user.email, password: user.password });
    cy.visit('/kyc');
    cy.wait('@kycRequest');
  });

  it('should display KYC status page', () => {
    cy.getByTestId('kyc-status-card').should('be.visible');
    cy.getByTestId('kyc-current-status').should('contain.text', 'Not Started');
    cy.getByTestId('kyc-start-button').should('be.visible').and('be.enabled');
  });

  it('should submit KYC application', () => {
    cy.getByTestId('kyc-start-button').click();
    cy.getByTestId('kyc-form').should('be.visible');

    cy.getByTestId('kyc-full-name-input').type(`${user.firstName} ${user.lastName}`);
    cy.getByTestId('kyc-dob-input').type('1990-01-15');
    cy.getByTestId('kyc-nationality-select').click();
    cy.contains('[role="option"]', 'United States').click();
    cy.getByTestId('kyc-address-line1-input').type('123 Main Street');
    cy.getByTestId('kyc-city-input').type('New York');
    cy.getByTestId('kyc-state-input').type('NY');
    cy.getByTestId('kyc-zip-input').type('10001');
    cy.getByTestId('kyc-ssn-input').type('123-45-6789');
    cy.getByTestId('kyc-submit').click();

    cy.wait('@kycMutation').its('response.statusCode').should('eq', 201);
    cy.waitForToast('KYC application submitted');
    cy.getByTestId('kyc-current-status').should('contain.text', 'Pending Review');
  });

  it('should upload KYC documents', () => {
    cy.getByTestId('kyc-documents-section').should('be.visible');
    cy.getByTestId('kyc-upload-passport').click();

    cy.getByTestId('file-input').selectFile({
      contents: Cypress.Buffer.from('fake passport image'),
      fileName: 'passport.png',
      mimeType: 'image/png',
    });
    cy.getByTestId('confirm-upload').click();
    cy.wait('@kycMutation').its('response.statusCode').should('eq', 200);
    cy.waitForToast('Document uploaded');

    cy.getByTestId('kyc-upload-selfie').click();
    cy.getByTestId('file-input').selectFile({
      contents: Cypress.Buffer.from('fake selfie image'),
      fileName: 'selfie.png',
      mimeType: 'image/png',
    });
    cy.getByTestId('confirm-upload').click();
    cy.wait('@kycMutation');
    cy.waitForToast('Document uploaded');

    cy.getByTestId('kyc-upload-proof-of-address').click();
    cy.getByTestId('file-input').selectFile({
      contents: Cypress.Buffer.from('fake utility bill'),
      fileName: 'utility-bill.pdf',
      mimeType: 'application/pdf',
    });
    cy.getByTestId('confirm-upload').click();
    cy.wait('@kycMutation');
    cy.waitForToast('Document uploaded');
  });

  it('should display KYC status after submission', () => {
    cy.getByTestId('kyc-status-card').should('be.visible');
    cy.getByTestId('kyc-stage-name').should('contain.text', 'Document Verification');
    cy.getByTestId('kyc-progress-bar').should('be.visible');
    cy.getByTestId('kyc-documents-count').should('contain.text', '3');

    cy.getByTestId('kyc-timeline').within(() => {
      cy.getByTestId('kyc-timeline-step').should('have.length.at.least', 1);
      cy.getByTestId('kyc-timeline-step').first().should('contain.text', 'Submitted');
    });
  });

  it('should show error for invalid KYC data', () => {
    cy.getByTestId('kyc-start-button').click();
    cy.getByTestId('kyc-submit').click();
    cy.getByTestId('kyc-form-error').should('be.visible');
    cy.getByTestId('kyc-form-error').should('contain.text', 'required');
  });
});
