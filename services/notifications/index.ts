import { baseApi } from "../baseApi";
import { crudService } from "../custom-crud-service";

// Define the vendor endpoints using crudService
export const NotificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => {
    const NotificationCrud = crudService("/notifications");

    return {
      createNotification: builder.mutation({
        query: (data) => NotificationCrud.create(data),
        invalidatesTags: ["Notifications"],
      }),
      updateNotification: builder.mutation({
        query: ({ id, data }) => NotificationCrud.update({ id, data: data }),
        invalidatesTags: ["Notifications"],
      }),
      deleteNotification: builder.mutation({
        query: (id) => NotificationCrud.delete(id),
        invalidatesTags: ["Notifications"],
      }),
      getNotifications: builder.query({
        query: () => NotificationCrud.getAll(),
        providesTags: ["Notifications"],
      }),
      getSingleNotification: builder.query({
        query: (id) => NotificationCrud.getSingle(id),
        providesTags: ["Notifications"],
      }),
    };
  },
});

export const {
  useCreateNotificationMutation,
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useGetSingleNotificationQuery,
  useUpdateNotificationMutation,
} = NotificationApi;
