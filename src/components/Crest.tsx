/** Official Hapoel Ramat Gan crest (public/crest.png). */
export default function Crest({ size = 40 }: { size?: number }) {
  return (
    <img src="/crest.png" alt="הפועל רמת גן" width={size} height={size}
      className="inline-block shrink-0 rounded-full" style={{ width: size, height: size }} />
  );
}
