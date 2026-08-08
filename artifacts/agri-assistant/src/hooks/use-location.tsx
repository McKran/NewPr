import React, { createContext, useContext, useState, useEffect } from "react";

type LocationContextType = {
  location: string;
  setLocation: (location: string) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState(() => {
    return localStorage.getItem("agri_location") || "Nairobi, Kenya";
  });

  const setLocation = (newLoc: string) => {
    setLocationState(newLoc);
    localStorage.setItem("agri_location", newLoc);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationStore() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationStore must be used within a LocationProvider");
  }
  return context;
}
