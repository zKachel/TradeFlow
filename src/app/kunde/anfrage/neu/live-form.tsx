"use client";

import { submitRequestAction, uploadRequestPhotoAction } from "../../actions";
import { RequestForm } from "@/components/request-form";
import type { RequestSubmitAdapter } from "@/lib/request-submission";

const liveAdapter: RequestSubmitAdapter = {
  submitRequest: (payload) => submitRequestAction(payload),
  uploadPhoto: (requestId, clientFileId, file) => {
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("clientFileId", clientFileId);
    fd.set("file", file, `${clientFileId}.jpg`);
    return uploadRequestPhotoAction(fd);
  },
};

export function LiveRequestForm() {
  return (
    <RequestForm
      mode="live"
      listPath="/kunde"
      adapter={liveAdapter}
      draftKey="tradeflow-anfrage-entwurf"
    />
  );
}
