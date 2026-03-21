import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Github, ExternalLink, Globe, Users, Zap } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-gradient" />
      
      {/* Decorative blobs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-blob animation-delay-2000" />

      {/* Content */}
      <div className="relative z-10 min-h-screen py-12 px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="fixed top-6 left-6 h-12 px-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white z-50"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto space-y-12 mt-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-white">
              About <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-green-300 bg-clip-text text-transparent">BriWorld</span>
            </h1>
            <p className="text-xl text-gray-300">
              A production-ready, real-time multiplayer geography quiz game
            </p>
          </div>

          {/* Main Description */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-4">
            <h2 className="text-2xl font-bold text-white">What is BriWorld?</h2>
            <p className="text-gray-300 leading-relaxed">
              BriWorld is an immersive, real-time multiplayer geography quiz game built with cutting-edge technologies. 
              Challenge players worldwide, test your geography knowledge, and compete on live leaderboards. 
              With 5 active game modes, intelligent color management, and persistent player sessions, BriWorld delivers 
              a lag-free gaming experience powered by WebSocket synchronization.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Multiplayer</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Up to 6 players per room with real-time WebSocket synchronization and server-authoritative scoring
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-teal-400" />
                <h3 className="text-lg font-semibold text-white">5 Game Modes</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Flag Quiz, World Map, Silhouette, Border Logic, and Last Standing
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Advanced Features</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Fuzzy matching, color management, persistent sessions, and broadcast synchronization
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Technology Stack</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">Backend</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Go 1.25 with Fiber v2 framework</li>
                  <li>• Neon PostgreSQL (serverless)</li>
                  <li>• Upstash Redis for caching</li>
                  <li>• WebSocket real-time communication</li>
                  <li>• JWT authentication (HS256)</li>
                  <li>• bcrypt password hashing</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-teal-300 mb-3">Frontend</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• React 18 with TypeScript</li>
                  <li>• Vite for fast builds</li>
                  <li>• Tailwind CSS + shadcn/ui</li>
                  <li>• D3.js for map rendering</li>
                  <li>• Custom WebSocket hooks</li>
                  <li>• Dark mode support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Core Features */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-4">
            <h2 className="text-2xl font-bold text-white">Core Features</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-white">Real-Time Multiplayer</p>
                  <p className="text-sm text-gray-400">Up to 6 players with instant synchronization</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-white">Color Management</p>
                  <p className="text-sm text-gray-400">8 unique colors with server-side validation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-white">Fuzzy Matching</p>
                  <p className="text-sm text-gray-400">Accepts close answers (Levenshtein distance ≤ 2)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-white">Persistent Sessions</p>
                  <p className="text-sm text-gray-400">Auto-reconnect on page refresh with Redis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-white">User Profiles</p>
                  <p className="text-sm text-gray-400">Avatar upload, achievements, statistics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-white">Enterprise Security</p>
                  <p className="text-sm text-gray-400">JWT auth, bcrypt hashing, SQL injection prevention</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Get Involved</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <a 
                href="https://github.com/Flack74/BriWorld" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-lg font-semibold border-0 transition-all group-hover:shadow-lg group-hover:shadow-gray-500/20">
                  <Github className="w-5 h-5 mr-3" />
                  GitHub Repository
                  <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </a>

              <a 
                href="https://github.com/Flack74" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-lg font-semibold border-0 transition-all group-hover:shadow-lg group-hover:shadow-gray-500/20">
                  <Github className="w-5 h-5 mr-3" />
                  Developer GitHub
                  <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </a>

              <a 
                href="https://briworld.onrender.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white text-lg font-semibold border-0 transition-all group-hover:shadow-lg group-hover:shadow-cyan-500/30">
                  <Globe className="w-5 h-5 mr-3" />
                  Play Live Demo
                  <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </a>

              <a 
                href="https://flack74.site" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold border-0 transition-all group-hover:shadow-lg group-hover:shadow-purple-500/30">
                  <Globe className="w-5 h-5 mr-3" />
                  Developer Portfolio
                  <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-2 pb-8">
            <p className="text-gray-300">
              ❤️ Created with love and respect for Briella
            </p>
            <p className="text-gray-400 text-sm">
              Made with care • Built with Go, React, and TypeScript
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
