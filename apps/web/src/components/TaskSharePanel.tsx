import { useMemo, useState, useTransition } from "react";
import { basic } from "../basic";
import { ShareRecipientLabel, useShareRecipients } from "@basictech/react";
import { useContactHandles } from "../hooks/useContactHandles";
import { useTheme } from "../contexts/ThemeContext";
import { defaultRepoType } from "../utils/schemaInfo";
import { displayShareRecipient, isOpenShare, shareErrorMessage, shareIncludesTask, shareRecipientInput } from "../utils/shares";

interface TaskSharePanelProps {
  taskId: string;
  taskName: string;
  compact?: boolean;
}

export default function TaskSharePanel({ taskId, taskName, compact = false }: TaskSharePanelProps) {
  const { isSignedIn, isReady } = basic.useAuth();
  const { repos } = basic.useBasic();
  const { theme } = useTheme();
  const { isDarkMode } = theme;
  const shares = basic.useOutgoingShares();
  const repoType = defaultRepoType(repos);
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const taskShares = useMemo(
    () => shares.data.filter((share) => isOpenShare(share) && shareIncludesTask(share, taskId)),
    [shares.data, taskId],
  );
  const recipientDids = useMemo(
    () => taskShares.map((share) => share.recipientDid),
    [taskShares],
  );
  const contactHandles = useContactHandles(recipientDids, shares.getContactHandle);
  const shareRecipients = useShareRecipients(recipientDids);

  const submitShare = () => {
    setError(null);
    startTransition(async () => {
      try {
        await shares.create({
          repo: "default",
          ...shareRecipientInput(handle),
          role: "editor",
          scope: [{ table: "tasks", recordIds: [taskId] }],
          display: { shareName: taskName },
        });
        setHandle("");
        shares.refresh();
      } catch (shareError) {
        setError(shareErrorMessage(shareError, repoType));
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

  if (!isReady || !isSignedIn) {
    return null;
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
          className={`flex-1 min-w-0 rounded-lg px-3 py-1.5 text-sm outline-hidden focus:ring-2 border ${
            isDarkMode
              ? 'bg-white/5 border-white/10 focus:ring-white/20'
              : 'bg-black/5 border-black/10 text-gray-900 focus:ring-black/15'
          }`}
        />
        <button
          type="submit"
          disabled={isPending || !handle.trim()}
          className={`px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 ${
            isDarkMode
              ? 'bg-white/10 hover:bg-white/20'
              : 'bg-black/10 hover:bg-black/15 text-gray-900'
          }`}
        >
          {isPending ? "Sharing…" : "Share"}
        </button>
      </form>
      {repoType && repoType !== "basic-schema" && repoType !== "unknown" ? (
        <p className={`text-xs ${isDarkMode ? 'text-amber-200/90' : 'text-amber-700'}`}>
          Sharing needs a Basic schema library. This account’s tasks are still on the {repoType} repo type.
        </p>
      ) : null}
      {error ? <p className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</p> : null}
      {shares.error ? <p className={`text-xs ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{shares.error.message}</p> : null}

      {taskShares.length > 0 ? (
        <ul className="space-y-1">
          {taskShares.map((share, idx) => {
            const recipient = shareRecipients.data[idx];
            return (
              <li key={share.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  {recipient ? (
                    <ShareRecipientLabel recipient={recipient} size={20} className="truncate" />
                  ) : (
                    <span title={share.recipientDid}>
                      {displayShareRecipient(share.recipientDid, contactHandles[share.recipientDid])}
                    </span>
                  )}
                  <span className="uppercase tracking-wider opacity-60 shrink-0">{share.state}</span>
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (share.state === "pending" || share.state === "active") {
                      endShare(share.id, share.state);
                    }
                  }}
                  className="underline opacity-70 hover:opacity-100 shrink-0"
                >
                  {share.state === "pending" ? "Cancel" : "Revoke"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs opacity-60">Not shared yet. They’ll get an invite in Basic ID.</p>
      )}
    </div>
  );
}
