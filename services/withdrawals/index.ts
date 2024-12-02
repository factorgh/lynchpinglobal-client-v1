import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const WithdrawalApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const WithdrawalCrud = crudService("/withdrawals");

    return {
      createWithdrawal: builder.mutation({
        query: (data) => WithdrawalCrud.create(data),
        invalidatesTags: ["Withdrawals"],
      }),
      updateWithdrawal: builder.mutation({
        query: ({ id, data }) => WithdrawalCrud.update({ id, data: data }),
        invalidatesTags: ["Withdrawals"],
      }),
      deleteWithdrawal: builder.mutation({
        query: (id) => WithdrawalCrud.delete(id),
        invalidatesTags: ["Withdrawals"],
      }),
      getWithdrawals: builder.query({
        query: () => WithdrawalCrud.getAll(),
        providesTags: ["Withdrawals"],
      }),
      getSingleWithdrawal: builder.query({
        query: (id) => WithdrawalCrud.getSingle(id),
        providesTags: ["Withdrawals"],
      }),
      getUserWithdrawals: builder.query({
        query: (id) => ({
          url: `/withdrawals/user`,
          method: "GET",
        }),
        providesTags: ["Withdrawals"],
      }),
    };
  },
});

export const {
  useCreateWithdrawalMutation,
  useDeleteWithdrawalMutation,
  useGetWithdrawalsQuery,
  useGetSingleWithdrawalQuery,
  useUpdateWithdrawalMutation,
  useGetUserWithdrawalsQuery,
} = WithdrawalApi;
