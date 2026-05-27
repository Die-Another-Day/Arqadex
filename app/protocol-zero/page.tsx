export default function ProtocolZeroPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <iframe
        src="/protocol-zero/index.html"
        className="w-full h-full border-0"
      />
    </div>
  )
}
