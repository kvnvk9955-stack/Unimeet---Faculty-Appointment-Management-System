import React, { useState } from "react";
import { Link2, Copy, CheckCircle2, Video } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/services/api";

const MeetingGenerator = () => {
  const [title, setTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiClient.post("/meetings", { title, externalUrl });
      if (res.success) {
        toast.success("Secure meeting link generated");
        // Construct the full frontend join link
        const joinLink = `${window.location.origin}/join/${res.data.meetingId}`;
        setGeneratedLink(joinLink);
        setTitle("");
        setExternalUrl("");
      } else {
        toast.error(res.message || "Failed to generate link");
      }
    } catch (err) {
      toast.error("Internal server error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Secure Meeting Generator</h3>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Convert your standard Google Meet or Zoom link into a secure Unimeet Gatekeeper portal link.
      </p>

      {generatedLink ? (
        <div className="rounded-lg border border-success/30 bg-success/10 p-5">
          <div className="mb-2 flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <h4 className="font-semibold text-success-foreground">Link Ready to Share</h4>
          </div>
          <div className="mt-4 flex items-center shadow-sm">
            <input
              type="text"
              readOnly
              value={generatedLink}
              className="flex-1 rounded-l-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-r-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
          <button 
            onClick={() => setGeneratedLink("")}
            className="mt-4 text-xs font-medium text-primary hover:underline"
          >
            Generate another link
          </button>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Meeting Topic</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CS101 Final Review"
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Actual Meeting URL</label>
            <div className="relative">
               <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                required
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Secure Link"}
          </button>
        </form>
      )}
    </div>
  );
};

export default MeetingGenerator;
