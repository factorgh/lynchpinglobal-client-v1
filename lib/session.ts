import { store } from "@/services/store";
import { baseApi } from "@/services/baseApi";

// Drop every cached API response so one account's data can never be shown to the next account.
export const resetCachedApiData = () => {
  store.dispatch(baseApi.util.resetApiState());
};

export const signOutAndRedirect = async (redirectTo = "/login") => {
  try {
    const token = localStorage.getItem("token");
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch {
    // The session is cleared locally regardless of the network result.
  }
  resetCachedApiData();
  localStorage.clear();
  sessionStorage.clear();
  // Full reload guarantees no in-memory state from the previous account survives.
  window.location.replace(redirectTo);
};
