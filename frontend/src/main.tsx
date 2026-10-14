import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App';
import './index.css';

// Налаштування зв'язку з вашим Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_QfVDPfEjl',
      userPoolClientId: '1tkojgihgq5cgt7987jg0faqpo',
      loginWith: {
        oauth: {
          domain: 'spry-shymchuk-auth.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['https://d3b5dueyhkda58.cloudfront.net/'],
          redirectSignOut: ['https://d3b5dueyhkda58.cloudfront.net/'],
          responseType: 'code'
        }
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
