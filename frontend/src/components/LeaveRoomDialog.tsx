import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LeaveRoomDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LeaveRoomDialog({ open, onConfirm, onCancel }: LeaveRoomDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Room?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave this game room? 
            <br />
            <strong>Note:</strong> If you refresh or close the browser, you can reconnect within 90 seconds.
            <br />
            Clicking "Leave" will permanently remove you from the room.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">Leave Permanently</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
