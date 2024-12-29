import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// export interface Rental {}

// Define the vendor endpoints using crudService
export const UsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const usersCrud = crudService("/users");

    return {
      createUser: builder.mutation({
        query: (data) => usersCrud.create(data),
        invalidatesTags: ["Users"],
      }),
      updateUser: builder.mutation({
        query: ({ id, data }) => usersCrud.update({ id, data: data }),
        invalidatesTags: ["Users"],
      }),
      deleteUser: builder.mutation({
        query: (id) => usersCrud.delete(id),
        invalidatesTags: ["Users"],
      }),
      getAllUsers: builder.query({
        query: () => usersCrud.getAll(),
        providesTags: ["Users"],
      }),
      getSingleUser: builder.query({
        query: (id) => usersCrud.getSingle(id),
        providesTags: ["Users"],
      }),
      //   getUserUsers: builder.query({
      //     query: (id) => ({
      //       url: `/Users/user`,
      //       method: "GET",
      //     }),
      //     providesTags: ["Investment"],
      //   }),
    };
  },
});

export const {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetAllUsersQuery,
  useGetSingleUserQuery,
  useUpdateUserMutation,
} = UsersApi;
