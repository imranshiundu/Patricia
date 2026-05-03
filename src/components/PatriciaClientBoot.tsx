"use client";

import { useEffect } from "react";
import { cleanupExpiredPatriciaRecords } from "@/lib/patricia-retention";

export function PatriciaClientBoot() {
  useEffect(() => {
    cleanupExpiredPatriciaRecords();
  }, []);

  return null;
}
