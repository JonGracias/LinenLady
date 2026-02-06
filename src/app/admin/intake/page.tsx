"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import  PhotoIntakePage  from "@/components/admin/ItemIntake";
import Link from "next/link";


export default function AdminIntakePage() {

  return (
    <section>
      <Link
              href="/admin/intake/scan"
              className="rounded-lg bg-blue-600 px-5 py-2.5 
                         text-sm font-semibold text-white
                         shadow-sm hover:bg-blue-700
                         transition-colors"
            >
              Camera
      </Link>
      <PhotoIntakePage/>
    </section>
  );
}
