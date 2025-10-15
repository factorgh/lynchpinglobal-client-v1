import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

//TODO:gET TOKEN

const getToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};
// // process.env.NEXT_PUBLIC_API_BASE_URL ||
// const BASE_URL = "http://localhost:8080/api/v1";
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Define a service using a base URL and expected endpoints
export const baseApi = createApi({
  tagTypes: [
    "Rental",
    "Investment",
    "Loan",
    "Assets",
    "AddOn",
    "AddOff",
    "Logs",
    "Notifications",
    "ActivityLogs",
    "Payments",
    "Withdrawals",
    "Users",
  ],
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) {
        headers.set("authorization", token);
      }

      //headers.set("content-type", "multipart/form-data");

      return headers;
    },
  }),

  endpoints: () => ({}),
});
