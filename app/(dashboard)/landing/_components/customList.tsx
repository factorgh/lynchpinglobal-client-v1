import { List, message, Spin } from "antd";
import VirtualList from "rc-virtual-list";
import { useEffect, useState } from "react";

const fakeDataUrl =
  "https://randomuser.me/api/?results=20&inc=name,gender,email,nat,picture&noinfo";
const ContainerHeight = 400;

const CustomList = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch and append data
  const appendData = async (showMessage = true) => {
    try {
      setLoading(true);
      const response = await fetch(fakeDataUrl);
      const body = await response.json();
      setData((prevData) => [...prevData, ...body.results]);
      if (showMessage) {
        message.success(`${body.results.length} more items loaded!`);
      }
    } catch (error) {
      message.error("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    appendData(false);
  }, []);

  // Handle infinite scrolling
  const onScroll = (e: any) => {
    const { scrollHeight, scrollTop } = e.currentTarget;
    if (Math.abs(scrollHeight - scrollTop - ContainerHeight) <= 1) {
      appendData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto  rounded-lg p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Recents Transactions
      </h2>
      <List className="rounded-lg overflow-hidden">
        <VirtualList
          data={data}
          height={ContainerHeight}
          itemHeight={47}
          itemKey="email"
          onScroll={onScroll}
        >
          {(item: any) => (
            <List.Item
              key={item.email}
              className="flex items-center justify-between  py-3 hover:bg-gray-100 transition"
            >
              <List.Item.Meta
                title={
                  <a
                    href="#"
                    className="text-blue-500 hover:underline"
                    title="View profile"
                  >
                    {item.name.first} {item.name.last}
                  </a>
                }
                description={
                  <span className="text-gray-600">{item.email}</span>
                }
              />
              <div className="text-sm text-gray-500">Details</div>
            </List.Item>
          )}
        </VirtualList>
      </List>
      {loading && (
        <div className="flex justify-center items-center mt-4">
          <Spin />
        </div>
      )}
    </div>
  );
};

export default CustomList;
