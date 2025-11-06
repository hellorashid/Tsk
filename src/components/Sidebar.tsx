import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SidebarProps {
  // Filter props commented out for now
  // filters: {
  //   id: string;
  //   label: string;
  //   count?: number;
  // }[];
  // activeFilter: string;
  // onFilterChange: (filterId: string) => void;
  // onCreateFilter?: (filterName: string, labels: string[]) => void;
  accentColor?: string;
  isDarkMode?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  // filters,
  // activeFilter,
  // onFilterChange,
  // onCreateFilter,
  accentColor = '#1F1B2F',
  isDarkMode = true
}) => {
  // Filter-related state and handlers - commented out for now
  // const [isCreating, setIsCreating] = useState(false);
  // const [newFilterName, setNewFilterName] = useState('');
  // const [newFilterLabels, setNewFilterLabels] = useState('');
  // const [isNewFilterButtonHovered, setIsNewFilterButtonHovered] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // const handleCreateFilter = () => {
  //   if (newFilterName.trim() && onCreateFilter) {
  //     // Split labels by comma and trim whitespace
  //     const labels = newFilterLabels
  //       .split(',')
  //       .map(label => label.trim())
  //       .filter(label => label !== '');

  //     onCreateFilter(newFilterName.trim(), labels);
  //     setNewFilterName('');
  //     setNewFilterLabels('');
  //     setIsCreating(false);
  //   }
  // };

  // const getStyle = (filter : any) => { 
  //   if (activeFilter === filter.id) {
  //     return {
  //       backgroundColor: `${accentColor}80`,
  //       backgroundOpacity: 1
  //     }
  //   } else {
  //     return {
  //       backgroundColor: `${accentColor}40`,
  //       backgroundOpacity: 0.4,
  //     }
  //   }
  // }


  return (
    <div
      className={`w-48 h-full p-0 mt-4 overflow-y-auto flex flex-col ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
    >
      {/* Filter UI - commented out for now */}
      {/* <div
        className={`rounded-r-md py-0 backdrop-blur-sm overflow-hidden`}
        style={{ backgroundColor: `${accentColor}66` }}
      >
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            style={getStyle(filter)}
            className={`w-full text-left px-4 py-2 transition-colors focus:outline-none 
              hover:opacity-70 
            ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
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

      <div className="mt-0 pt-2 ">
        {isCreating ? (
          <div className="space-y-2 p-2">
            <input
              type="text"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              placeholder="Filter name"
              className="px-3 py-2 text-sm w-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md border border-white/20"
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
              className="px-3 py-2 text-sm w-full bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-md border border-white/20"
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
                className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 flex-1"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewFilterName('');
                  setNewFilterLabels('');
                }}
                className={`px-3 py-2 text-sm bg-transparent hover:bg-white/10 rounded-md transition-colors duration-200 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <motion.button
            initial="hidden"
            animate={isSidebarHovered ? "visible" : "hidden"}
            variants={{
              visible: { opacity: 1, y: 0 },
              hidden: { opacity: 0, y: -10 },
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => setIsCreating(true)}
            className={`w-full rounded-none rounded-r-md px-3 py-2 text-sm bg-transparent hover:bg-white/10 transition-colors duration-200 flex items-center ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}
            onMouseEnter={() => setIsNewFilterButtonHovered(true)}
            onMouseLeave={() => setIsNewFilterButtonHovered(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Filter
          </motion.button>
        )}
      </div> */}
    </div>
  );
};

export default Sidebar; 