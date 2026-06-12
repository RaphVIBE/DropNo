"use client";

import { useEffect } from "react";

import { phCapture } from "@/lib/analytics/client";

/**
 * Event métier « drop_view » : une vue de la page d'une pièce, avec ses
 * propriétés (drop_id, n°, titre, maison, statut au moment de la vue).
 * C'est la matière première des cadrans « vues par montre » de l'admin.
 */
export function DropViewTracker({
  dropId, dropNumber, dropTitle, brand, dropStatus,
}: {
  dropId: string;
  dropNumber: number;
  dropTitle: string;
  brand: string | null;
  dropStatus: string | null;
}) {
  useEffect(() => {
    phCapture("drop_view", {
      drop_id: dropId,
      drop_number: dropNumber,
      drop_title: dropTitle,
      brand: brand ?? undefined,
      drop_status: dropStatus ?? undefined,
    });
  }, [dropId, dropNumber, dropTitle, brand, dropStatus]);

  return null;
}
