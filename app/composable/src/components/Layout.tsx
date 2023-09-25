import React, { ReactNode } from "react";

import Header from "@/components/header/Header";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { GlobalProvider } from "@/lib/context";
import Footer from "@/components/footer/Footer";

const ToasterProvider = () => {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  return <Toaster theme={theme} />;
};

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
      <ThemeProvider
        attribute="class"
        value={{
          light: "light-theme",
          dark: "dark-theme",
        }}
      >
        <div className="flex flex-col min-h-screen">
          <Header childrenComponents={headerChildrenComponents} />
          <main className="App w-full flex-grow">{children}</main>
          <Footer />
        </div>
        <ToasterProvider />
      </ThemeProvider>
    </GlobalProvider>
  );
};

export default Layout;
