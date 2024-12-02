import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const InvestmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const investmentCrud = crudService("/investments");

    return {
      createInvestment: builder.mutation({
        query: (data) => investmentCrud.create(data),
        invalidatesTags: ["Investment"],
      }),
      updateInvestment: builder.mutation({
        query: ({ id, data }) => investmentCrud.update({ id, data: data }),
        invalidatesTags: ["Investment"],
      }),
      deleteInvestment: builder.mutation({
        query: (id) => investmentCrud.delete(id),
        invalidatesTags: ["Investment"],
      }),
      getAllInvestments: builder.query({
        query: () => investmentCrud.getAll(),
        providesTags: ["Investment"],
      }),
      getUserInvestments: builder.query({
        query: (id) => ({
          url: `/investments/user`,
          method: "GET",
        }),
        providesTags: ["Investment"],
      }),
      getSingleInvestment: builder.query({
        query: (id) => investmentCrud.getSingle(id),
        providesTags: ["Investment"],
      }),
    };
  },
});

export const {
  useGetAllInvestmentsQuery,
  useCreateInvestmentMutation,
  useDeleteInvestmentMutation,
  useGetUserInvestmentsQuery,
  useGetSingleInvestmentQuery,
  useUpdateInvestmentMutation,
} = InvestmentApi;
