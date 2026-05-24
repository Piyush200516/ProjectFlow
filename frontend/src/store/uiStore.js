import { create } from 'zustand';

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  notificationPanelOpen: false,
  selectedForm: null,
  selectedProject: null,
  modals: {},
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setNotificationPanelOpen: (notificationPanelOpen) => set({ notificationPanelOpen }),
  toggleNotificationPanel: () => set((state) => ({ notificationPanelOpen: !state.notificationPanelOpen })),
  setSelectedForm: (selectedForm) => set({ selectedForm }),
  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setModalOpen: (name, isOpen) => set((state) => ({ modals: { ...state.modals, [name]: isOpen } })),
}));
