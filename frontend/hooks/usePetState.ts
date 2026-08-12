"use client";

import { useState } from "react";
import { Pet } from "@/types/models";

export function usePetState(initialPet?: Pet) {
  const [pet, setPet] = useState<Pet | null>(initialPet || null);

  const feedPet = () => {
    if (!pet) return;
    setPet({
      ...pet,
      experience: pet.experience + 10 >= 100 ? 0 : pet.experience + 10,
      level: pet.experience + 10 >= 100 ? pet.level + 1 : pet.level,
      status: "healthy",
      lastInteractionAt: new Date().toISOString(),
    });
  };

  const triggerRescueMission = () => {
    if (!pet) return;
    setPet({
      ...pet,
      status: "missing",
    });
  };

  return {
    pet,
    setPet,
    feedPet,
    triggerRescueMission,
  };
}
