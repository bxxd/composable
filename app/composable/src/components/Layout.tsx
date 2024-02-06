import React, { ReactNode } from "react";

import Header from "@/components/header/Header";

import { GlobalProvider } from "@/lib/context";
import Footer from "@/components/footer/Footer";
import ToasterProvider from "@/components/providers/ToasterProvider";

interface LayoutProps {
  children: ReactNode;
  headerChildrenComponents?: ReactNode[];
}

const Layout: React.FC<LayoutProps> = ({
  children,
  headerChildrenComponents,
}) => {
  return (
    <GlobalProvider>
      <div className="flex flex-col min-h-screen dark:bg-gray-900 dark:text-white">
        <Header childrenComponents={headerChildrenComponents} />
        <main className="App w-full flex-grow">{children}</main>
        <Footer />
      </div>
      <ToasterProvider />
    </GlobalProvider>
  );
};

export default Layout;
