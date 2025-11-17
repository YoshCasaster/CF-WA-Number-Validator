import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Smartphone, Info } from "lucide-react";

interface QRAuthModalProps {
  open: boolean;
  qrCode: string | null;
}

export function QRAuthModal({ open, qrCode }: QRAuthModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && buttonRef.current) {
      // Focus the info button when modal opens for accessibility
      setTimeout(() => {
        buttonRef.current?.focus();
      }, 100);
    }
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogContent 
        className="max-w-md"
        data-testid="dialog-qr-auth"
        aria-describedby="qr-description"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-center">
            Scan QR Code
          </DialogTitle>
          <DialogDescription id="qr-description" className="text-center">
            Scan kode QR ini dengan aplikasi WhatsApp Anda untuk melanjutkan
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-6">
          <div 
            className="relative w-full max-w-[300px] aspect-square bg-card rounded-md border-2 border-dashed border-border flex items-center justify-center"
            role="img"
            aria-label={qrCode ? "WhatsApp QR Code for authentication" : "Loading QR Code"}
            data-testid="container-qr-code"
          >
            {qrCode ? (
              <img 
                src={qrCode} 
                alt="WhatsApp authentication QR code. Open WhatsApp, go to Linked Devices, tap Link a Device, and scan this code." 
                className="w-full h-full object-contain p-4"
                data-testid="img-qr-code"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 
                  className="w-12 h-12 animate-spin" 
                  aria-hidden="true"
                  data-testid="loader-qr"
                />
                <p className="text-sm">Generating QR Code...</p>
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-md w-full">
            <Smartphone 
              className="w-5 h-5 mt-0.5 text-accent-foreground shrink-0" 
              aria-hidden="true" 
            />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-accent-foreground">Cara scan:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Buka WhatsApp di ponsel Anda</li>
                <li>Tap Menu atau Settings</li>
                <li>Pilih "Linked Devices"</li>
                <li>Tap "Link a Device"</li>
                <li>Arahkan ponsel ke layar ini untuk scan kode</li>
              </ol>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Modal ini akan otomatis tertutup setelah Anda berhasil scan QR code.
            </AlertDescription>
          </Alert>

          <Button
            ref={buttonRef}
            variant="outline"
            size="sm"
            disabled
            className="w-full"
            data-testid="button-qr-info"
            aria-label="QR code authentication in progress. This modal will close automatically after scanning."
          >
            <Info className="w-4 h-4 mr-2" />
            Scan QR Code untuk melanjutkan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
