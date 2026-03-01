import { motion } from "framer-motion";
import { Upload, FileText, PenLine, X, CheckCircle, File, Bot } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

import { documentService } from "@/lib/documentService";
import { toast } from "sonner";

type UploadedFile = {
  name: string;
  size: string;
  type: "pdf" | "text";
  status: "uploading" | "done" | "error";
};

const UploadData = () => {
  const [activeTab, setActiveTab] = useState<"file" | "write">("file");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [manualText, setManualText] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadedFile[] = Array.from(fileList)
      .filter((f) => f.type === "application/pdf" || f.type === "text/plain" || f.name.endsWith(".txt") || f.name.endsWith(".pdf"))
      .map((f) => ({
        name: f.name,
        size: formatSize(f.size),
        type: f.name.endsWith(".pdf") ? "pdf" : "text",
        status: "uploading" as const,
      }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Process each file
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!newFiles.find(nf => nf.name === file.name)) continue;

      try {
        await documentService.processDocument(file);

        setFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, status: "done" } : f
        ));
        toast.success(`Procesado: ${file.name}`);
      } catch (error) {
        console.error(error);
        setFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, status: "error" } : f
        ));
        toast.error(`Error al procesar: ${file.name}`);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmitManual = async () => {
    if (!manualText.trim()) return;

    const title = manualTitle.trim() || "Nota sin título";

    // Optimistic Update
    setFiles((prev) => [
      ...prev,
      {
        name: title,
        size: `${manualText.length} chars`,
        type: "text",
        status: "uploading",
      },
    ]);

    try {
      // Create a pseudo-file or handle text directly in service
      // For now, let's assume service handles manual text if passed differently or we mimic a file
      // Updating documentService to handle raw text is better, checking implementation...
      // Yes, processDocument takes (file, manualText)

      await documentService.processDocument(null as any, manualText);

      setFiles(prev => prev.map(f =>
        f.name === title && f.status === "uploading" ? { ...f, status: "done" } : f
      ));

      setManualText("");
      setManualTitle("");
      toast.success("Nota guardada en tu cerebro digital");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la nota");
      setFiles(prev => prev.map(f =>
        f.name === title ? { ...f, status: "error" } : f
      ));
    }
  };

  const tabs = [
    { id: "file" as const, label: "Subir archivo", icon: Upload },
    { id: "write" as const, label: "Escribir", icon: PenLine },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-foreground tracking-wide">
          Subir Datos
        </h1>
        <p className="text-sm text-muted-foreground font-light mt-1">
          Alimenta tus bóvedas con archivos PDF, texto o notas escritas.
        </p>
      </motion.div>

      {/* Auto-classification notice */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/5 border border-primary/10">
        <Bot className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
        <p className="text-xs text-muted-foreground font-light">
          KAWA clasificará automáticamente tu información en la bóveda correcta.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-display transition-colors border-b-2 -mb-[1px]",
              activeTab === tab.id
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" strokeWidth={1.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* File upload */}
      {activeTab === "file" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            <Upload
              className={cn(
                "w-10 h-10 mx-auto mb-3",
                dragOver ? "text-primary" : "text-muted-foreground/40"
              )}
              strokeWidth={1}
            />
            <p className="text-sm text-muted-foreground font-light">
              Arrastra archivos aquí o{" "}
              <span className="text-primary underline underline-offset-2">
                selecciona
              </span>
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              PDF, TXT — máx. 20MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </motion.div>
      )}

      {/* Manual write */}
      {activeTab === "write" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Título (opcional)"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/30 transition-colors font-light"
          />
          <textarea
            placeholder="Escribe o pega tu información aquí..."
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            rows={8}
            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/30 transition-colors font-light resize-none leading-relaxed"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground/50">
              {manualText.length} caracteres
            </span>
            <button
              onClick={handleSubmitManual}
              disabled={!manualText.trim()}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-display transition-colors",
                manualText.trim()
                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                  : "bg-muted text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              Guardar nota
            </button>
          </div>
        </motion.div>
      )}

      {/* Uploaded files list */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <h3 className="text-xs font-display tracking-wider uppercase text-muted-foreground/60">
            Archivos ({files.length})
          </h3>
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
            >
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                {file.type === "pdf" ? (
                  <FileText className="w-4 h-4 text-primary" strokeWidth={1.5} />
                ) : (
                  <File className="w-4 h-4 text-primary" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground/50">{file.size}</p>
              </div>
              {file.status === "uploading" ? (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : file.status === "error" ? (
                <X className="w-4 h-4 text-destructive shrink-0" strokeWidth={1.5} />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
              )}
              <button
                onClick={() => removeFile(i)}
                className="p-1 rounded hover:bg-muted text-muted-foreground/50 hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default UploadData;
