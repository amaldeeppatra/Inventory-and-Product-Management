import React from "react";
import { FaChevronLeft } from "react-icons/fa6";

const PhoneNumberPage = () => {
  return (
    <div className="min-h-screen bg-[url('./resources/login/phoneInputBg.png')] bg-cover bg-center flex flex-col justify-between p-6">
      {/* Back Icon */}
      <div className="flex items-start">
        <button className="text-brown-700 text-2xl">
          <FaChevronLeft />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center space-y-4">
        <h1 className="text-2xl font-bold text-brown-800">Enter Phone Number</h1>
        <p className="text-brown-600 text-sm">
          Please confirm your country code and enter your phone number.
        </p>

        {/* Phone Input */}
        <div className="flex items-center border-b border-brown-400 py-2 space-x-2 w-full max-w-sm">
          <span className="text-brown-800 font-semibold">+91</span>
          <input
            type="tel"
            placeholder="0 00 00 00 00"
            className="flex-1 outline-none bg-transparent text-brown-800 text-lg"
          />
        </div>
      </div>

      {/* Continue Button */}
      <button className="w-full max-w-sm bg-brown-800 text-white py-3 rounded-full text-center font-bold text-lg">
        Continue
      </button>
    </div>
  );
};

export default PhoneNumberPage;