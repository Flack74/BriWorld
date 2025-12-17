import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const CollisionDialog = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCollision = (event: CustomEvent) => {
      setMessage(event.detail.message || 'This session is already active in this room');
      setOpen(true);
    };

    window.addEventListener('session_collision', handleCollision as EventListener);

    return () => {
      window.removeEventListener('session_collision', handleCollision as EventListener);
    };
  }, []);

  const handleExit = () => {
    // Clear session and return to lobby
    sessionStorage.removeItem('currentRoomCode');
    sessionStorage.removeItem('sessionId');
    setOpen(false);
    navigate('/lobby');
  };

  const handleStay = () => {
    // Just close the dialog and stay
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-card text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Session Already Active</AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/80">
            {message}
            <br /><br />
            Do you want to exit this room and end the current session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleStay}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={handleExit} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">
            Exit Room
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
