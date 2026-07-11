import React from 'react';

interface MobileNavBarProps {
  currentView: 'tasks' | 'calendar';
  onViewChange: (view: 'tasks' | 'calendar') => void;
  onCreateNew: () => void;
  accentColor?: string;
  isDarkMode?: boolean;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentView,
  onViewChange,
  onCreateNew,
  accentColor = '#1F1B2F',
  isDarkMode = true
}) => {
  const getBackgroundColor = () => {
    return `${accentColor}E6`; // 90% opacity
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
      }}
    >
      <div className="flex justify-center px-4 mb-2">
        <div
          className="flex items-center justify-center gap-5 px-2 py-2 rounded-full backdrop-blur-3xl shadow-lg border"
          style={{
            backgroundColor: getBackgroundColor(),
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Tasks Button */}
          <button
            onClick={() => onViewChange('tasks')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
              currentView === 'tasks'
                ? isDarkMode
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-800 text-white'
                : isDarkMode
                  ? 'text-gray-300 hover:bg-white/10'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-label="Tasks"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </button>

          {/* Create New Button */}
          <button
            onClick={onCreateNew}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
              isDarkMode
                ? 'text-gray-300 hover:bg-white/10'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-label="Create New"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>

          {/* Calendar Button */}
          <button
            onClick={() => onViewChange('calendar')}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
              currentView === 'calendar'
                ? isDarkMode
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-800 text-white'
                : isDarkMode
                  ? 'text-gray-300 hover:bg-white/10'
                  : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-label="Calendar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNavBar;

