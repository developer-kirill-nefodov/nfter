import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import {VISITOR, type IUser} from '../../types/user';

export interface IUserState {
  user: IUser;
  loading: boolean;
}

const initialState: IUserState = {
  user: VISITOR,
  loading: true,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, {payload}: PayloadAction<IUser>) => {
      state.user = payload;
      state.loading = false;
    },
    setVisitor: (state) => {
      state.user = VISITOR;
      state.loading = false;
    },
    setUserLoading: (state, {payload}: PayloadAction<boolean>) => {
      state.loading = payload;
    },
  },
});

export const {setUser, setVisitor, setUserLoading} = userSlice.actions;

export default userSlice.reducer;
