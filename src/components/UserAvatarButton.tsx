import { useState } from "react";

import {useAuth } from "basictech-react"
// import { useAuth } from "../lib.jsx";

function UserAvatarButton() {
  const { authState, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogin = () => {
    login();
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-gray-700"
        onClick={toggleDropdown}
      >
        {authState.isAuthenticated ? (
          <span>{authState.user.name.slice(0, 1)}</span>
        ) : (
          <span>Login</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          {authState.isAuthenticated ? (
            <div className="p-4">
              <p className="text-gray-700 font-medium">
                {authState.user.name}
              </p>
              <p className="text-gray-500">{authState.user.email}</p>
              <button
                className="mt-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="p-4">
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md"
                onClick={handleLogin}
              >
                Login
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserAvatarButton;