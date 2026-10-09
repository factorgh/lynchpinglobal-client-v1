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
      getRolloverCandidates: builder.query({
        query: ({
          sourceQuarter,
          targetQuarter,
        }: {
          sourceQuarter?: string;
          targetQuarter?: string;
        } = {}) => {
          const params = new URLSearchParams();
          if (sourceQuarter) params.append("sourceQuarter", sourceQuarter);
          if (targetQuarter) params.append("targetQuarter", targetQuarter);
          const queryString = params.toString();
          return {
            url: `/investments/rollover/candidates${queryString ? `?${queryString}` : ""}`,
            method: "GET",
          };
        },
        providesTags: ["Investment"],
      }),
      executeSingleRollover: builder.mutation({
        query: (data) => ({
          url: "/investments/rollover/execute-single",
          method: "POST",
          body: data,
        }),
        invalidatesTags: ["Investment"],
      }),
      executeBatchRollover: builder.mutation({
        query: (data) => ({
          url: "/investments/rollover/execute-batch",
          method: "POST",
          body: data,
        }),
        invalidatesTags: ["Investment"],
      }),
      executeAutoRollover: builder.mutation({
        query: () => ({
          url: "/investments/rollover",
          method: "POST",
        }),
        invalidatesTags: ["Investment"],
      }),
      calculateDailyAccruals: builder.mutation({
        query: () => ({
          url: "/investments/accruals/calculate",
          method: "POST",
        }),
        invalidatesTags: ["Investment"],
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
  useGetRolloverCandidatesQuery,
  useExecuteSingleRolloverMutation,
  useExecuteBatchRolloverMutation,
  useExecuteAutoRolloverMutation,
  useCalculateDailyAccrualsMutation,
} = InvestmentApi;
