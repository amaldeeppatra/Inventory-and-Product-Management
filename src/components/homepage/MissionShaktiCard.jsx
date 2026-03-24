import React from 'react'
// import MissionShaktilogo from '../../resources/homepage/unnamed.png'
import MissionShaktilogo from '../../resources/homepage/ShreeAnnaAbhiyanLogo.png'

const MissionShaktiCard = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 shadow-md rounded-md flex md:flex-row md:items-center md:justify-between">
      {/* Text Section */}
      <div className="md:w-[50%] mb-4 md:mb-0 md:mr-6">
        <h2 className="text-2xl font-bold mb-2 text-tertiary">
          Mission Shakti Support
        </h2>
        <div className='flex-grow border-b-2 border-tertiary mb-2'></div>
        <p className="text-[#121212] leading-relaxed text-[12px]">
          We are a Government of India initiative dedicated to empowering women.
          Our goal is to build a society where women are equal partners in all
          aspects of nation-building. We focus on enhancing women's safety,
          security, and overall well-being through a range of programs and
          schemes.
        </p>
      </div>

      {/* Logo Section */}
      <div className="w-[31rem] flex justify-center md:justify-end">
        {/* Replace the src below with your actual logo URL or import */}
        <img
          src={MissionShaktilogo}
          alt="Mission Shakti Logo"
          className="w-22 h-auto object-contain"
        />
      </div>
    </div>
  )
}

export default MissionShaktiCard