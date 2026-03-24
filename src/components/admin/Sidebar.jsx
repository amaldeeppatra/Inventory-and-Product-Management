import React from 'react';
// Step 1: Import NavLink instead of using local state
import { NavLink } from 'react-router-dom'; 
import { FiClock, FiBox, FiRepeat } from "react-icons/fi";
import logo from '../../resources/homepage/ShreeAnnaAbhiyanLogo.png';
import { RxDashboard } from "react-icons/rx";

const Sidebar = () => {
    // Step 2: Remove the useState. React Router will now manage the active state.
    // const [activeTab, setActiveTab] = useState('Dashboard');

    // Your data structure is perfect. We'll rename `route` to `path` for consistency with React Router, but `route` also works.
    const navItems = [
        { name: 'Products', icon: <RxDashboard />, path: '/admin/products' },
        { name: 'Sellers', icon: <FiClock />, path: '/admin/sellers' },
        { name: 'Requests', icon: <FiBox />, path: '/admin/requests' }
    ];

    return (
        <aside className="w-64 bg-accent text-text-dark py-6 px-2 flex flex-col h-screen fixed">
            <div className="flex flex-col items-center mb-12">
                <img src={logo} alt="Shree Anna Abhiyan" className="w-24 h-24 rounded-full object-cover mb-4" />
                <h1 className="text-xl font-bold text-primary text-center">Shree Anna Abhiyan</h1>
            </div>
            <nav>
                <ul>
                    {navItems.map(item => (
                        <li key={item.name} className="mb-4">
                            {/* Step 3: Replace <a> with NavLink and update className logic */}
                            <NavLink 
                                to={item.path}
                                // NavLink provides `isActive` to its className function.
                                // We use it to apply your exact active/inactive styles.
                                className={({ isActive }) =>
                                    `flex items-center py-3 px-4 rounded-lg transition-all duration-300 ${ // Added px-4 for better padding
                                        isActive 
                                        ? 'bg-secondary text-primary font-semibold shadow-sm' // Your active class
                                        : 'hover:bg-secondary/50' // Your inactive/hover class
                                    }`
                                }
                            >
                                <span className="text-xl mr-4">{item.icon}</span>
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;