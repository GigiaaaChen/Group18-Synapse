"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending) {
      if (session) {
        router.push("/tasks");
      } else {
        router.push("/signup");
      }
    }
  }, [session, isPending, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#121212',
      color: '#9ca3af',
      fontSize: '14px'
    }}>
      Loading...
    </div>
  );
}
