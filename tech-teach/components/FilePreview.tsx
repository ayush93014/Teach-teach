import Link from "next/link";
import Image from "next/image";

type FilePreviewProps = {
  fileUrl: string | null;
  fileType: "image" | "pdf" | null;
};

export function FilePreview({ fileUrl, fileType }: FilePreviewProps) {
  if (!fileUrl || !fileType) {
    return null;
  }

  if (fileType === "image") {
    return (
      <Image
        src={fileUrl}
        alt="Doubt attachment"
        width={960}
        height={540}
        unoptimized
        className="mt-2 max-h-64 w-full rounded-lg border border-slate-200 object-contain"
      />
    );
  }

  return (
    <div className="mt-2">
      <Link
        href={fileUrl}
        target="_blank"
        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        PDF Attachment - Download
      </Link>
    </div>
  );
}
