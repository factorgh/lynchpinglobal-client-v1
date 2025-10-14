import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const AddOffApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const AddOffCrud = crudService("/add-offs");

    return {
      createAddOff: builder.mutation({
        query: (data) => AddOffCrud.create(data),
        invalidatesTags: ["AddOff", "Investment"],
      }),
      updateAddOff: builder.mutation({
        query: ({ id, data }) => AddOffCrud.update({ id, data: data }),
        invalidatesTags: ["AddOff", "Investment"],
      }),
      deleteAddOff: builder.mutation({
        query: (id) => AddOffCrud.delete(id),
        invalidatesTags: ["AddOff"],
      }),
      getAllAddOffs: builder.query({
        query: () => AddOffCrud.getAll(),
        providesTags: ["AddOff"],
      }),
      getSingleAddOff: builder.query({
        query: (id) => AddOffCrud.getSingle(id),
        providesTags: ["AddOff"],
      }),
    };
  },
});

export const {
  useGetAllAddOffsQuery,
  useCreateAddOffMutation,
  useDeleteAddOffMutation,
  useGetSingleAddOffQuery,
  useUpdateAddOffMutation,
} = AddOffApi;
