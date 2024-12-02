import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const PaymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const PaymentCrud = crudService("/payments");

    return {
      createPayment: builder.mutation({
        query: (data) => PaymentCrud.create(data),
        invalidatesTags: ["Payments"],
      }),
      updatePayment: builder.mutation({
        query: ({ id, data }) => PaymentCrud.update({ id, data: data }),
        invalidatesTags: ["Payments"],
      }),
      deletePayment: builder.mutation({
        query: (id) => PaymentCrud.delete(id),
        invalidatesTags: ["Payments"],
      }),
      getPayments: builder.query({
        query: () => PaymentCrud.getAll(),
        providesTags: ["Payments"],
      }),
      getSinglePayment: builder.query({
        query: (id) => PaymentCrud.getSingle(id),
        providesTags: ["Payments"],
      }),
      getUserPayments: builder.query({
        query: (id) => ({
          url: `/payments/user`,
          method: "GET",
        }),
        providesTags: ["Payments"],
      }),
    };
  },
});

export const {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentsQuery,
  useGetSinglePaymentQuery,
  useUpdatePaymentMutation,
  useGetUserPaymentsQuery,
} = PaymentApi;
