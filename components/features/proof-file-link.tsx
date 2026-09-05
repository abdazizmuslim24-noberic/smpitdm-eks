"use client";

import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";

function openDataUri(dataUri: string) {
  const [meta, b64] = dataUri.split(",", 2);
  const mime = meta.split(":")[1]?.split(";")[0] ?? "application/octet-stream";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);

  // Anchor-click is the reliable way to open blob URLs in a new tab.
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke after a delay so the new tab can load the blob.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Opens a stored proof file (base64 data URI or legacy path).
 * Browsers block top-level navigation to data: URIs, so we convert
 * data URIs to object URLs before opening.
 */
export function ProofFileLink({
  proofFile,
  variant = "ghost",
}: {
  proofFile: string;
  variant?: "ghost" | "inline";
}) {
  function handleOpen() {
    if (proofFile.startsWith("data:")) {
      openDataUri(proofFile);
    } else {
      window.open(proofFile, "_blank", "noopener,noreferrer");
    }
  }

  if (variant === "inline") {
    return (
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <Paperclip className="h-4 w-4" /> Lihat
      </button>
    );
  }

  return (
    <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={handleOpen}>
      <Paperclip className="h-4 w-4" /> Bukti
    </Button>
  );
}