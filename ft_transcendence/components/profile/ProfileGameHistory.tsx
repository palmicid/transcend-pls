import type { ProfileGameSummary, ProfileUser } from "@/types/profile";

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function formatDuration(durationMs: number | null): string {
  if (!durationMs || durationMs < 1000) return "< 1s";

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${totalSeconds}s`;
  return `${minutes}m ${seconds}s`;
}

function ResultBadge({ result }: { result: ProfileGameSummary["result"] }) {
  const classes = {
    win: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    loss: "bg-red-500/15 text-red-300 border-red-400/20",
    draw: "bg-amber-500/15 text-amber-200 border-amber-400/20",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${classes[result]}`}>
      {result}
    </span>
  );
}

function TicTacToeBoard({ board }: { board: unknown[] }) {
  const cells = board.slice(0, 9);

  return (
    <div className="grid w-fit grid-cols-3 gap-1">
      {cells.map((cell, index) => (
        <div
          key={index}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-black/20 text-sm font-semibold text-white/80"
        >
          {typeof cell === "string" ? cell : ""}
        </div>
      ))}
    </div>
  );
}

function Connect4Board({ board }: { board: unknown[][] }) {
  return (
    <div className="grid w-fit gap-1 rounded-xl border border-white/10 bg-sky-500/10 p-2">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((cell, columnIndex) => {
            const value = typeof cell === "string" ? cell.toLowerCase() : "";
            const tokenClass =
              value === "red"
                ? "bg-red-400"
                : value === "yellow"
                  ? "bg-yellow-300"
                  : "bg-white/10";

            return (
              <div
                key={`${rowIndex}-${columnIndex}`}
                className={`h-4 w-4 rounded-full border border-white/10 ${tokenClass}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function BoardPreview({ entry }: { entry: ProfileGameSummary }) {
  if (!entry.finalBoard) {
    return null;
  }

  if (entry.gameType === "tic-tac-toe" && Array.isArray(entry.finalBoard)) {
    return <TicTacToeBoard board={entry.finalBoard} />;
  }

  if (
    entry.gameType === "connect4" &&
    Array.isArray(entry.finalBoard) &&
    entry.finalBoard.every((row) => Array.isArray(row))
  ) {
    return <Connect4Board board={entry.finalBoard as unknown[][]} />;
  }

  return null;
}

export function ProfileGameHistory({ user }: { user: ProfileUser }) {
  const stats = user.stats;
  const recentGames = user.recentGames ?? [];

  return (
    <section className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-white/80">Recent Games</div>
        <div className="mt-1 text-sm text-white/50">
          Finished PvP matches with final boards and simple stats.
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatItem label="Total Games" value={String(stats.total)} />
          <StatItem label="Record" value={`${stats.wins}-${stats.losses}-${stats.draws}`} />
          <StatItem label="Win Rate" value={`${stats.winRate}%`} />
          <StatItem label="Avg Duration" value={formatDuration(stats.averageDurationMs)} />
        </div>
      ) : null}

      {recentGames.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
          No finished PvP games yet.
        </div>
      ) : (
        <div className="space-y-3">
          {recentGames.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ResultBadge result={entry.result} />
                  <span className="text-sm font-medium text-white/80">
                    {entry.gameType} vs {entry.opponent.displayName}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/55">
                  <span>Ended {new Date(entry.endedAt).toLocaleDateString()}</span>
                  <span>Duration {formatDuration(entry.durationMs)}</span>
                </div>
              </div>

              <BoardPreview entry={entry} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
