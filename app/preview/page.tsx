import { notFound } from "next/navigation";
import PreviewInner from "./PreviewInner";

// Dev-only visual harness for the UI. Hidden in production.
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PreviewInner />;
}
