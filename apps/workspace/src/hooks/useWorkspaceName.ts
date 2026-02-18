"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@crm/shared/hooks";

export function useWorkspaceName(): string | null {
  const { client, role, workspace_id } = useAuth();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "superadmin" || !client || workspace_id == null) {
      setName(null);
      return;
    }
    let mounted = true;
    void client
      .from("workspaces")
      .select("name")
      .eq("id", workspace_id)
      .single()
      .then(({ data, error }) => {
        if (mounted) {
          if (error || !data?.name) {
            setName(null);
          } else {
            setName(data.name as string);
          }
        }
      });
    return () => {
      mounted = false;
    };
  }, [client, role, workspace_id]);

  return name;
}
