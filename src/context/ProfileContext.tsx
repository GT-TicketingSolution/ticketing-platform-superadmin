"use client";

import React, { createContext, useContext, useState } from "react";

export interface SuperAdminProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarInitials: string;
}

interface ProfileContextType {
  profile: SuperAdminProfile;
  updateProfile: (newProfile: Partial<SuperAdminProfile>) => void;
  isEditModalOpen: boolean;
  openEditModal: () => void;
  closeEditModal: () => void;
}

const DEFAULT_PROFILE: SuperAdminProfile = {
  name: "Super Admin",
  email: "admin@superadmin.com",
  phone: "+91 98765 43210",
  role: "Full System Access",
  avatarInitials: "SA",
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<SuperAdminProfile>(DEFAULT_PROFILE);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const updateProfile = (updated: Partial<SuperAdminProfile>) => {
    setProfile((prev) => {
      const name = updated.name ?? prev.name;
      const parts = name.trim().split(" ");
      let initials = "SA";
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts.length === 1 && parts[0].length >= 2) {
        initials = parts[0].substring(0, 2).toUpperCase();
      }

      return {
        ...prev,
        ...updated,
        avatarInitials: updated.avatarInitials || initials,
      };
    });
  };

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        isEditModalOpen,
        openEditModal,
        closeEditModal,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
