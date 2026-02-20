import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

export default function ThreadsPage() {
  const navigate = useNavigate();
  const latestThread = useThreadRegistryStore((s) => s.getLatestPersisted());
  const registerThread = useThreadRegistryStore((s) => s.registerThread);

  // If no persisted threads exist, auto-create an ephemeral one and navigate.
  // useEffect runs after the initial render so the Navigate below handles the
  // common case (existing thread) synchronously before this fires.
  useEffect(() => {
    if (latestThread) return;

    const id = crypto.randomUUID();
    registerThread(id);
    navigate(`/threads/${id}`, { replace: true });
  }, [latestThread, registerThread, navigate]);

  // Redirect to the most recently active persisted thread
  if (latestThread) {
    return <Navigate to={`/threads/${latestThread.id}`} replace />;
  }

  // Brief transitional render while the ephemeral thread is created
  // and navigation is pending — returns null to avoid any flash.
  return null;
}
