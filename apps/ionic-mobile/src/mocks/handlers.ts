import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/auth/login', () => {
    return HttpResponse.json({ 
      user: { id: '1', name: 'NexaUser' }, 
      tokens: { accessToken: 'fake-jwt-token' } 
    });
  }),
  http.get('/wallet', () => {
    return HttpResponse.json({ 
      balance: 2500.50, 
      currency: 'USD', 
      accountNumber: '1234567890' 
    });
  }),
];
