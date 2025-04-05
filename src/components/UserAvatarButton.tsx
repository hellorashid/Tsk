import { useState } from "react";
//@ts-ignore
import { useBasic } from "@basictech/react"

function UserAvatarButton() {
  const { signin, signout, isSignedIn, user, isAuthReady, dbStatus } = useBasic();
  const [isOpen, setIsOpen] = useState(false);
  // Mock notification state - in a real app, this would come from your notification system
  const [hasNotifications, setHasNotifications] = useState(true);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogin = () => {
    signin();
    setIsOpen(false);
  };

  const handleLogout = () => {
    signout();
    setIsOpen(false);
  };

  // Determine notification dot color based on dbStatus
  const getNotificationColor = () => {
    switch (dbStatus) {
      case "OFFLINE":
        return "bg-gray-400";
      case "ONLINE":
        return "bg-green-500";
      default:
        return "bg-yellow-500"; // For loading or any other status
    }
  };

  if (!isAuthReady) {
    return <div></div>;
  }

  return (
    <div className="relative">
      <div className="relative">
        <button
          className=" rounded-full flex items-center justify-center bg-base-300 text-white w-8 h-8 overflow-hidden"
          onClick={toggleDropdown}
        >
          {isSignedIn ? (
            <span className="flex items-center justify-center w-full h-full">{user?.name?.slice(0, 1)}</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        {hasNotifications && (
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getNotificationColor()} rounded-full border-2 border-base-300`}></span>
        )}
      </div>
      {isOpen && (
        <div className="absolute menu right-0 mt-2 w-56 bg-base-300 rounded-md shadow-lg z-10">
          {isSignedIn ? (
            <div className="p-4 text-left">
              <p className="text-slate-100 font-medium">
                hi, {user?.name}
              </p>
              {/* <p className="text-gray-200">{user?.email}</p> */}
              
              <div className="divider"></div> 

              <li onClick={handleLogout}><a className="text-grey-100">Logout</a></li>

            </div>
          ) : (
            <div className="p-2 text-left">
              
              <h6>You can always use tsk without creating an account. Your data will only be stored in your browser. </h6>

              <h6>Login for more features:</h6>
              <p> - sync between mobile & desktop</p>
              <p> - share tasks with frens</p>
              <p> - backup your tasks</p>

              <div className="divider"></div> 


              <button
                className="btn btn-md w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md"
                onClick={handleLogin}
              >
                Login with Basic
              </button>
              
              <p className="pt-2 font-mono">tsk uses Basic for login, so your data is always private.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserAvatarButton;