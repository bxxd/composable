import React, { ReactNode } from "react";

import Header from "@/components/header/Header";
import ToasterProvider from "@/components/providers/ToasterProvider";
// import MyThemeProvider from "@/components/providers/ThemeProvider";

import Footer from "@/components/footer/Footer";

interface LayoutProps {
  children: ReactNode;
  headerChildrenComponents?: ReactNode[];
}

const Layout: React.FC<LayoutProps> = ({
  children,
  headerChildrenComponents,
}) => {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header childrenComponents={headerChildrenComponents} />
        <main className="App w-full flex-grow">{children}</main>
        <Footer />
      </div>
      <ToasterProvider />
    </>
  );
};

export default Layout;
