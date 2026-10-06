const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-8 pb-12 min-h-screen bg-transparent mx-auto flex-1 overflow-auto">
      {children}
    </div>
  );
};

export default Wrapper;

