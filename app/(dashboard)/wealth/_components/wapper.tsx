const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-3 sm:px-6 lg:px-8 pb-12 min-h-screen bg-transparent mx-auto flex-1 overflow-x-hidden">
      {children}
    </div>
  );
};

export default Wrapper;

