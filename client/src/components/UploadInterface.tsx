import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Play, X, AlertCircle } from "lucide-react";
import { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import { useToast } from "@/hooks/use-toast";

interface UploadInterfaceProps {
  numbers: string;
  onNumbersChange: (numbers: string) => void;
  onStartChecking: () => void;
  isChecking: boolean;
  disabled: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadInterface({
  numbers,
  onNumbersChange,
  onStartChecking,
  isChecking,
  disabled,
}: UploadInterfaceProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const numberList = numbers
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);
  const numberCount = numberList.length;

  // Function to format phone number - auto add 62 prefix
  const formatPhoneNumber = (number: string): string => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, "");

    // If empty, return empty
    if (cleaned === "") return "";

    // If starts with 0, replace with 62
    if (cleaned.startsWith("0")) {
      return "62" + cleaned.substring(1);
    }

    // If starts with 8 (without 62), add 62
    if (cleaned.startsWith("8") && !cleaned.startsWith("62")) {
      return "62" + cleaned;
    }

    // If already starts with 62, keep as is
    if (cleaned.startsWith("62")) {
      return cleaned;
    }

    // Default: assume it needs 62 prefix
    return "62" + cleaned;
  };

  // Handle textarea input with auto formatting
  const handleNumbersChange = (value: string) => {
    // Format each line when user pastes or types
    const lines = value.split("\n");
    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed === "") return "";
      return formatPhoneNumber(trimmed);
    });

    onNumbersChange(formattedLines.join("\n"));
  };

  const validateAndReadFile = (file: File) => {
    setFileError(null);

    // Validate file type
    if (file.type !== "text/plain") {
      const error = "Invalid file type. Please upload a .txt file.";
      setFileError(error);
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const error = "File size exceeds 10MB limit.";
      setFileError(error);
      toast({
        title: "File Too Large",
        description: error,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Format numbers from file
      const lines = content.split("\n");
      const formattedLines = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed === "") return "";
        return formatPhoneNumber(trimmed);
      });
      const formattedContent = formattedLines.join("\n");

      onNumbersChange(formattedContent);
      toast({
        title: "File Uploaded",
        description: `Loaded ${formattedLines.filter(Boolean).length} numbers`,
      });
    };
    reader.onerror = () => {
      const error = "Failed to read file. Please try again.";
      setFileError(error);
      toast({
        title: "File Error",
        description: error,
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndReadFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndReadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDropzoneClick = () => {
    if (!disabled && !isChecking) {
      fileInputRef.current?.click();
    }
  };

  const handleDropzoneKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled && !isChecking) {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <Card className="h-full" data-testid="card-upload-interface">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">
          Upload Nomor Telepon
        </CardTitle>
        <CardDescription>Masukkan nomor atau upload file .txt</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="numbers">Daftar Nomor</Label>
          <Textarea
            id="numbers"
            placeholder="88980818668&#10;88987654321&#10;81234567890"
            className="font-mono text-sm h-48 resize-none"
            value={numbers}
            onChange={(e) => handleNumbersChange(e.target.value)}
            disabled={disabled || isChecking}
            data-testid="textarea-numbers"
            aria-describedby="numbers-help"
          />
          <p id="numbers-help" className="text-xs text-muted-foreground">
            Format: Satu nomor per baris. Cukup input 8XXXXXX (akan auto tambah
            62)
          </p>
        </div>

        <div
          role="button"
          tabIndex={disabled || isChecking ? -1 : 0}
          aria-label="Upload file .txt dengan nomor telepon. Klik atau drag and drop file ke sini."
          aria-disabled={disabled || isChecking}
          className={`
            border-2 border-dashed rounded-md p-6 text-center transition-all
            ${isDragging ? "border-primary bg-accent scale-[1.02]" : "border-border"}
            ${disabled || isChecking ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover-elevate focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleDropzoneClick}
          onKeyDown={handleDropzoneKeyDown}
          data-testid="div-dropzone"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleFileUpload}
            disabled={disabled || isChecking}
            data-testid="input-file"
            aria-hidden="true"
          />
          <Upload
            className="w-8 h-8 mx-auto mb-2 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">
            {isDragging ? "Drop file di sini" : "Klik atau drag file .txt"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
        </div>

        {fileError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fileError}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm">
            <span className="font-medium" data-testid="text-number-count">
              {numberCount}
            </span>
            <span className="text-muted-foreground"> nomor</span>
          </div>

          <div className="flex gap-2">
            {numbers && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onNumbersChange("");
                  setFileError(null);
                }}
                disabled={disabled || isChecking}
                data-testid="button-clear"
                aria-label="Clear all numbers"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              onClick={onStartChecking}
              disabled={disabled || isChecking || numberCount === 0}
              data-testid="button-start-checking"
              aria-label={`Start checking ${numberCount} phone numbers`}
            >
              <Play className="w-4 h-4 mr-2" />
              {isChecking ? "Checking..." : "Start Checking"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
