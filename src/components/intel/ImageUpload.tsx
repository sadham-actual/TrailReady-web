'use client';

import { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

// Viewfinder corners for tactical aesthetic
function ViewfinderCorners() {
  return (
    <>
      <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-action-orange" />
      <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-action-orange" />
      <span className="absolute left-0 bottom-0 h-4 w-4 border-l-2 border-b-2 border-action-orange" />
      <span className="absolute right-0 bottom-0 h-4 w-4 border-r-2 border-b-2 border-action-orange" />
    </>
  );
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  caption: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress: number;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Reject zero-byte files
      if (file.size === 0) {
        return 'INVALID FILE - 0KB FILES NOT ALLOWED';
      }

      // Reject files under 1KB (likely corrupted)
      if (file.size < 1024) {
        return 'FILE TOO SMALL - MINIMUM 1KB REQUIRED';
      }

      if (!file.type.startsWith('image/')) {
        return 'INVALID FILE TYPE - IMAGES ONLY';
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        return `FILE TOO LARGE - MAX ${maxSizeMB}MB`;
      }

      return null;
    },
    [maxSizeMB]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      if (images.length + fileArray.length > maxImages) {
        setError(`MAX ${maxImages} IMAGES ALLOWED`);
        return;
      }

      const newImages: ImageFile[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: URL.createObjectURL(file),
          caption: '',
          status: 'pending',
          progress: 0,
        });
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
      }
    },
    [images, maxImages, onImagesChange, validateFile]
  );

  const removeImage = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      onImagesChange(images.filter((img) => img.id !== id));
    },
    [images, onImagesChange]
  );

  const updateCaption = useCallback(
    (id: string, caption: string) => {
      onImagesChange(
        images.map((img) => (img.id === id ? { ...img, caption } : img))
      );
    },
    [images, onImagesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {canAddMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <button
            type="button"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full border-2 border-dashed transition-all duration-200 ${
              isDragging
                ? 'border-action-orange bg-action-orange/5'
                : 'border-stone-800 bg-stone-100 hover:border-stone-600 hover:bg-stone-50'
            }`}
          >
            <ViewfinderCorners />

            {/* Grid overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:16px_16px]" />

            <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10">
              <motion.div
                animate={{ scale: isDragging ? 1.1 : 1 }}
                className="mb-4 flex h-14 w-14 items-center justify-center border border-stone-800 bg-stone-50"
              >
                <Upload
                  className={`h-6 w-6 transition-colors ${
                    isDragging ? 'text-action-orange' : 'text-stone-700'
                  }`}
                />
              </motion.div>

              <p className="font-mono text-xs uppercase tracking-wider text-stone-900">
                {isDragging ? 'DROP INTEL HERE' : 'UPLOAD PHOTO INTEL'}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-stone-600">
                DRAG & DROP OR CLICK TO SELECT
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                {images.length}/{maxImages} SLOTS USED • MAX {maxSizeMB}MB EACH
              </p>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </motion.div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 border border-red-800 bg-red-950/20 px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="font-mono text-xs uppercase tracking-wider text-red-500">
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Previews */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group relative border border-stone-800 bg-stone-100"
              >
                {/* Image Preview */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={image.preview}
                    alt={image.caption || `Photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />

                  {/* Status Overlay */}
                  {image.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-900/80">
                      <div className="text-center">
                        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-action-orange border-t-transparent" />
                        <p className="font-mono text-[10px] uppercase tracking-wider text-stone-100">
                          UPLOADING {image.progress}%
                        </p>
                      </div>
                    </div>
                  )}

                  {image.status === 'complete' && (
                    <div className="absolute right-2 top-2">
                      <div className="flex h-6 w-6 items-center justify-center bg-emerald-600">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {image.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-950/80">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-stone-900 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  >
                    <X className="h-4 w-4 text-stone-100" />
                  </button>

                  {/* Index Badge */}
                  <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center bg-stone-900 font-mono text-[10px] font-bold text-action-orange">
                    {index + 1}
                  </div>
                </div>

                {/* Caption Input */}
                <div className="border-t border-stone-800 p-2">
                  <input
                    type="text"
                    value={image.caption}
                    onChange={(e) => updateCaption(image.id, e.target.value)}
                    placeholder="ADD CAPTION..."
                    className="w-full bg-transparent font-mono text-[10px] uppercase tracking-wider text-stone-900 placeholder:text-stone-500 focus:outline-none"
                    maxLength={100}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {images.length === 0 && !canAddMore && (
        <div className="flex items-center justify-center border border-stone-800 bg-stone-100 px-6 py-8">
          <div className="text-center">
            <ImageIcon className="mx-auto mb-2 h-8 w-8 text-stone-500" />
            <p className="font-mono text-xs uppercase tracking-wider text-stone-700">
              NO INTEL UPLOADED
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
