import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const AssetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const assetsCrud = crudService("/assets");

    return {
      createAssets: builder.mutation({
        query: (data) => assetsCrud.create(data),
        invalidatesTags: ["Assets"],
      }),
      updateAssets: builder.mutation({
        query: ({ id, data }) => assetsCrud.update({ id, data: data }),
        invalidatesTags: ["Assets"],
      }),
      deleteAssets: builder.mutation({
        query: (id) => assetsCrud.delete(id),
        invalidatesTags: ["Assets"],
      }),
      getAllAssetss: builder.query({
        query: () => assetsCrud.getAll(),
        providesTags: ["Assets"],
      }),
      getSingleAssets: builder.query({
        query: (id) => assetsCrud.getSingle(id),
        providesTags: ["Assets"],
      }),
    };
  },
});

export const {
  useCreateAssetsMutation,
  useDeleteAssetsMutation,
  useGetAllAssetssQuery,
  useGetSingleAssetsQuery,
  useUpdateAssetsMutation,
} = AssetsApi;
