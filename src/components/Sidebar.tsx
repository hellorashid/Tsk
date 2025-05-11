import React, { useState } from 'react';

interface SidebarProps {
  filters: {
    id: string;
    label: string;
    count?: number;
  }[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  onCreateFilter?: (filterName: string, labels: string[]) => void;
  accentColor?: string;
  isDarkMode?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  onCreateFilter,
  accentColor = '#1F1B2F',
  isDarkMode = true
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterLabels, setNewFilterLabels] = useState('');

  const handleCreateFilter = () => {
    if (newFilterName.trim() && onCreateFilter) {
      // Split labels by comma and trim whitespace
      const labels = newFilterLabels
        .split(',')
        .map(label => label.trim())
        .filter(label => label !== '');
      
      onCreateFilter(newFilterName.trim(), labels);
      setNewFilterName('');
      setNewFilterLabels('');
      setIsCreating(false);
    }
  };

  return (
    <div className={`w-48 h-full p-0 mt-4 overflow-y-auto flex flex-col ${
      isDarkMode ? 'text-gray-100' : 'text-gray-900' 
    }`}>
      <div className={`bg-opacity-40 rounded-r-md py-0 backdrop-blur-sm overflow-hidden`}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`w-full text-left px-4 py-2 transition-colors focus:outline-none 
              ${
              activeFilter === filter.id
                ? `bg-[${accentColor}] bg-opacity-80`
                : `bg-[${accentColor}] bg-opacity-40 hover:bg-opacity-30`
            }

            ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}
         
            `
          }
          >
            <div className="flex justify-between items-center">
              <span className="text-sm">{filter.label}</span>
              {filter.count !== undefined && (
                <span className={`${isDarkMode ? 'bg-white/10 text-gray-200' : 'bg-gray-200 text-gray-800'} px-2 py-1 rounded-full text-xs`}>
                  {filter.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 ">
        {isCreating ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              placeholder="Filter name"
              className="input input-sm w-full bg-white/10 text-white placeholder-white/50 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFilter();
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFilterName('');
                  setNewFilterLabels('');
                }
              }}
            />
            <input
              type="text"
              value={newFilterLabels}
              onChange={(e) => setNewFilterLabels(e.target.value)}
              placeholder="Labels (comma separated)"
              className="input input-sm w-full bg-white/10 text-white placeholder-white/50 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFilter();
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFilterName('');
                  setNewFilterLabels('');
                }
              }}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreateFilter}
                className="btn btn-sm btn-primary flex-1"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewFilterName('');
                  setNewFilterLabels('');
                }}
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full btn btn-sm btn-ghost text-slate-200 hover:bg-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Filter
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 