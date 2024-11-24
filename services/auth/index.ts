import { baseApi } from "../baseApi";

// Define the Auth endpoints using crudService
export const AuthApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    return {
      login: builder.mutation({
        query: (data: any) => ({
          url: "/auth/login",
          method: "POST",
          body: data,
        }),
      }),
      signup: builder.mutation({
        query: (data: any) => ({
          url: "/auth/signup",
          method: "POST",
          body: data,
        }),
      }),
      getUsers: builder.query({
        query: () => ({
          url: "/users",
          method: "GET",
        }),
      }),
    };
  },
});

export const { useLoginMutation, useSignupMutation, useGetUsersQuery } =
  AuthApi;
