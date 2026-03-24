import { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import ParseJwt from '../utils/ParseJWT';
import logo from "../resources/logos/shreeannayojana.png";

const LandingPage = () => {
  const navigate = useNavigate(); // 2. Initialize the navigate function

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const user = ParseJwt(token);
        // Optional: check expiry
        if (user) {
          navigate("/homepage"); // redirect instantly
          return;
        } else {
          Cookies.remove("token"); // expired token cleanup
        }
      } catch (error) {
        console.error("Invalid token:", error);
        Cookies.remove("token");
      }
    }
  }, [navigate]);

  // 3. Create a function to handle the button click
  const handleContinue = () => {
    navigate("/login"); // 4. Tell it where to go
  };

  return (
    <main className="relative h-fit w-full bg-[var(--background-color)] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-[50vh] bg-[var(--tertiary-color)]"
        style={{ clipPath: "ellipse(130% 100% at 50% 0%)" }}
      ></div>

      <div className="relative z-10 h-full w-full flex flex-col items-center">
        <div className="h-[calc(50vh-9rem)] flex-shrink-0"></div>

        <img
          src={logo}
          alt="Shree Anna Abhiyan Logo"
          className="size-96 object-contain flex-shrink-0"
        />

        <h1 className="text-3xl font-bold text-[var(--tertiary-color)] mt-6">
          Shree Anna Abhiyan
        </h1>

        <div className="flex-grow"></div>

        {/* 5. Attach the onClick event to the button */}
        <button
          onClick={handleContinue}
          className="text-xl font-semibold bg-[var(--tertiary-color)] text-[var(--background-color)] py-5 w-11/12 max-w-sm rounded-full shadow-lg hover:opacity-90 transition-opacity mb-24"
        >
          Continue
        </button>
      </div>
    </main>
  );
};

export default LandingPage;