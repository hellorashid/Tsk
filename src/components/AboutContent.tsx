import React from 'react';

interface AboutContentProps {
    onClose: () => void;
    isDarkMode: boolean;
    isMobileDrawer?: boolean;
    currentAccentColor?: string;
}

const AboutContent: React.FC<AboutContentProps> = ({
    onClose,
    isDarkMode,
    isMobileDrawer = false,
    currentAccentColor = '#1F1B2F'
}) => {
    // Calculate background colors based on accent color
    const getBackgroundColor = () => {
        return `${currentAccentColor}80`; // 80% opacity
    };

    return (
        <div
            className={`w-full ${isMobileDrawer ? 'h-auto' : 'h-full'} p-6 ${isMobileDrawer ? '' : 'overflow-y-auto'} backdrop-blur-sm rounded-md flex flex-col ${isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}
            style={{ backgroundColor: isMobileDrawer ? 'transparent' : getBackgroundColor() }}
        >
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-bold">Welcome to tsk.lol</h1>
                <button
                    onClick={onClose}
                    className={`bg-transparent focus:outline-none`}
                    aria-label="Close about"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="space-y-6">
                {/* About */}
               
                    <div className="space-y-4">
                        <p className="about-blurb whitespace-pre-wrap overflow-hidden break-words text-left text-sm">
                            tsk is a cozy & customizable task & time manager.
                        </p>
                        <ul className="list-disc list-outside text-sm pl-4">
                            <li>tsk is built to be fully customizable and expandable</li>
                            <li>your data is private, and yours. everything is stored locally on your device, and sync is optional</li>
                            <li>open source - add your own features & fixes, learn from the code, fork and make it your own</li>
                            <li>free :D </li>
                        </ul>


                        <div className="border-t border-white/10 pt-2">
                            <h6 className="font-mono text-sm mb-2">
                                built by: <a target="_blank" href="https://twitter.com/_ingriddsss" className="hover:underline">@_ingriddsss</a> & <a target="_blank" href="https://twitter.com/razberrychai" className="hover:underline">@razberrychai</a>
                            </h6>
                            <p className="text-sm opacity-80">we'd love to hear your feedback!</p>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default AboutContent;

