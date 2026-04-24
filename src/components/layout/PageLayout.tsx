import Navbar from "./Navbar";
import Footer from "./Footer";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      {/* Top padding matches the responsive navbar height (16 mobile / 24 desktop) plus iOS safe area. */}
      <main className="flex-1 pt-[calc(env(safe-area-inset-top)+4rem)] md:pt-24">{children}</main>
      <Footer />
    </div>
  );
};

export default PageLayout;
