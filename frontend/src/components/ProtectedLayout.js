// ProtectedLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const ProtectedLayout = () => {
  return (
    <div className="flex w-screen h-screen">
      <Navbar />
      <div className="w-full h-full bg-gray-50">
        <div className="h-[calc(100vh-50px)] border-gray-300 rounded-md h-full overflow-y-auto w-full">
          <Outlet />  {/* Ici toutes les pages sécurisées apparaîtront */}
        </div>
      </div>
    </div>
  );
};

export default ProtectedLayout;
