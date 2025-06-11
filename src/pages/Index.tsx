
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { ArrowRight } from 'lucide-react';
import { StyleJSX } from '@/utils/jsx-style';

const Index = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Slight delay before showing content for better animation effect
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="container mx-auto p-4 flex items-center justify-between">
        <Logo className="text-primary" />
        
        <div className="hidden sm:flex items-center space-x-6">
          <Link to="/register" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Registration
          </Link>
          <Link to="/access" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Access Control
          </Link>
          <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Admin Dashboard
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
        </div>
        
        <Button 
          onClick={() => navigate('/register')} 
          variant="outline"
          className="glass-button"
        >
          Get Started
        </Button>
      </header>
      
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-lg"
          >
            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-primary/10 text-primary text-sm font-medium">
              Smart Hotel Access System
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Intelligent Access <br />
              <span className="text-primary">Facial Recognition</span> <br />
              for Modern Hotels
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8">
              Experience the future of hotel security and convenience with our advanced facial recognition system. 
              Seamless check-ins, enhanced security, and personalized guest experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={() => navigate('/register')} 
                size="lg" 
                className="group"
              >
                <span>Register Now</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              
              <Button 
                onClick={() => navigate('/access')} 
                variant="outline" 
                size="lg"
              >
                Try Access Control
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.95 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hidden lg:block relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 rounded-xl opacity-20 blur-2xl"></div>
            
            <div className="relative">
              {/* Main illustration */}
              <div className="glass-card p-6 rounded-xl shadow-2xl">
                <div className="aspect-video rounded-lg overflow-hidden relative bg-black">
                  <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-800 opacity-90"></div>
                  
                  {/* Facial scan UI elements */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary rounded-full relative flex items-center justify-center">
                      {/* Face outline */}
                      <div className="w-32 h-40 border border-primary/60 rounded-full"></div>
                      
                      {/* Scan animation */}
                      <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping"></div>
                      
                      {/* Scan line */}
                      <div 
                        className="absolute w-full h-0.5 bg-primary/70 blur-sm" 
                        style={{ 
                          animation: 'scanMove 2s ease-in-out infinite',
                          top: '50%'
                        }}
                      ></div>
                      
                      {/* Scan points */}
                      <div className="absolute w-1 h-1 rounded-full bg-primary animate-pulse" style={{ top: '35%', left: '38%' }}></div>
                      <div className="absolute w-1 h-1 rounded-full bg-primary animate-pulse" style={{ top: '35%', right: '38%' }}></div>
                      <div className="absolute w-1 h-1 rounded-full bg-primary animate-pulse" style={{ top: '45%', left: '50%' }}></div>
                      <div className="absolute w-1 h-1 rounded-full bg-primary animate-pulse" style={{ top: '60%', left: '38%' }}></div>
                      <div className="absolute w-1 h-1 rounded-full bg-primary animate-pulse" style={{ top: '60%', right: '38%' }}></div>
                    </div>
                  </div>
                  
                  {/* Status indicators */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="text-xs text-white font-mono">REC</div>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white text-xs font-mono mb-1">Scanning...</div>
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full"
                        style={{ 
                          width: '60%',
                          animation: 'progressPulse 2s ease-in-out infinite'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Advanced Facial Recognition</h3>
                    <p className="text-sm text-muted-foreground">Secure biometric authentication</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>
              </div>
              
              {/* Feature cards */}
              <div className="glass-card absolute -right-12 -bottom-10 p-4 rounded-lg shadow-lg max-w-[200px]">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m15 9-6 6"></path>
                      <path d="m9 9 6 6"></path>
                    </svg>
                  </div>
                  <h4 className="ml-2 font-medium">Security Alert</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Instant alerts for unauthorized access attempts
                </p>
              </div>
              
              <div className="glass-card absolute -left-12 -top-10 p-4 rounded-lg shadow-lg max-w-[200px]">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <h4 className="ml-2 font-medium">Enhanced Security</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Biometric verification for all access points
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-6 px-4 border-t">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <Logo className="text-primary" />
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} IFDD. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
      
      {/* CSS keyframes - Using our StyleJSX component */}
      <StyleJSX>
        {`
          @keyframes scanMove {
            0%, 100% { transform: translateY(-20px); }
            50% { transform: translateY(20px); }
          }
          
          @keyframes progressPulse {
            0%, 100% { width: 60%; }
            50% { width: 75%; }
          }
        `}
      </StyleJSX>
    </div>
  );
};

export default Index;
