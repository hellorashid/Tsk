export const SHAREABLE_REPO_TYPE = "basic-schema";

export function findDefaultRepo<T extends { id: string; access?: { is_default?: boolean } }>(
  repos: T[],
  defaultRepoId?: string | null,
) {
  return repos.find((repo) => repo.id === defaultRepoId)
    ?? repos.find((repo) => repo.access?.is_default)
    ?? repos[0]
    ?? null;
}

export function defaultRepoType(
  repos: Array<{ id: string; schema_type?: string; access?: { is_default?: boolean } }>,
  defaultRepoId?: string | null,
) {
  return findDefaultRepo(repos, defaultRepoId)?.schema_type ?? null;
}

export function canShareFromRepoType(repoType: string | null | undefined) {
  return repoType === SHAREABLE_REPO_TYPE;
}

export function getSchemaInfoDisplay({
  projectId,
  localVersion,
  mode,
  serverVersion,
  defaultRepoSchemaType,
}: {
  projectId: string;
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
    shareHint: canShareFromRepoType(repoType)
      ? undefined
      : "Sharing needs a basic-schema repo. This account is still on the older type.",
  };
}
