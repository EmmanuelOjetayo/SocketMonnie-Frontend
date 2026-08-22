import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

// Assets imports
import logo from "@/assets/logo.png";
import getStarted1 from "@/assets/getStarted1.png";
import getStarted2 from "@/assets/getStarted2.png";
import getStarted3 from "@/assets/getStarted3.png";

const ONBOARDING_STEPS = [
  {
    id: 1,
    image: getStarted1,
    title: "Save Smarter",
    description: "Build wealth consistently through digital co-operative savings",
    buttonText: "Next",
  },
  {
    id: 2,
    image: getStarted2,
    title: "Borrow with confidence",
    description: "Access loan based on your savings ang reputation",
    buttonText: "Next",
  },
  {
    id: 3,
    image: getStarted3,
    title: "Grow Financially",
    description: "Track savings, ratings, and financial progress in one place",
    buttonText: "Get Started",
  },
];

export function GetStarted({ tab = "new" }) {
  const navigate = useNavigate();
  
  // Step 0 = Splash Screen, 1-3 = Progressive Walkthrough Steps
  const [currentStep, setCurrentStep] = useState(0);

  // Auto transition from Splash Screen (Step 0) to Step 1 after 2 seconds
  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Navigate on Skip or Final Step Completion
  const handleSkipOrFinish = () => {
    navigate(tab === "new" ? ROUTES.REGISTER : ROUTES.LOGIN);
  };

  // Step Next Handler
  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSkipOrFinish();
    }
  };

  // ---------------------------------------------------------------------------
  // 1. SPLASH SCREEN (Step 0)
  // ---------------------------------------------------------------------------
  if (currentStep === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F8F9FB] px-6">
        <div className="flex flex-col items-center justify-center animate-in fade-in duration-500">
          <img 
            src={logo} 
            alt="Socket Monnee Logo" 
            className="w-48 h-auto object-contain" 
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. MULTI-STEP ONBOARDING (Steps 1, 2, 3)
  // ---------------------------------------------------------------------------
  const stepData = ONBOARDING_STEPS[currentStep - 1];

  return (
    <div className="flex h-screen w-full flex-col justify-between bg-[#F8F9FB] px-6 pt-12 pb-8 select-none">
      
      {/* Top Header: Centered Logo & Right Skip Button with distinct top & horizontal spacing */}
      <div className="relative flex items-center justify-between w-full max-w-sm mx-auto mb-6">
        {/* Invisible spacer to perfectly balance center position of Logo */}
        <div className="w-12" />

        <img 
          src={logo} 
          alt="Socket Logo" 
          className="h-9 w-auto object-contain" 
        />

        <button
          type="button"
          onClick={handleSkipOrFinish}
          className="text-base font-bold text-gray-900 hover:opacity-70 transition-opacity cursor-pointer pl-4"
        >
          Skip
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex flex-col items-center text-center my-auto w-full max-w-sm mx-auto space-y-8">
        
        {/* Main Banner Illustration with added top/bottom margin gap */}
        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center bg-transparent my-2">
          <img
            src={stepData.image}
            alt={stepData.title}
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-3 px-2 pt-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {stepData.title}
          </h1>
          <p className="text-sm font-normal text-gray-800 leading-relaxed max-w-[280px] mx-auto">
            {stepData.description}
          </p>
        </div>

        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              currentStep === 1 ? "w-10 bg-[#3B62EC]" : "w-2.5 bg-gray-200"
            }`}
          />
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              currentStep === 2 ? "w-10 bg-[#3B62EC]" : "w-2.5 bg-gray-200"
            }`}
          />
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${
              currentStep === 3 ? "w-10 bg-[#3B62EC]" : "w-2.5 bg-gray-200"
            }`}
          />
          <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="w-full max-w-sm mx-auto pt-4">
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-[#3B62EC] text-white font-bold text-base shadow-md hover:bg-[#3052D1] active:scale-[0.98] transition-all cursor-pointer"
        >
          {stepData.buttonText}
        </button>
      </div>
    </div>
  );
}