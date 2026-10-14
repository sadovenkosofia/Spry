import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      await getCurrentUser();
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      window.location.href = 
        'https://spry-shymchuk-auth.auth.us-east-1.amazoncognito.com/login?client_id=1tkojgihgq5cgt7987jg0faqpo&response_type=code&scope=email+openid+profile&redirect_uri=https://d3b5dueyhkda58.cloudfront.net/';
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Завантаження...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8 text-center">Перенаправлення на вхід...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Spry Meetings</h1>
      {/* Вставити ваш стандартний компонент списку мітингів */}
    </div>
  );
}
