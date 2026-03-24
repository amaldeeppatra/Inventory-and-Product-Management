import React from 'react'
const Footer = () => {
  return (
    <footer className="bg-tertiary text-accent py-8">
  <div className="container mx-auto flex flex-col md:flex-row items-center">
        {/* Contact Section */}
        <div className="md:w-1/2 text-center md:text-left mb-6 md:mb-0">
          <h2 className="text-3xl font-bold mb-4">Contact Us!!!</h2>
          <div className="flex items-center mb-4">
            {/* Phone Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6 mr-3"
            >
              <path d="M22.54 16.88l-5.27-2.25a1.7 1.7 0 00-1.95.49l-1.75 2.14a15.07 15.07 0 01-6.51-6.51l2.14-1.75a1.7 1.7 0 00.49-1.95L7.12 1.46A1.71 1.71 0 005.33.5H2A1.71 1.71 0 00.5 2a19.5 19.5 0 0019.5 19.5A1.71 1.71 0 0023 .67v-3a1.71 1.71 0 .54-.79z" />
            </svg>
            <p>(219) 555-0114</p>
          </div>
          <div className="flex items-center">
            {/* Email Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6 mr-3"
            >
              <path d="M20,4H4C2,4,2,4,2,6V18c0,2,0,2,2,2H20c2,0,2,0,2,-2V6C22,4,22,4,20,4ZM20,8L12,13L4,8V6L12,11L20,6Z" />
            </svg>
            <p>Proxy@gmail.com</p>
          </div>
        </div>

        {/* Map Section */}
        <div className="md:w-1/2">
          <div className="rounded-lg overflow-hidden shadow-lg w-[300px] h-[200px] flex justify-end">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.580496419876!2d85.81824531543292!3d22.572646385180623!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f7e9c9a9b9b9b9%3A0x1234567890123456!2sKIIT%20Student%20Activity%20Center%20(KSAC)!5e0!3m2!1sen!2sin!4v1678912345678"
              width="100%"
              height="100%"
              style={{ border: "0" }}
              allowFullScreen=""
              loading="lazy"
              title="KIIT Map Location"
            ></iframe>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer