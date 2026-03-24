import React, { useState } from 'react';
import Tabs from '../../seller/orders/Tabs';
import CreateProductForm from './CreateProductForm';
import AllProductsTable from './AllProductsTable';

const Products = () => {
    // State to manage which tab is active: 'create' or 'all'
    const [activeTab, setActiveTab] = useState('create'); 

    const tabs = [
        { name: 'Create New Product', key: 'create' },
        { name: 'All Products', key: 'all' },
    ];

    return (
        <div className="space-y-4 px-3 bg-background">
            <div>
                <p className="text-sm text-text-light">Dashboard ▸ Products</p>
                <h1 className="text-3xl font-bold text-text-dark mt-1">Products</h1>
            </div>

            {/* Tabs for Create New Product and All Products */}
             <div className="rounded-xl ">
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
            </div>

            {/* Add this div with mt-4 for spacing */}
            <div className="mt-4">
                {activeTab === 'create' ? (
                    <CreateProductForm />
                ) : (
                    <AllProductsTable />
                )}
            </div>
        </div>
    );
};

export default Products;