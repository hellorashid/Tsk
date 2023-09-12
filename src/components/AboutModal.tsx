export const AboutModal = () => {
  return (
    <>
      <form method="dialog" className="modal-box">

        <div className="modal-header">
          <h2 className="text-xl font-bold">About</h2>
        </div>
        <div className="modal-body">
          <p className="whitespace-pre-wrap overflow-hidden break-words  text-left ">
            {`tldr: tsk is a cozy & customizable task manager. 

• tsk is built to be fully customizable and expandable - it can be a simple todo list, or a planner for your entire life.
• your data is private, and yours. everything is stored locally on your device.
• open source - add your own features & fixes, and let the community benefit
• free.`}
          </p>
        </div>


      </form>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </>
  );
};
