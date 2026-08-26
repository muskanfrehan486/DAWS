export default function IdeasBrandPanel() {
  return (
    <div className="hidden lg:block relative w-[52%] min-h-screen overflow-hidden bg-[#f7faf7]">
      <img
        src="/login-panel.jpg"
        alt="Ideas Flow"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div
        className="absolute inset-y-0 right-0 w-20 bg-white pointer-events-none"
        style={{ clipPath: 'ellipse(100% 72% at 100% 50%)' }}
        aria-hidden
      />
    </div>
  )
}
