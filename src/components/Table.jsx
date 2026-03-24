/* eslint-disable react/prop-types */
import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const Table = ({ data, columns, onSort, sortConfig }) => {
    
    // Helper function to render the correct sorting arrow (up, down, or none)
    const renderSortArrow = (columnKey) => {
        // Don't show an arrow if there's no sorting config or if it's for a different column
        if (!sortConfig || sortConfig.key !== columnKey) return null;
        
        if (sortConfig.direction === 'ascending') {
            return <FiArrowUp className="inline ml-1" />;
        }
        
        return <FiArrowDown className="inline ml-1" />;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Table Header (Not scrollable) */}
            <div className="flex-shrink-0">
                <table className="min-w-full table-fixed">
                    {/* `border-collapse: separate` is required for rounded corners on table headers */}
                    <thead style={{ borderCollapse: 'separate', borderSpacing: 0 }} className='bg-accent'>
                        <tr>
                            {/* Render table headers by mapping over the `columns` configuration array */}
                            {columns.map((col, index) => (
                                <th
                                    key={col.key}
                                    // The `onClick` handler for sorting is only attached if the column is sortable
                                    onClick={() => col.isSortable && onSort(col.key)}
                                    // Dynamically apply classes for cursor, and rounded corners on the first/last cells
                                    className={`
                                        px-6 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider
                                        ${col.isSortable ? 'cursor-pointer' : ''}
                                        ${index === 0 ? 'rounded-tl-xl' : ''}
                                        ${index === columns.length - 1 ? 'rounded-tr-xl' : ''}
                                    `}
                                    // Set a fixed width for the column to ensure header and body align
                                    style={{ width: col.width }}
                                >
                                    {col.header} {col.isSortable && renderSortArrow(col.key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>

            {/* Table Body (Scrollable) */}
            <div className="flex-grow overflow-y-auto">
                <table className="min-w-full table-fixed">
                    <tbody className="bg-background divide-y divide-gray-200">
                        {/* Check if there's data to display */}
                        {data.length > 0 ? (
                            // Map over the `data` array to create a row for each item
                            data.map((row, rowIndex) => (
                                <tr key={row._id || rowIndex} className="hover:bg-gray-50">
                                    {/* For each row, map over the `columns` config to create a cell for each column */}
                                    {columns.map((col) => (
                                        <td
                                            key={`${col.key}-${rowIndex}`}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-text-dark"
                                            // Set a fixed width for the cell to align with the header
                                            style={{ width: col.width }}
                                        >
                                            {/* 
                                                This is the core of the dynamic rendering.
                                                If the column config has a `render` function, use it.
                                                Otherwise, fall back to displaying the data directly using the `key`.
                                            */}
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            // Render a "No data" message if the `data` array is empty
                            <tr>
                                <td colSpan={columns.length} className="text-center py-10 text-text-light">
                                    No data found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;