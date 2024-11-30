import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

//TODO:gET TOKEN

const getToken = () => {
  let token = localStorage.getItem("token");
  return token;
};

// process.env.NEXT_PUBLIC_API_BASE_URL ||
const BASE_URL = "http://localhost:8080/api/v1";

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
  ],
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers) => {
      const token = getToken();
      console.log(token);

      if (token) {
        headers.set("authorization", token);
      }

      //headers.set("content-type", "multipart/form-data");

      return headers;
    },
  }),

  endpoints: () => ({}),
});

// Pick out data and prevent nested properties in a hook or selector
