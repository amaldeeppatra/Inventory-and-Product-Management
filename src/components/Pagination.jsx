import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="py-3 px-6 flex items-center justify-between text-sm text-text-light border-t">
            <span>
                {startItem} - {endItem} of {totalItems}
            </span>
            <div className="flex items-center gap-4">
                <span>The page is</span>
                <button className="flex items-center gap-1">
                    {currentPage} <FiChevronDown />
                </button>
                <div className="flex gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiChevronLeft />
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;