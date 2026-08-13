import { brandGradient } from '../lib/theme.ts';

export default function IdeasBrandPanel() {
  return (
    <div
      className="hidden xl:flex flex-1 items-center justify-center p-6"
      style={{ background: brandGradient }}
    >
      <img
        src="/ideas-removebg-preview.png"
        alt="Ideas by Gul Ahmed"
        className="w-full max-w-6xl h-auto object-contain"
      />
    </div>
  );
}
