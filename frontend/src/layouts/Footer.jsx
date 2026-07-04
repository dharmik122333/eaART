import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 col-span-1 md:col-span-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Project <span className="text-primary-glow">EARTH</span>
            </span>
            <p className="text-sm text-zinc-400 max-w-sm">
              The unified digital workspace and talent ecosystem. Elevate your portfolio, access global creative projects, and collaborate with top industry professionals.
            </p>
          </div>

          {/* Platform Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Ecosystem</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/explore-projects" className="text-sm text-zinc-400 hover:text-white transition">
                  Browse Projects
                </Link>
              </li>
              <li>
                <Link to="/explore-creators" className="text-sm text-zinc-400 hover:text-white transition">
                  Discover Talent
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition">
                  Talent Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Social and Tech Stack */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Platform Stack</h3>
            <div className="mt-4 text-xs space-y-1 text-zinc-500">
              <p>MERN stack: React, Vite, Node, Express, MongoDB</p>
              <p>Tailwind CSS styling</p>
              <p>JWT Authentication security</p>
              <p>Cloudinary cloud media storage</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} Project EARTH. All rights reserved. Built for creators worldwide.
          </p>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-primary-glow fill-primary-glow" />
            <span>for the global creative community.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
