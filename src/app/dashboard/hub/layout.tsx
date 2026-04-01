// Hub has its own full-screen layout — bypasses the main dashboard sidebar
export default function HubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
