import { formatPriceGHS } from "@/lib/helper";
import { List, Spin } from "antd";
import moment from "moment";
import { useEffect, useState } from "react";

const ContainerHeight = 400;

const CustomList = ({ dataSource, loading }: any) => {
  const [data, setData] = useState<any[]>([]);

  // Update the list data when dataSource changes
  useEffect(() => {
    if (dataSource) {
      setData(dataSource);
    }
  }, [dataSource]);

  // Handle infinite scrolling
  const onScroll = (e: any) => {
    const { scrollHeight, scrollTop } = e.currentTarget;
    if (Math.abs(scrollHeight - scrollTop - ContainerHeight) <= 1) {
      // Fetch more data when scrolling reaches the bottom
    }
  };

  return (
    <div className="max-w-4xl mx-auto rounded-lg p-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Recent Transactions
      </h2>

      <List
        className="demo-loadmore-list"
        loading={loading} // Show loading spinner when loading is true
        itemLayout="horizontal"
        dataSource={data}
        split={true} // This adds a divider between each list item
        renderItem={(item: any) => (
          <List.Item key={item.amount}>
            <List.Item.Meta
              // avatar={<Avatar src={item.asseImage || ""} />}
              title={
                <a href="https://ant.design">{formatPriceGHS(item.amount)}</a>
              }
            />
            <div>{moment(item.createdAt).fromNow()}</div>
          </List.Item>
        )}
      />

      {loading && (
        <div className="flex justify-center items-center mt-4">
          <Spin />
        </div>
      )}
    </div>
  );
};

export default CustomList;
