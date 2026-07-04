import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Users, CheckCircle, UploadCloud, Shield, Star, Zap, Code, Video, Radio, Sparkles } from 'lucide-react';
import { CREATOR_CATEGORIES } from '../utils/categories';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/explore-creators?category=${encodeURIComponent(category)}`);
  };

  const platformFeatures = [
    {
      icon: <UploadCloud className="w-6 h-6 text-primary-glow" />,
      title: "Interactive Portfolios",
      desc: "Showcase high-resolution images, video reels, and audio tracks in clean customizable grids."
    },
    {
      icon: <Compass className="w-6 h-6 text-emerald-400" />,
      title: "Project Marketplace",
      desc: "Search, filter, and apply to active developer contracts, creative gigs, and full-time listings."
    },
    {
      icon: <Shield className="w-6 h-6 text-cyan-400" />,
      title: "Verified Talent",
      desc: "Recruiters access direct links to portfolio files, work histories, skills, and availability markers."
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Direct Hiring",
      desc: "Recruiters browse creative sheets and make hire requests directly to open creators."
    }
  ];

  const testimonials = [
    {
      name: "Marcus Vance",
      role: "3D Game Artist",
      text: "Project EARTH helped me transition from freelance contract hopping to a permanent studio role. The visual layout feels like a real portfolio showcase instead of a boring resume site."
    },
    {
      name: "Evelyn Sterling",
      role: "Founder, Zenith Media",
      text: "Hiring creative talent used to mean checking multiple platforms. Project EARTH consolidates portfolios, skills, and applications in one stunning workspace."
    }
  ];

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 pt-12 md:pt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary-glow animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next Generation Creator Ecosystem</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight font-display text-white">
          Showcase Your Craft. <br />
          <span className="text-gradient">Get Hired Globally.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl font-light">
          The ultimate unified workspace for creators, designers, developers, recruiters, and startups. Connect, host portfolios, post projects, and hire top-tier talent.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link 
            to="/explore-projects" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Explore Projects</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/explore-creators" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold border border-zinc-800 hover:border-zinc-700 transition-all duration-200"
          >
            <span>Discover Talent</span>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {[
          { label: 'Creative Fields', value: '11' },
          { label: 'Active Creators', value: '5k+' },
          { label: 'Project Budget Listed', value: '$2.4M+' },
          { label: 'Talent Hired', value: '1.2k+' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel rounded-xl p-6 text-center border border-border">
            <span className="block text-3xl font-extrabold text-white font-mono mb-1">{stat.value}</span>
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Creator Categories Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Creator Categories</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">Explore talent across key creative domains on Project EARTH</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {CREATOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className="glass-panel glass-panel-hover p-5 rounded-xl text-center border border-border/60 flex flex-col items-center justify-center gap-3 group text-zinc-300 hover:text-white"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary-glow flex items-center justify-center group-hover:bg-primary group-hover:text-white transition duration-300">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold tracking-wide">{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Features Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Designed for the <br />
            <span className="text-primary-glow">Modern Creative</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Project EARTH brings the rich aesthetics of Behance and ArtStation together with LinkedIn's clean networking architecture to power a high-performance hiring platform.
          </p>
          <div className="pt-2">
            <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-glow hover:text-white transition group">
              <span>Create your workspace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-2">
          {platformFeatures.map((feat, i) => (
            <div key={i} className="glass-panel p-6 rounded-xl border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-base font-bold text-white">{feat.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Workflow */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">How It Works</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">Getting started on Project EARTH takes minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Creator Path */}
          <div className="glass-panel p-8 rounded-2xl border border-border/80 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-glow" />
              <span>For Creators</span>
            </h3>
            
            <div className="space-y-4">
              {[
                { step: '1', title: 'Setup Workspace', desc: 'Create your account, detail your creative domains, location, and upload your profile picture.' },
                { step: '2', title: 'Publish Portfolios', desc: 'Host high-res media files, sketches, concept art, videos, and project briefs.' },
                { step: '3', title: 'Apply & Earn', desc: 'Browse the open contract boards, submit project applications, and receive direct hire requests.' },
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary-glow font-bold text-sm flex items-center justify-center font-mono">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">{step.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recruiter Path */}
          <div className="glass-panel p-8 rounded-2xl border border-border/80 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>For Recruiters & Startups</span>
            </h3>

            <div className="space-y-4">
              {[
                { step: '1', title: 'Post Listings', desc: 'Detail the requirements, budgets, categories, and deadlines for active projects.' },
                { step: '2', title: 'Discover Talent', desc: 'Search creator rosters using categorical matching, skill tags, or direct portfolios.' },
                { step: '3', title: 'Hire & Track', desc: 'Evaluate applicant proposal packets, view media files, and send hire contracts.' },
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center font-mono">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-200">{step.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Platform Stories</h2>
          <p className="text-sm text-zinc-400">Read how creators are succeeding on the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((test, i) => (
            <div key={i} className="glass-panel p-8 rounded-xl border border-border flex flex-col justify-between">
              <p className="text-sm text-zinc-300 italic mb-6">"{test.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary-glow">
                  {test.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{test.name}</h4>
                  <span className="text-xs text-zinc-500 font-mono">{test.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action CTA */}
      <section className="relative glass-panel rounded-3xl p-8 md:p-12 border border-border text-center overflow-hidden max-w-4xl mx-auto">
        <div className="absolute inset-0 bg-purple-glow opacity-30 filter blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Ready to Showcase Your Vision?</h2>
          <p className="text-sm text-zinc-400">
            Join thousands of professional designers, developers, photographers, game artists, and recruiters collaborating today.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/register" 
              className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold shadow-lg hover:shadow-primary/30 transition duration-200"
            >
              Sign Up Now
            </Link>
            <Link 
              to="/explore-projects" 
              className="px-8 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg font-semibold transition"
            >
              Browse Open Work
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
