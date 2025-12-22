import type { RoomType } from "@prisma/client";

export type RoomLite = {
  id: number;
  name: string;
  type: RoomType;
  maxUsers: number;
};

function roomTypeLabel(type: RoomType): string {
  switch (type) {
    case "PONG":
      return "Pong";
    case "GENERIC":
      return "General";
    default:
      return String(type);
  }
}

export function RoomsList({ rooms }: { rooms: RoomLite[] }) {
  return (
    <section className="mt-8 sm:mt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Rooms</h2>
          <p className="text-sm text-white/60 mt-1">
            ล่าสุดจาก seed / database ของคุณ
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rooms.map((r) => (
          <div
            key={r.id}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.06] transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="mt-1 text-sm text-white/60">
                  {roomTypeLabel(r.type)} • max {r.maxUsers}
                </div>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                #{r.id}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
