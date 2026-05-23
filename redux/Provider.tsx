"use client";

import { Provider as ReactReduxProvider } from "react-redux";

import { store } from "@/redux/store";

interface ReduxProviderProps {
  children: React.ReactNode;
}

export const ReduxProvider = ({ children }: ReduxProviderProps) => (
  <ReactReduxProvider store={store}>{children}</ReactReduxProvider>
);

export default ReduxProvider;

