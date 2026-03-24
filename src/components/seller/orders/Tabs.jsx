import React from 'react';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
    return (
        // This is the outer container with the border
        <div className="border border-gray-200 rounded-xl p-1">
            {/* 
                THE GRID CONTAINER:
                - grid: Activates CSS Grid.
                - grid-cols-2: On small screens (mobile), creates a 2x2 grid.
                - md:grid-cols-4: On medium screens and up, creates a 1x4 grid.
                - gap-1: A small space between the tabs.
            */}
            <nav className="grid grid-cols-2 md:grid-cols-4 gap-1" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={`
                            whitespace-nowrap w-full py-2 px-4 text-sm font-medium transition-colors duration-200 rounded-lg text-center
                            focus:outline-none
                            ${activeTab === tab.key
                                ? 'bg-accent text-primary font-semibold' // Active tab style
                                : 'text-text-light hover:bg-accent/50 hover:text-primary' // Inactive tab style
                            }
                        `}
                    >
                        {tab.name}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default Tabs;