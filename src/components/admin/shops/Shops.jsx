import React, { useState } from 'react';
import Tabs from '../../seller/orders/Tabs';
import CreateShopForm from './CreateShopForm';
import AllShopsTable from './AllShopsTable';

const Shops = () => {
    // State to manage which tab is active: 'create' or 'all'
    const [activeTab, setActiveTab] = useState('all');

    const tabs = [
        { name: 'All Shops', key: 'all' },
        { name: 'Add New Shop', key: 'create' },
    ];

    return (
        <div className="space-y-4 px-3 bg-background">
            <div>
                <p className="text-sm text-text-light">Dashboard ▸ Shops</p>
                <h1 className="text-3xl font-bold text-text-dark mt-1">Shops</h1>
            </div>

            {/* Tabs for All Shops and Add New Shop */}
             <div className="rounded-xl ">
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
            </div>

            {/* Add this div with mt-4 for spacing */}
            <div className="mt-4">
                {activeTab === 'create' ? (
                    <CreateShopForm />
                ) : (
                    <AllShopsTable />
                )}
            </div>
        </div>
    );
};

export default Shops;