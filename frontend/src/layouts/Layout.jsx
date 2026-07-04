import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-zinc-100 selection:bg-primary selection:text-white">
      {/* Background Neon Glowing Meshes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-glow opacity-60 filter blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-glow opacity-40 filter blur-[100px]" />
      </div>

      <Navbar />
      
      <main className="flex-grow relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
