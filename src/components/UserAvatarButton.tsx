import { useState } from "react";
//@ts-ignore
import { useAuth } from "basictech-react"

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
        className="avatar rounded-full flex items-center justify-center  bg-base-300 text-gray-300"
        onClick={toggleDropdown}
      >
        {authState.isAuthenticated ? (
          <span>{authState.user.name.slice(0, 1)}</span>
        ) : (
          <span>Login</span>
        )}
      </button>
      {isOpen && (
        <div className="absolute  menu right-0 mt-2 w-56 bg-base-300 rounded-md shadow-lg z-10">
          {authState.isAuthenticated ? (
            <div className="p-4 text-left">
              <p className="text-slate-100 font-medium">
                {authState.user.name}
              </p>
              <p className="text-gray-200">{authState.user.email}</p>
              
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
                className="btn btn-md  w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md"
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