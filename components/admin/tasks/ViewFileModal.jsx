"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export default function ViewFileModal({ open, onClose, file, fileType, url }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#0b0b0b] border border-[#222]">
        <DialogHeader>
          <DialogTitle className="text-white truncate">{file?.name}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex justify-center items-center">
          {fileType === "video" && <video src={url} controls className="max-h-[70vh] rounded-xl" />}
          {fileType === "image" && <img src={url} alt={file?.name} className="max-h-[70vh] rounded-xl" />}
          {fileType === "audio" && <audio src={url} controls className="w-full" />}
          {(fileType === "pdf" || fileType === "doc" || fileType === "excel") && (
            <iframe src={url} className="w-full h-[70vh] rounded-xl" />
          )}
          {fileType === "file" && <p className="text-gray-400">Preview not available</p>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}><X size={16} /> Close</Button>
          <a href={url} download>
            <Button><Download size={16} /> Download</Button>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
