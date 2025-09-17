import { useState } from "react";
//@ts-ignore
import { useBasic } from "@basictech/react"
import * as Popover from '@radix-ui/react-popover';

function UserAvatarButton() {
  const { signin, signout, isSignedIn, user, isAuthReady, dbStatus } = useBasic();
  // Mock notification state - in a real app, this would come from your notification system
  const [hasNotifications, setHasNotifications] = useState(true);

  const handleLogin = () => {
    signin();
  };

  const handleLogout = () => {
    signout();
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
    <Popover.Root>
      <Popover.Trigger asChild>
        <div className="relative">
          <button
            className="rounded-full flex items-center justify-center bg-[#1F1B2F] text-white w-8 h-8 overflow-hidden"
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
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getNotificationColor()} rounded-full border border-gray-300`}></span>
          )}
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="shadow-lg  w-64 bg-[#1F1B2F]"
          sideOffset={5}
          align="end"
        >
          <div className="bg-[#1F1B2F] rounded-md p-2">
            {isSignedIn ? (
              <div className="p-4 text-left bg-[#1F1B2F]">
                <p className="text-slate-100 font-medium">
                  hi, {user?.name}
                </p>

                <div className="border-t border-gray-600 my-4"></div>

                <button onClick={handleLogout}><a className="text-grey-100">Logout</a></button>

              </div>
            ) : (
              <div className="p-2 text-left bg-[#1F1B2F]">
                <h6>You can always use tsk without creating an account. Your data will only be stored in your browser. </h6>

                <h6>Login for more features:</h6>
                <p> - sync between mobile & desktop</p>
                <p> - share tasks with frens</p>
                <p> - backup your tasks</p>

                <div className="border-t border-gray-600 my-4"></div>


                <button
                  className="px-4 py-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors duration-200"
                  onClick={handleLogin}
                >
                  Login with Basic
                </button>

                <p className="pt-2 font-mono">tsk uses Basic for login, so your data is always private.</p>
              </div>
            )}
          </div>
          <Popover.Arrow className="fill-[#1F1B2F]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default UserAvatarButton;