import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

export interface Rental {}

// Define the vendor endpoints using crudService
export const RentalApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const rentalCrud = crudService("/rental");

    return {
      createRental: builder.mutation({
        query: (data) => rentalCrud.create(data),
        invalidatesTags: ["Rental"],
      }),
      updateRental: builder.mutation({
        query: ({ id, data }) => rentalCrud.update({ id, data: data }),
        invalidatesTags: ["Rental"],
      }),
      deleteRental: builder.mutation({
        query: (id) => rentalCrud.delete(id),
        invalidatesTags: ["Rental"],
      }),
      getRentals: builder.query({
        query: () => rentalCrud.getAll(),
        providesTags: ["Rental"],
      }),
      getSingleRental: builder.query({
        query: (id) => rentalCrud.getSingle(id),
        providesTags: ["Rental"],
      }),
    };
  },
});

export const {
  useCreateRentalMutation,
  useDeleteRentalMutation,
  useGetRentalsQuery,
  useGetSingleRentalQuery,
  useUpdateRentalMutation,
} = RentalApi;
