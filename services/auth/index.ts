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
      forgotPassword: builder.mutation({
        query: (data: any) => ({
          url: "/auth/forgotPassword",
          method: "POST",
          body: data,
        }),
      }),
      resetPassword: builder.mutation({
        query: ({ token, data }: { token: string; data: any }) => ({
          url: `/auth/resetPassword/${token}`,
          method: "PATCH",
          body: data,
        }),
      }),
      // Change password using old password verification (no email required)
      changePassword: builder.mutation({
        query: (data: {
          identifier: string;
          currentPassword: string;
          newPassword: string;
          newPasswordConfirm: string;
        }) => ({
          url: "/auth/changePassword",
          method: "POST",
          body: data,
        }),
      }),
      updatePassword: builder.mutation({
        query: (data: any) => ({
          url: "/auth/updatePassword",
          method: "PATCH",
          body: data,
        }),
      }),
      getUsers: builder.query({
        query: () => ({
          url: "/users",
          method: "GET",
        }),
      }),
      getAdmins: builder.query({
        query: () => ({
          url: "/users/admin",
          method: "GET",
        }),
      }),
    };
  },
});

export const {
  useLoginMutation,
  useSignupMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useUpdatePasswordMutation,
  useGetUsersQuery,
  useGetAdminsQuery,
} = AuthApi;
