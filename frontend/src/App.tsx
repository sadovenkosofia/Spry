import { useEffect, useState } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  async function checkUserAndLoadData() {
    try {
      // 1. Перевіряємо, чи залогінений користувач
      await getCurrentUser();
      setIsAuthenticated(true);

      // 2. Отримуємо токен авторизації
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      // 3. Запитуємо розклад, передаючи токен у заголовку
      const response = await fetch('ВАШ_BACKEND_API_URL/meetings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMeetings(data);

    } catch (err) {
      // Якщо користувач НЕ залогінений — відправляємо на Cognito Login
      setIsAuthenticated(false);
      window.location.href = 
        'https://spry-shymchuk-auth.auth.us-east-1.amazoncognito.com/login?client_id=1tkojgihgq5cgt7987jg0faqpo&response_type=code&scope=email+openid+profile&redirect_uri=https://d3b5dueyhkda58.cloudfront.net/';
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Завантаження розкладу...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8 text-center">Перенаправлення на вхід...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Мій розклад</h1>
      {/* Рендеринг списку мітингів */}
      <ul>
        {meetings.map((meeting) => (
          <li key={meeting.id} className="p-2 border-b">
            {meeting.title} - {meeting.date}
          </li>
        ))}
      </ul>
    </div>
  );
}
