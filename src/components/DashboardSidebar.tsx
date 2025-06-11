
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Users, 
  Home, 
  Settings, 
  Shield, 
  Clock, 
  Database,
  LogOut,
  Camera
} from 'lucide-react';
import Logo from './Logo';
import { useLanguage } from '@/contexts/LanguageContext';

const sidebarVariants = {
  open: { x: 0 },
  closed: { x: '-100%' }
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
}

const SidebarItem = ({ icon, label, to, active }: SidebarItemProps) => (
  <Link to={to} className="w-full">
    <div className={`
      flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-md transition-colors
      ${active 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'}
    `}>
      {icon}
      <span>{label}</span>
    </div>
  </Link>
);

const DashboardSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="h-screen w-64 border-r border-border bg-card fixed top-0 start-0 z-30"
      variants={sidebarVariants}
      initial="open"
      animate="open"
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center space-x-2 rtl:space-x-reverse px-2 py-4">
          <Logo />
          <span className="font-semibold text-lg">{t('app.name')}</span>
        </div>
        
        <nav className="flex-1 space-y-1 mt-6">
          <SidebarItem 
            icon={<Home size={18} />} 
            label={t('nav.dashboard')} 
            to="/dashboard" 
            active={currentPath === '/dashboard'} 
          />
          
          <SidebarItem 
            icon={<Users size={18} />} 
            label={t('nav.users')} 
            to="/dashboard/users" 
            active={currentPath === '/dashboard/users'} 
          />
          
          <SidebarItem 
            icon={<User size={18} />} 
            label={t('nav.register')} 
            to="/register" 
            active={currentPath === '/register'} 
          />
          
          <SidebarItem 
            icon={<Shield size={18} />} 
            label={t('nav.access')} 
            to="/access" 
            active={currentPath === '/access'} 
          />
          
          <SidebarItem 
            icon={<Camera size={18} />} 
            label={t('nav.cameras')} 
            to="/cameras" 
            active={currentPath === '/cameras'} 
          />
          
          <SidebarItem 
            icon={<Clock size={18} />} 
            label={t('nav.logs')} 
            to="/dashboard/logs" 
            active={currentPath === '/dashboard/logs'} 
          />
          
          <SidebarItem 
            icon={<Database size={18} />} 
            label={t('nav.database')} 
            to="/dashboard/database" 
            active={currentPath === '/dashboard/database'} 
          />
          
          <SidebarItem 
            icon={<Settings size={18} />} 
            label={t('nav.settings')} 
            to="/dashboard/settings" 
            active={currentPath === '/dashboard/settings'} 
          />
        </nav>
        
        <div className="pt-4 mt-auto border-t border-border">
          <SidebarItem 
            icon={<LogOut size={18} />} 
            label={t('nav.logout')} 
            to="/" 
            active={false} 
          />
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardSidebar;
