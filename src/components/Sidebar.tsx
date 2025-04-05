import React from 'react';

interface SidebarProps {
  filters: {
    id: string;
    label: string;
    count?: number;
  }[];
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ filters, activeFilter, onFilterChange }) => {
  return (
    <div className="w-64 h-full pt-12 text-white p-4 overflow-y-auto">
      <div className="space-y-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`w-full text-left px-4 py-2 rounded-md transition-colors focus:outline-none ${
              activeFilter === filter.id
                ? 'bg-[#1F1B2F]/80 text-white'
                : 'hover:bg-white/10 text-slate-200'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{filter.label}</span>
              {filter.count !== undefined && (
                <span className="bg-white/10 text-slate-200 px-2 py-1 rounded-full text-xs">
                  {filter.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 