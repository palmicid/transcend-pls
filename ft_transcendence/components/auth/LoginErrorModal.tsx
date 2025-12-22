export function LoginErrorModal({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-zinc-950/60 border border-white/10 p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold">Login failed</h3>
        <p className="mt-2 text-white/70">{message}</p>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-white text-zinc-950 font-semibold py-2.5 hover:opacity-90"
        >
          OK
        </button>
      </div>
    </div>
  );
}
