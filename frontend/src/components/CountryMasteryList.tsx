import { useEffect, useState } from 'react';
import { CountryMastery } from '@/types/meta';

export function CountryMasteryList() {
  const [masteries, setMasteries] = useState<CountryMastery[]>([]);

  useEffect(() => {
    fetch('/api/v2/mastery', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setMasteries(data.masteries || []))
      .catch(err => console.error('Failed to load mastery:', err));
  }, []);

  if (masteries.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        🌍 Country Mastery
      </h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {masteries.map((mastery) => (
          <div 
            key={mastery.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          >
            <div className="flex items-center gap-3">
              <img 
                src={`https://flagcdn.com/w40/${mastery.country_code.toLowerCase()}.png`}
                alt={mastery.country_code}
                className="w-8 h-6 object-cover rounded"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Level {mastery.level}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {mastery.correct}✓ / {mastery.incorrect}✗
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {mastery.xp} XP
              </p>
              <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(mastery.xp % 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
