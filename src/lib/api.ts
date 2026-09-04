import axios from "axios";

export const uploadDocument = async (
  file: File,
  onProgress?: (pct: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post("/api/process", formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    }
  });

  // Map the response so it works with FileUploader's expectations
  // FileUploader expects: result.data.document_id (or result.documentId if we change it)
  // Our Next.js route returns: { success: true, documentId: "..." }
  if (res.data.success) {
    return {
      success: true,
      data: {
        document_id: res.data.documentId
      }
    };
  }

  return res.data;
};
