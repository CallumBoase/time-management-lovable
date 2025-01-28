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
      <DialogContent className="sm:max-w-[425px] h-[90vh] mt-[5vh]">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Edit Time Entry" : "New Time Entry"}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <TimeEntryForm
            entry={entry}
            onSubmit={handleSubmit}
            onCancel={() => {
              onOpenChange(false);
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;