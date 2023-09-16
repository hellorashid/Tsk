export const AboutModal = () => {
  return (
    <>
      <form method="dialog" className="modal-box">

        <div className="modal-header">
          <h2 className="text-2xl font-bold">About</h2>
        </div>
        <div className="modal-body">
          <p className="about-blurb whitespace-pre-wrap overflow-hidden break-words text-left text-sm mt-4">
            {`tldr: tsk is a cozy & customizable task manager. 

• tsk is built to be fully customizable and expandable - it can be a simple todo list, or a planner for your entire life.
• your data is private, and yours. everything is stored locally on your device.
• open source - add your own features & fixes, and let the community benefit
• free.`}
          </p>
        </div>

        <div className="modal-footer">
          <div className="divider"></div>
          <h6 className="font-mono">built by: <a target="_blank" href="https://twitter.com/_ingriddsss">@_ingriddsss</a> & <a target="_blank" href="https://twitter.com/razberrychai">@razberrychai</a> </h6>
          <p>we'd love to hear your feedback!</p>
        </div>


      </form>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </>
  );
};
