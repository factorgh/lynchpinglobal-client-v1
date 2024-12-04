"use client";
import { useEffect, useState } from "react";

const CustomSlider = () => {
  // Slide index state
  const [activeIndex, setActiveIndex] = useState(0);

  // Slides content with image paths
  const slides = [
    {
      backgroundImage: "/showcase.jpg",
      title: "Slide 1",
      description: "Description for Slide 1",
    },
    {
      backgroundImage: "/showcase2.jpg",
      title: "Slide 2",
      description: "Description for Slide 2",
    },
    {
      backgroundImage: "/showcase3.jpg",
      title: "Slide 3",
      description: "Description for Slide 3",
    },
    {
      backgroundImage: "/showcase4.jpg",
      title: "Slide 4",
      description: "Description for Slide 4",
    },
    {
      backgroundImage: "/showcase5.jpg",
      title: "Slide 4",
      description: "Description for Slide 4",
    },
    {
      backgroundImage: "/showcase6.jpg",
      title: "Slide 4",
      description: "Description for Slide 4",
    },
    {
      backgroundImage: "/showcase7.jpg",
      title: "Slide 4",
      description: "Description for Slide 4",
    },
  ];

  // Automatic slide change every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer); // Clean up on unmount
  }, []);

  // Go to the previous slide
  const goToPrevious = () => {
    setActiveIndex(
      (prevIndex) => (prevIndex - 1 + slides.length) % slides.length
    );
  };

  // Go to the next slide
  const goToNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  return (
    <div className="relative overflow-hidden w-full h-[300px] bg-white">
      {/* Slider container */}
      <div className="absolute inset-0 transition-all duration-500 ease-in-out">
        <div
          className="flex"
          style={{
            transform: `translateX(-${activeIndex * 100}%)`,
            transition: "transform 0.5s ease-in-out",
          }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full h-[300px] bg-cover bg-center"
              style={{
                backgroundImage: `url(${slide.backgroundImage})`, // Set the background image correctly
              }}
            >
              {/* Optional content for each slide */}
              {/* <div className="absolute inset-0 bg-black opacity-40"></div>
              <div className="absolute inset-0 flex items-center justify-center text-center text-white p-8">
                <h3 className="text-3xl font-bold">{slide.title}</h3>
                <p>{slide.description}</p>
              </div> */}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      {/* Optional: Add navigation buttons for manual slide change */}
      {/* <button
        onClick={goToPrevious}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 text-white bg-opacity-50 bg-black p-2 rounded-full hover:bg-opacity-75 transition"
      >
        &lt;
      </button>

      <button
        onClick={goToNext}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white bg-opacity-50 bg-black p-2 rounded-full hover:bg-opacity-75 transition"
      >
        &gt;
      </button> */}

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-3 h-3 rounded-full bg-white opacity-50 hover:opacity-75 transition ${
              activeIndex === index ? "opacity-100" : ""
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default CustomSlider;
