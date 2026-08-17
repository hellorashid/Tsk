export const SHAREABLE_REPO_TYPE = "basic-schema";

export function defaultRepoType(
  repos: Array<{ id: string; schema_type?: string; access?: { is_default?: boolean } }>,
  defaultRepoId?: string | null,
) {
  const matched = repos.find((repo) => repo.id === defaultRepoId)
    ?? repos.find((repo) => repo.access?.is_default);
  return matched?.schema_type ?? null;
}

export function canShareFromRepoType(repoType: string | null | undefined) {
  return repoType === SHAREABLE_REPO_TYPE;
}

export function getSchemaInfoDisplay({
  projectId,
  clientId,
  localVersion,
  mode,
  serverVersion,
  defaultRepoSchemaType,
}: {
  projectId: string;
  clientId: string;
  localVersion?: number;
  mode?: string;
  serverVersion?: number;
  defaultRepoSchemaType?: string | null;
}) {
  const repoType = defaultRepoSchemaType
    ?? (mode && mode !== "unknown" ? mode : null)
    ?? "unknown";
  const versionBits = [
    localVersion != null ? `app v${localVersion}` : null,
    serverVersion != null ? `server v${serverVersion}` : null,
  ].filter((bit): bit is string => Boolean(bit));

  return {
    repoType,
    canShare: canShareFromRepoType(repoType),
    summary: versionBits.length > 0 ? `${repoType} · ${versionBits.join(" · ")}` : repoType,
    projectId,
    clientId,
    shareHint: canShareFromRepoType(repoType)
      ? undefined
      : "Sharing needs a basic-schema repo. This account is still on the older type.",
  };
}
