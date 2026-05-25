describe('Wallet Flow', () => {
  const apiUrl = Cypress.env('apiUrl');

  before(() => {
    cy.intercept('GET', `${apiUrl}/wallet/**`).as('walletRequest');
    cy.intercept('POST', `${apiUrl}/wallet/**`).as('walletMutation');
    cy.intercept('GET', `${apiUrl}/wallet/transactions**`).as('transactionsRequest');
  });

  beforeEach(() => {
    cy.login();
    cy.visit('/wallet');
    cy.wait('@walletRequest');
  });

  it('should display wallet balance', () => {
    cy.getByTestId('wallet-balance').should('be.visible');
    cy.getByTestId('wallet-balance-amount').should('contain.text', '$');
    cy.getByTestId('wallet-currency').should('be.visible');
    cy.getByTestId('wallet-status').should('contain.text', 'Active');
  });

  it('should top-up wallet', () => {
    cy.getByTestId('top-up-button').click();
    cy.getByTestId('top-up-modal').should('be.visible');

    cy.getByTestId('amount-input').clear().type('100.00');
    cy.getByTestId('payment-method-select').click();
    cy.contains('[role="option"]', 'Credit Card').click();
    cy.getByTestId('card-number-input').type('4111111111111111');
    cy.getByTestId('card-expiry-input').type('12/28');
    cy.getByTestId('card-cvv-input').type('123');
    cy.getByTestId('confirm-top-up').click();

    cy.wait('@walletMutation').its('response.statusCode').should('eq', 200);
    cy.waitForToast('Top-up successful');
    cy.getByTestId('top-up-modal').should('not.exist');
  });

  it('should perform P2P transfer', () => {
    const recipientEmail = 'recipient@nexapay.dev';
    const transferAmount = '25.00';

    cy.getByTestId('send-money-button').click();
    cy.getByTestId('send-money-modal').should('be.visible');

    cy.getByTestId('recipient-input').type(recipientEmail);
    cy.getByTestId('amount-input').clear().type(transferAmount);
    cy.getByTestId('note-input').type('Test P2P transfer');
    cy.getByTestId('confirm-transfer').click();

    cy.wait('@walletMutation').its('response.statusCode').should('eq', 200);
    cy.waitForToast('Transfer successful');
    cy.getByTestId('send-money-modal').should('not.exist');
  });

  it('should reject duplicate P2P transfer (idempotency)', () => {
    const idempotencyKey = `test-idemp-${Date.now()}`;

    cy.getByTestId('send-money-button').click();
    cy.getByTestId('recipient-input').type('recipient@nexapay.dev');
    cy.getByTestId('amount-input').clear().type('25.00');
    cy.getByTestId('confirm-transfer').click();

    cy.wait('@walletMutation').then((intercept) => {
      const firstStatus = intercept.response?.statusCode;
      expect(firstStatus).to.be.oneOf([200, 201]);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/wallet/transfer`,
        headers: { 'Idempotency-Key': idempotencyKey },
        body: { recipient: 'recipient@nexapay.dev', amount: 25.0, note: 'Idempotency test' },
        failOnStatusCode: false,
      }).then((dupResp) => {
        expect(dupResp.status).to.be.eq(409);
        expect(dupResp.body).to.have.property('error', 'DUPLICATE_REQUEST');
      });
    });
  });

  it('should verify transaction history', () => {
    cy.getByTestId('transaction-history-tab').click();
    cy.wait('@transactionsRequest');

    cy.getByTestId('transaction-list').should('be.visible');
    cy.getByTestId('transaction-item').should('have.length.at.least', 2);

    cy.getByTestId('transaction-item').first().within(() => {
      cy.getByTestId('transaction-type').should('be.visible');
      cy.getByTestId('transaction-amount').should('be.visible');
      cy.getByTestId('transaction-status').should('be.visible');
      cy.getByTestId('transaction-date').should('be.visible');
    });

    cy.getByTestId('transaction-filter').click();
    cy.contains('[role="option"]', 'Top-up').click();
    cy.wait('@transactionsRequest');
    cy.getByTestId('transaction-item').each(($el) => {
      cy.wrap($el).findByTestId('transaction-type').should('contain.text', 'Top-up');
    });
  });
});
