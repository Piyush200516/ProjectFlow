import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  notificationPanelOpen: boolean;
  dashboardRoleFilter: "ALL" | "STUDENT" | "MENTOR" | "HOD" | "ADMIN";
  setSidebarCollapsed: (value: boolean) => void;
  setNotificationPanelOpen: (value: boolean) => void;
  setDashboardRoleFilter: (value: UiState["dashboardRoleFilter"]) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  notificationPanelOpen: false,
  dashboardRoleFilter: "ALL",
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setNotificationPanelOpen: (notificationPanelOpen) => set({ notificationPanelOpen }),
  setDashboardRoleFilter: (dashboardRoleFilter) => set({ dashboardRoleFilter }),
}));
