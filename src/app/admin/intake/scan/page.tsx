"use client";

import { useEffect } from "react";
import CameraIntake from "@/components/admin/CameraIntake";

export default function Page() {
  useEffect(() => {
    console.log("isSecureContext:", window.isSecureContext);
    console.log("mediaDevices:", navigator.mediaDevices);
    console.log(
      "getUserMedia:",
      typeof navigator.mediaDevices?.getUserMedia === "function"
        ? navigator.mediaDevices.getUserMedia
        : undefined
    );
  }, []);

  return (
    <section>
      <CameraIntake />
    </section>
  );
}
