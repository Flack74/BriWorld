import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReconnectionDialogProps {
  isReconnecting: boolean;
  onReconnected: () => void;
}

export const ReconnectionDialog = ({ isReconnecting, onReconnected }: ReconnectionDialogProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isReconnecting) {
      setOpen(true);
    } else {
      // Close after successful reconnection
      if (open) {
        setTimeout(() => {
          setOpen(false);
          onReconnected();
        }, 1000);
      }
    }
  }, [isReconnecting, open, onReconnected]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-card text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isReconnecting ? 'Reconnecting...' : 'Reconnected!'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/80">
            {isReconnecting ? (
              <>
                <div className="flex items-center justify-center gap-2 my-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                Restoring your game session...
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 my-4">
                  <span className="text-4xl">✅</span>
                </div>
                Your game has been restored successfully!
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!isReconnecting && (
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpen(false)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
