import { createSlice } from '@reduxjs/toolkit';

const readStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialState = {
  user: readStoredUser(),
  token: localStorage.getItem('token') || null,
  role: readStoredUser()?.role || null,
  permissions: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action) => {
      const { user, token } = action.payload;
      state.user = user || null;
      state.token = token || null;
      state.role = user?.role || null;
      state.permissions = user?.permissions || [];
    },
    updateUser: (state, action) => {
      state.user = { ...(state.user || {}), ...action.payload };
      state.role = state.user?.role || null;
      state.permissions = state.user?.permissions || state.permissions;
    },
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.permissions = [];
    },
  },
});

export const { setSession, updateUser, clearSession } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export default authSlice.reducer;
