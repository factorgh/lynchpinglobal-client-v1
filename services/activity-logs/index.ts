import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const ActivityLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const ActivityLogCrud = crudService("/activity-logs");

    return {
      createActivityLog: builder.mutation({
        query: (data) => ActivityLogCrud.create(data),
        invalidatesTags: ["ActivityLogs"],
      }),
      updateActivityLog: builder.mutation({
        query: ({ id, data }) => ActivityLogCrud.update({ id, data: data }),
        invalidatesTags: ["ActivityLogs"],
      }),
      deleteActivityLog: builder.mutation({
        query: (id) => ActivityLogCrud.delete(id),
        invalidatesTags: ["ActivityLogs"],
      }),
      getActivityLogs: builder.query({
        query: () => ActivityLogCrud.getAll(),
        providesTags: ["ActivityLogs"],
      }),
      getSingleActivityLog: builder.query({
        query: (id) => ActivityLogCrud.getSingle(id),
        providesTags: ["ActivityLogs"],
      }),
    };
  },
});

export const {
  useCreateActivityLogMutation,
  useDeleteActivityLogMutation,
  useGetActivityLogsQuery,
  useGetSingleActivityLogQuery,
  useUpdateActivityLogMutation,
} = ActivityLogApi;
