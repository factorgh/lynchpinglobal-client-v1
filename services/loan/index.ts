import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const LoanApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const loanCrud = crudService("/loans");

    return {
      createLoan: builder.mutation({
        query: (data) => loanCrud.create(data),
        invalidatesTags: ["Loan"],
      }),
      updateLoan: builder.mutation({
        query: ({ id, data }) => loanCrud.update({ id, data: data }),
        invalidatesTags: ["Loan"],
      }),
      deleteLoan: builder.mutation({
        query: (id) => loanCrud.delete(id),
        invalidatesTags: ["Loan"],
      }),
      getLoans: builder.query({
        query: () => loanCrud.getAll(),
        providesTags: ["Loan"],
      }),
      getSingleLoan: builder.query({
        query: (id) => loanCrud.getSingle(id),
        providesTags: ["Loan"],
      }),
      getUserLoan: builder.query({
        query: (id) => ({
          url: `/loans/user`,
          method: "GET",
        }),
        providesTags: ["Loan"],
      }),
    };
  },
});

export const {
  useCreateLoanMutation,
  useDeleteLoanMutation,
  useGetLoansQuery,
  useGetSingleLoanQuery,
  useUpdateLoanMutation,
  useGetUserLoanQuery,
} = LoanApi;
