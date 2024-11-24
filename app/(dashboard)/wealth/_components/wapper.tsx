/* eslint-disable react/prop-types */
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className=" ml-64 px-8  min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 mx-auto  bg-gray-100 flex-1 overflow-auto  ">
      {children}
    </div>
  );
};

export default Wrapper;
