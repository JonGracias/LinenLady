// src/app/admin/drafts/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Draft from "@/components/admin/Drafts"


export default function DraftItemPage() {
  const params = useParams();
  const id = params?.id as string;
  const inventoryId = Number(id);

  return (
    <Draft inventoryId={inventoryId} /> 
  );
}