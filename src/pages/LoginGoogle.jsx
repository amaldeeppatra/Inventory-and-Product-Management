// src/components/LoginGoogle.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../resources/logos/shreeannayojana.png';
import CircularIndeterminate from '../components/atoms/CircularIndeterminate';
import bg from '../resources/login/loginpage.png';

const API_URL = import.meta.env.VITE_API_URL;

const LoginGoogle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // --- FIXED: Corrected the typo from API__URL to API_URL. ---
    axios.get(`${API_URL}/auth/login/success`, { withCredentials: true })
      .then(response => {
        console.log('User is already authenticated:', response.data);
        navigate('/homepage');
      })
      .catch(err => {
        console.warn('User is not authenticated. Showing login page.');
        setLoading(false); // Stop loading to display the login page.
      });
  }, [navigate]);

  const handleGoogleSignIn = () => {
    setError(null);
    try {
      // Initiate the OAuth flow by redirecting to your backend's Google auth endpoint.
      window.location.href = `${API_URL}/auth/google`;
    } catch (err) {
      console.error('Error initiating Google Sign-In:', err);
      setError('Sign-In failed. Please check your connection and try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularIndeterminate />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col p-4"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <main className="flex-1 flex flex-col items-center justify-center">

        <img
          src={logo}
          alt="Shree Anna Yojana Logo"
          className="w-[25rem] h-[25rem] mb-8 transform translate-y-8"
        />

        <div className="bg-[#FFF9F4] rounded-2xl shadow-md p-8 w-full max-w-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-center text-orange-600 mb-6">
            Sign In to your account
          </h2>

          <button
            onClick={handleGoogleSignIn}
            className="w-full font-semibold bg-white border border-gray-200 rounded-full shadow-md px-4 py-3 flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
              alt="Google logo"
              className="w-6 h-6"
            />
            Continue with Google
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center mt-4">{error}</p>
          )}
        </div>
      </main>

      <footer className="w-full text-center py-4">
        <p className="text-gray-600 text-xs">
          By signing in, you agree to our <span className="font-bold">Terms of Service</span> and <span className="font-bold">Privacy Policy</span>.
        </p>
      </footer>
    </div>
  );
};

export default LoginGoogle;