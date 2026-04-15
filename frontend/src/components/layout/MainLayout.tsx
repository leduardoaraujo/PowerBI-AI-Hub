import { Outlet } from "react-router-dom";
import { SessionList } from "../sidebar/SessionList";

export function MainLayout() {
  return (
    <div className="h-screen flex">
      <div className="w-72 flex-shrink-0">
        <SessionList />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}