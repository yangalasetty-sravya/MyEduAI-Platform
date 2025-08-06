import React from 'react';
import { Bell } from 'lucide-react';

const Header = ({ learnerData }) => {
  // Provide fallbacks in case data is loading
  const displayName = learnerData?.fullName || 'Learner';
  const role = learnerData?.role || 'student';
  const profileImageUrl = learnerData?.profileImageUrl || `https://api.dicebear.com/6.x/initials/svg?seed=${displayName}`;

  return (
    // 'flex-shrink-0' prevents the header from shrinking
    <header className="flex-shrink-0 bg-gray-900 border-b border-gray-700">
      {/* 'flex items-center justify-between' is the key for alignment */}
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        
        {/* Left side: Can be used for page titles later */}
        <div></div>

        {/* Right side: User info and actions */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            <Bell size={20} />
          </button>
          
          <div className="w-px h-6 bg-gray-700"></div> {/* Vertical divider */}

          {/* This container aligns the image and the text */}
          <div className="flex items-center space-x-3">
            <img
              className="h-9 w-9 rounded-full object-cover ring-2 ring-offset-2 ring-offset-gray-900 ring-cyan-400"
              src={profileImageUrl}
              alt="Profile"
            />
            {/* This container stacks the name and role vertically */}
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-200">
                {displayName}
              </span>
              <span className="text-xs font-mono text-cyan-400 capitalize">
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;