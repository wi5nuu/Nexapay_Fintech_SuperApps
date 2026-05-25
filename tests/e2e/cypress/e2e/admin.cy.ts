describe('Admin Panel Flow', () => {
  const apiUrl = Cypress.env('apiUrl');

  before(() => {
    cy.intercept('GET', `${apiUrl}/admin/**`).as('adminRequest');
    cy.intercept('POST', `${apiUrl}/admin/**`).as('adminMutation');
    cy.intercept('GET', `${apiUrl}/admin/audit-logs**`).as('auditLogsRequest');
  });

  beforeEach(() => {
    cy.login({ email: 'admin@nexapay.dev', password: 'AdminPass123!' });
    cy.visit('/admin');
    cy.wait('@adminRequest');
  });

  it('should display admin dashboard', () => {
    cy.getByTestId('admin-dashboard').should('be.visible');
    cy.getByTestId('admin-stats-grid').should('be.visible');
    cy.getByTestId('stat-card').should('have.length.at.least', 4);
    cy.getByTestId('stat-card').first().within(() => {
      cy.getByTestId('stat-label').should('be.visible');
      cy.getByTestId('stat-value').should('be.visible');
    });
  });

  it('should view users list', () => {
    cy.getByTestId('nav-users').click();
    cy.wait('@adminRequest');
    cy.url().should('include', '/admin/users');

    cy.getByTestId('users-table').should('be.visible');
    cy.getByTestId('user-row').should('have.length.at.least', 1);
    cy.getByTestId('user-row').first().within(() => {
      cy.getByTestId('user-email').should('be.visible');
      cy.getByTestId('user-status').should('be.visible');
      cy.getByTestId('user-kyc-status').should('be.visible');
      cy.getByTestId('user-created-date').should('be.visible');
    });
  });

  it('should search and filter users', () => {
    cy.getByTestId('nav-users').click();
    cy.getByTestId('search-input').type('test@nexapay.dev');
    cy.wait('@adminRequest');

    cy.getByTestId('filter-status').click();
    cy.contains('[role="option"]', 'Active').click();
    cy.wait('@adminRequest');

    cy.getByTestId('user-row').should('have.length.at.least', 1);
  });

  it('should approve KYC for a user', () => {
    cy.getByTestId('nav-users').click();
    cy.wait('@adminRequest');

    cy.getByTestId('user-row').first().within(() => {
      cy.getByTestId('user-kyc-status').then(($status) => {
        if ($status.text().includes('Pending')) {
          cy.getByTestId('view-user-button').click();
        }
      });
    });

    cy.getByTestId('user-detail-modal').should('be.visible');
    cy.getByTestId('kyc-section').should('be.visible');
    cy.getByTestId('approve-kyc-button').click();
    cy.getByTestId('confirm-approve-kyc').click();

    cy.wait('@adminMutation').its('response.statusCode').should('eq', 200);
    cy.waitForToast('KYC approved');
    cy.getByTestId('user-kyc-status').should('contain.text', 'Approved');
  });

  it('should view audit logs', () => {
    cy.getByTestId('nav-audit-logs').click();
    cy.wait('@auditLogsRequest');
    cy.url().should('include', '/admin/audit-logs');

    cy.getByTestId('audit-logs-table').should('be.visible');
    cy.getByTestId('audit-log-row').should('have.length.at.least', 1);
    cy.getByTestId('audit-log-row').first().within(() => {
      cy.getByTestId('log-action').should('be.visible');
      cy.getByTestId('log-actor').should('be.visible');
      cy.getByTestId('log-timestamp').should('be.visible');
      cy.getByTestId('log-details').should('be.visible');
    });
  });

  it('should filter audit logs by action type', () => {
    cy.getByTestId('nav-audit-logs').click();
    cy.wait('@auditLogsRequest');

    cy.getByTestId('audit-filter-action').click();
    cy.contains('[role="option"]', 'KYC_APPROVE').click();
    cy.wait('@auditLogsRequest');

    cy.getByTestId('audit-log-row').each(($row) => {
      cy.wrap($row).findByTestId('log-action').should('contain.text', 'KYC_APPROVE');
    });
  });

  it('should restrict admin access for non-admin users', () => {
    cy.login({ email: 'user@nexapay.dev', password: 'UserPass123!' });
    cy.visit('/admin');
    cy.wait('@adminRequest').its('response.statusCode').should('eq', 403);
    cy.waitForToast('Access denied');
    cy.url().should('not.include', '/admin/dashboard');
  });
});
