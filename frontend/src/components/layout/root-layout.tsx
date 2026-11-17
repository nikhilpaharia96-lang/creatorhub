import { Outlet } from "react-router-dom";
import { Header } from "./header";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
