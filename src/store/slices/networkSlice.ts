import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  /**
   * null = not yet determined (initial state)
   * true  = online
   * false = offline
   */
  isConnected: boolean | null;
}

const initialState: NetworkState = {
  isConnected: null,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkStatus(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
  },
});

export const { setNetworkStatus } = networkSlice.actions;
export default networkSlice.reducer;
