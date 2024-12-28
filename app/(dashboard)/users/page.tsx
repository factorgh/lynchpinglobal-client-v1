"use client";

import { useGetUsersQuery } from "@/services/auth";
import { useDeleteUserMutation, useUpdateUserMutation } from "@/services/users";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Drawer, Form, Input, Space, Table, Tag } from "antd";
import { useState } from "react";
import Wrapper from "../wealth/_components/wapper";

const Users = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { data: dataSource, isFetching } = useGetUsersQuery(null);
  const [] = useDeleteUserMutation();
  const [] = useUpdateUserMutation();

  console.log(dataSource);
  const [form] = Form.useForm();

  const columns = [
    // {
    //   title: "Display Name",
    //   dataIndex: "displayName",
    //   key: "displayName",
    // },
    {
      title: "Username",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "License",
      dataIndex: "license",
      key: "license",
      render: (record: any) => <Tag>{record}</Tag>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <EditOutlined
            className="text-blue-500 mr-2"
            onClick={() => handleEditUser(record)}
          />

          <DeleteOutlined
            className="text-red-500"
            onClick={() => handleDeleteUser(record)}
          />
        </Space>
      ),
    },
  ];

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    form.setFieldsValue(user);
    setDrawerVisible(true);
  };

  const handleDeleteUser = (user: any) => {
    console.log("Delete user:", user);
    // Add delete logic here
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleFormSubmit = (values: any) => {
    console.log("Form Values:", values);
    if (selectedUser) {
      // Add update logic here
      setSelectedUser(null);
      setDrawerVisible(false);
    } else {
      // Add create logic here
      setDrawerVisible(false);
    }
    setDrawerVisible(false);
  };

  return (
    <Wrapper>
      <div className="mb-4 flex justify-end p-5">
        {/* <Button type="primary" onClick={handleAddUser}>
          Add User
        </Button> */}
      </div>
      <Card>
        <Table
          loading={isFetching}
          dataSource={dataSource?.allUsers}
          columns={columns}
        />
      </Card>
      <Drawer
        title={selectedUser ? "Edit User" : "Add User"}
        width={360}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div className="flex justify-end">
            <Button onClick={() => setDrawerVisible(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" onClick={() => form.submit()}>
              Submit
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please enter the name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter the email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please enter the role" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
    </Wrapper>
  );
};

export default Users;
