import { useMemo, useState, useTransition } from "react";
import { basic } from "../basic";
import { isOpenShare, normalizeShareHandle, shareIncludesTask, shortDid } from "../utils/shares";

interface TaskSharePanelProps {
  taskId: string;
  taskName: string;
  compact?: boolean;
}

export default function TaskSharePanel({ taskId, taskName, compact = false }: TaskSharePanelProps) {
  const { isSignedIn, isReady, signIn } = basic.useAuth();
  const shares = basic.useOutgoingShares();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const taskShares = useMemo(
    () => shares.outgoingShares.filter((share) => isOpenShare(share) && shareIncludesTask(share, taskId)),
    [shares.outgoingShares, taskId],
  );

  const submitShare = () => {
    const recipientHandle = normalizeShareHandle(handle);
    if (!recipientHandle) {
      setError("Enter a Basic handle.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await shares.create({
          repo: "default",
          recipientHandle,
          role: "editor",
          scope: [{ table: "tasks", recordIds: [taskId] }],
          display: { shareName: taskName },
        });
        setHandle("");
        shares.refresh();
      } catch (shareError) {
        setError(shareError instanceof Error ? shareError.message : "Could not share this task.");
      }
    });
  };

  const endShare = (shareId: string, state: "pending" | "active") => {
    startTransition(async () => {
      try {
        if (state === "pending") {
          await shares.cancel(shareId);
        } else {
          await shares.revoke(shareId);
        }
        shares.refresh();
      } catch (shareError) {
        setError(shareError instanceof Error ? shareError.message : "Could not update this share.");
      }
    });
  };

  if (!isReady) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <div className={compact ? "pt-3" : "pt-4"}>
        <p className="text-xs opacity-70 mb-2">Sign in to share this task with a friend.</p>
        <button
          type="button"
          onClick={() => { void signIn(); }}
          className="text-xs underline opacity-80 hover:opacity-100"
        >
          Login with Basic
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? "pt-3 space-y-2" : "pt-4 space-y-3"}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Share</p>
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitShare();
        }}
      >
        <input
          type="text"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="friend.basic.id"
          autoComplete="off"
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-white/20"
        />
        <button
          type="submit"
          disabled={isPending || !handle.trim()}
          className="px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/20 disabled:opacity-40"
        >
          {isPending ? "Sharing…" : "Share"}
        </button>
      </form>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
      {shares.error ? <p className="text-xs text-red-300">{shares.error.message}</p> : null}

      {taskShares.length > 0 ? (
        <ul className="space-y-1">
          {taskShares.map((share) => (
            <li key={share.id} className="flex items-center justify-between gap-2 text-xs opacity-80">
              <span>
                {shortDid(share.recipientDid)}
                <span className="ml-2 uppercase tracking-wider opacity-60">{share.state}</span>
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (share.state === "pending" || share.state === "active") {
                    endShare(share.id, share.state);
                  }
                }}
                className="underline opacity-70 hover:opacity-100"
              >
                {share.state === "pending" ? "Cancel" : "Revoke"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs opacity-60">Not shared yet. They’ll get an invite in Basic ID.</p>
      )}
    </div>
  );
}
