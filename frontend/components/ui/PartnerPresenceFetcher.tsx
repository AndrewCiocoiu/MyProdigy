"use client";

import { useEffect, useState } from "react";
import { PartnerPresence } from "@/components/ui/PartnerPresence";
import { getHouseholdStatus } from "@/lib/api/household";
import { HouseholdStatusResponse } from "@/types/models";

/**
 * PartnerPresenceFetcher — client component that loads household status once
 * and passes partnerId + partnerName + initialOnline into the real-time PartnerPresence indicator.
 */
export function PartnerPresenceFetcher() {
  const [status, setStatus] = useState<HouseholdStatusResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHouseholdStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        // No household yet — PartnerPresence will simply not render
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // No household or no partner — render nothing
  if (!status?.hasHousehold || !status.partnerId) {
    return null;
  }

  return (
    <PartnerPresence
      partnerId={status.partnerId}
      partnerName={status.partnerName}
      initialOnline={status.isPartnerOnline}
    />
  );
}
