const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="ml-64 px-8 min-h-screen bg-[url('/p1.jpeg')] bg-no-repeat bg-cover bg-center mx-auto flex-1 overflow-auto">
      {children}
    </div>
  );
};

export default Wrapper;
