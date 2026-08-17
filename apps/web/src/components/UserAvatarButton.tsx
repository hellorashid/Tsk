import { useState } from "react";
import { BASIC_CLIENT_ID, basic, schema } from "../basic";
import * as Popover from '@radix-ui/react-popover';
import packageJson from '../../package.json';
import { defaultRepoType, getSchemaInfoDisplay } from "../utils/schemaInfo";
import { getSyncStatusDisplay } from "../utils/syncStatus";

function UserAvatarButton() {
  const { signIn, signOut, isSignedIn, user, isReady, sync, status } = basic.useBasic();
  const schemaStatus = basic.useSchemaStatus();
  const { repos, defaultRepoId } = basic.useRepos();
  const [hasNotifications] = useState(true);
  const syncDisplay = getSyncStatusDisplay({
    isSignedIn,
    authStatus: status,
    syncStatus: sync.status,
    pendingCount: sync.pendingCount,
  });
  const schemaInfo = getSchemaInfoDisplay({
    projectId: schema.project_id,
    clientId: BASIC_CLIENT_ID,
    localVersion: schemaStatus.localVersion ?? schema.version,
    mode: schemaStatus.mode,
    serverVersion: schemaStatus.serverVersion,
    defaultRepoSchemaType: defaultRepoType(repos, defaultRepoId),
  });

  const handleLogin = () => {
    void signIn().catch((error) => {
      console.error("Basic sign-in failed", error);
    });
  };

  const handleLogout = () => {
    void signOut();
  };

  // Determine notification dot color based on sync status
  const getNotificationColor = () => {
    if (status === "reauth_required" || sync.status === "error") {
      return "bg-red-500";
    }

    switch (sync.status) {
      case "online":
        return "bg-green-500";
      case "offline":
      case "ended":
        return "bg-gray-400";
      default:
        return "bg-yellow-500";
    }
  };

  if (!isReady) {
    return null;
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
          className="shadow-lg w-72 bg-[#1F1B2F] rounded-lg"
          sideOffset={5}
          align="end"
        >
          <div className="bg-[#1F1B2F] rounded-md p-2">
            {isSignedIn ? (
              <div className="p-4 text-left bg-[#1F1B2F]">
                <p className="text-slate-100 font-medium">
                  hi, {user?.name}
                </p>
                {user?.handle && (
                  <p className="text-gray-400 text-sm mt-0.5">@{user.handle}</p>
                )}

                <div className="border-t border-gray-600 my-4"></div>

                <div className="text-xs text-gray-300 space-y-1">
                  <p className="uppercase tracking-wider text-gray-400">Sync</p>
                  <p className="text-slate-100">{syncDisplay.label}</p>
                  <p className="text-gray-400">{syncDisplay.detail}</p>
                </div>

                <div className="border-t border-gray-600 my-4"></div>

                <div className="text-xs text-gray-300 font-mono space-y-1">
                  <p className="uppercase tracking-wider text-gray-400 font-sans">Schema</p>
                  <div>{schemaInfo.summary}</div>
                  <div title={schemaInfo.projectId}>project {schemaInfo.projectId}</div>
                  <div title={schemaInfo.clientId}>client {schemaInfo.clientId}</div>
                  {schemaInfo.shareHint ? (
                    <p className="font-sans text-amber-200/90 pt-1">{schemaInfo.shareHint}</p>
                  ) : null}
                </div>

                <div className="border-t border-gray-600 my-4"></div>

                <button onClick={handleLogout} className="text-white hover:text-gray-200">Logout</button>

                <div className="border-t border-gray-600 my-4"></div>
                
                <div className="text-xs text-gray-300 font-mono">
                  <div>app version: {packageJson.version}</div>
                  <div>basic version: {packageJson.dependencies['@basictech/react']}</div>
                </div>

              </div>
            ) : (
              <div className="p-2 text-left bg-[#1F1B2F]">
                <h6 className="text-white mb-2">You can always use tsk without creating an account. Your data will only be stored in your browser. </h6>

                <h6 className="text-white mb-2">Login for more features:</h6>
                <p className="text-gray-200"> - sync between mobile & desktop</p>
                <p className="text-gray-200"> - share tasks with frens</p>
                <p className="text-gray-200"> - backup your tasks</p>

                <div className="border-t border-gray-600 my-4"></div>

                <div className="text-xs text-gray-300 space-y-1 mb-4">
                  <p className="uppercase tracking-wider text-gray-400">Sync</p>
                  <p className="text-slate-100">{syncDisplay.label}</p>
                  <p className="text-gray-400">{syncDisplay.detail}</p>
                </div>


                <button
                  className="px-4 py-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors duration-200"
                  onClick={handleLogin}
                >
                  Login with Basic
                </button>

                <p className="pt-2 font-mono text-gray-300">tsk uses Basic for login, so your data is always private.</p>
                
                <div className="border-t border-gray-600 my-4"></div>
                
                <div className="text-xs text-gray-300 font-mono">
                  <div>app version: {packageJson.version}</div>
                  <div>basic version: {packageJson.dependencies['@basictech/react']}</div>
                </div>
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
