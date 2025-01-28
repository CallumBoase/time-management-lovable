import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TimeEntryForm from "./time-entries/TimeEntryForm";
import { useTimeEntry } from "./time-entries/useTimeEntry";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: any;
  onClose: () => void;
}

const TimeEntryDialog = ({
  open,
  onOpenChange,
  entry,
  onClose,
}: TimeEntryDialogProps) => {
  const { saveTimeEntry } = useTimeEntry();

  const handleSubmit = async (values: any) => {
    const success = await saveTimeEntry(values, entry);
    if (success) {
      onOpenChange(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Edit Time Entry" : "New Time Entry"}
          </DialogTitle>
        </DialogHeader>
        <TimeEntryForm
          entry={entry}
          onSubmit={handleSubmit}
          onCancel={() => {
            onOpenChange(false);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;