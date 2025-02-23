import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const AddOnApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const AddOnCrud = crudService("/add-on");

    return {
      createAddOn: builder.mutation({
        query: (data) => AddOnCrud.create(data),
        invalidatesTags: ["AddOn", "Investment"],
      }),
      updateAddOn: builder.mutation({
        query: ({ id, data }) => AddOnCrud.update({ id, data: data }),
        invalidatesTags: ["AddOn", "Investment"],
      }),
      deleteAddOn: builder.mutation({
        query: (id) => AddOnCrud.delete(id),
        invalidatesTags: ["AddOn"],
      }),
      getAllAddOns: builder.query({
        query: () => AddOnCrud.getAll(),
        providesTags: ["AddOn"],
      }),
      getSingleAddOn: builder.query({
        query: (id) => AddOnCrud.getSingle(id),
        providesTags: ["AddOn"],
      }),
    };
  },
  overrideExisting: true,
});

export const {
  useGetAllAddOnsQuery,
  useCreateAddOnMutation,
  useDeleteAddOnMutation,

  useGetSingleAddOnQuery,
  useUpdateAddOnMutation,
} = AddOnApi;
