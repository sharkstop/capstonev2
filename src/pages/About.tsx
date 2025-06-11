
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Hotel, Building, Globe, Eye, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="container mx-auto p-4 flex items-center justify-between">
        <Logo className="text-primary" />
        
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </header>
      
      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            {/* Larger logo display */}
            <div className="flex justify-center mb-8">
              <Logo size="large" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent mb-4">
              About IFDD
            </h1>
            <p className="text-xl text-muted-foreground">
              International Face Detection & Decision System
            </p>
          </div>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden mb-10">
            <CardContent className="p-8">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {/* New system description */}
                <p className="text-lg mb-6">
                  IFDD (International Face Detection System) is a smart security system designed for institutions 
                  and hotels. It aims to achieve the highest levels of security using advanced facial recognition 
                  AI technologies. We aspire to make it a global standard for institutional safety.
                </p>

                <h2 className="text-2xl font-bold text-primary mb-4">Our Mission</h2>
                <p className="text-lg mb-6">
                  At IFDD, we are committed to providing a seamless, real-time, and highly accurate facial 
                  recognition experience that enhances guest safety, staff management, and operational 
                  efficiency across hospitality and corporate environments.
                </p>

                <h2 className="text-2xl font-bold text-primary mb-4">Our Vision</h2>
                <p className="text-lg mb-6">
                  We envision IFDD becoming a leading international security solution deployed across hotels,
                  resorts, and corporate buildings worldwide, setting new standards for security and 
                  guest experience in a digitally transforming world.
                </p>

                <h2 className="text-2xl font-bold text-primary mb-4">Core Technologies</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-primary/5 dark:bg-primary/10">
                    <Eye className="h-10 w-10 text-primary mb-2" />
                    <h3 className="font-medium mb-1">AI Vision</h3>
                    <p className="text-sm text-muted-foreground">Advanced facial recognition with high accuracy and low false-positive rates</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-primary/5 dark:bg-primary/10">
                    <Lock className="h-10 w-10 text-primary mb-2" />
                    <h3 className="font-medium mb-1">Smart Security</h3>
                    <p className="text-sm text-muted-foreground">Real-time threat detection and intelligent access management</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-primary/5 dark:bg-primary/10">
                    <Globe className="h-10 w-10 text-primary mb-2" />
                    <h3 className="font-medium mb-1">Global Platform</h3>
                    <p className="text-sm text-muted-foreground">Scalable infrastructure that works across international settings</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-primary mb-4">Why IFDD?</h2>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                    <span>Enhanced security with state-of-the-art facial recognition technology</span>
                  </li>
                  <li className="flex items-start">
                    <Hotel className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                    <span>Tailored for hospitality environments, improving guest experiences</span>
                  </li>
                  <li className="flex items-start">
                    <Building className="h-5 w-5 text-primary mr-2 mt-1 flex-shrink-0" />
                    <span>Versatile applications across various institutional settings</span>
                  </li>
                </ul>

                <Separator className="my-8" />

                <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold text-primary mb-2">Founder's Vision</h2>
                  <p className="italic text-lg mb-4">
                    "IFDD represents my vision for a world where security and convenience coexist harmoniously,
                    empowering institutions to protect their assets while providing seamless experiences to their customers."
                  </p>
                  <p className="text-right font-medium">
                    — Abdelrahman Saleh, Creator of IFDD
                  </p>
                </div>

                <div className="mt-8">
                  <p className="text-md font-medium">
                    The entire system architecture was designed by Engineer <strong>Abdelrahman Saleh</strong>, reflecting 
                    a vision for a safer and smarter world. In collaboration with the development team.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Developed By</h2>
            <p className="mb-4">Team 16 at Mobica International School for Applied Technology</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div>
                <h3 className="text-lg font-medium mb-2">Team Members</h3>
                <ul className="space-y-1">
                  <li>Abdelrahman Saleh</li>
                  <li>Mohannad Wael</li>
                  <li>Adam Mohamed</li>
                  <li>Habiba Marzouk</li>
                  <li>Menna Allah</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Special Thanks</h3>
                <ul className="space-y-1">
                  <li>Mostafa Sami</li>
                  <li>Malak Younis</li>
                  <li>Olfat Osama</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg inline-block">
              <p className="font-medium">Project Code: 092416</p>
            </div>
          </div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-4 border-t">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-4 sm:mb-0">
            <Logo className="text-primary" />
          </div>
          
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SmarTel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
