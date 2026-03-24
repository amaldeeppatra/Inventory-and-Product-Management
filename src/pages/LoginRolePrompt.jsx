import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaStore, FaUserShield } from 'react-icons/fa';

const LoginRolePrompt = () => {
  const navigate = useNavigate();
  const query = new URLSearchParams(window.location.search);
  const role = query.get("role");
  const token = query.get("token");

  const handleChoice = (selectedRole) => {
    if (selectedRole === "CUSTOMER") {
      navigate(`/homepage?token=${token}`);
    } else if (selectedRole === "SELLER") {
      navigate(`/seller/dashboard?token=${token}`);
    } else if (selectedRole === "ADMIN") {
      navigate(`/admin?token=${token}`);
    }
  };

  const roleOptions = [
    {
      key: "CUSTOMER",
      label: "Customer",
      icon: FaUserCircle,
      description: "Browse and order products",
      show: true
    },
    {
      key: "SELLER",
      label: "Seller",
      icon: FaStore,
      description: "Manage your store",
      show: role === "SELLER"
    },
    {
      key: "ADMIN",
      label: "Admin",
      icon: FaUserShield,
      description: "Access admin panel",
      show: role === "ADMIN"
    }
  ];

  return (
    <div className="min-h-screen bg-background bg-cover bg-center flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Card */}
        <div className="bg-white/30 backdrop-blur-lg rounded-3xl p-8 shadow-lg mb-6 text-center">
          <div className="w-20 h-20 bg-tertiary rounded-full mx-auto mb-4 flex items-center justify-center">
            <FaUserCircle className="text-white text-5xl" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            Welcome Back!
          </h2>
          <p className="text-primary opacity-70">
            Select how you'd like to continue
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-4">
          {roleOptions.filter(option => option.show).map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.key}
                onClick={() => handleChoice(option.key)}
                className="w-full bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group"
              >
                <div className="flex items-center">
                  <div className="bg-tertiary p-4 rounded-xl text-white mr-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-3xl" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold text-primary mb-1">
                      {option.label}
                    </h3>
                    <p className="text-sm text-primary opacity-70">
                      {option.description}
                    </p>
                  </div>
                  <div className="text-primary opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg 
                      className="w-6 h-6" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Text */}
        <p className="text-center text-primary opacity-60 text-sm mt-6">
          Choose your role to access the appropriate dashboard
        </p>
      </div>
    </div>
  );
};

export default LoginRolePrompt;