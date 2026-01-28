import React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {children}
    </div>
  );
};

export default Layout;
