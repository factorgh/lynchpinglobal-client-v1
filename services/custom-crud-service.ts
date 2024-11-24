export const crudService = (url: string) => ({
  create: (data: any) => ({
    url,
    method: "POST",
    body: data,
  }),
  update: ({ id, data }: any) => ({
    url: `${url}/single/${id}`,
    method: "PUT",
    body: data,
  }),
  delete: (id: any) => ({
    url: `${url}/single/${id}`,
    method: "DELETE",
  }),
  getAll: () => ({
    url,
    method: "GET",
  }),
  getSingle: (id: any) => ({
    url: `${url}/single/${id}`,
    method: "GET",
  }),
});
