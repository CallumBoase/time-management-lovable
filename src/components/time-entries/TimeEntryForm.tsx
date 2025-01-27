import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TimeEntry } from "./types";
import ProjectSelect from "./form/ProjectSelect";
import TaskSelect from "./form/TaskSelect";
import TimeFields from "./form/TimeFields";
import { TimeEntryFormValues } from "./form/types";

interface TimeEntryFormProps {
  entry?: TimeEntry;
  onSubmit: (values: TimeEntryFormValues) => Promise<void>;
  onCancel: () => void;
}

const TimeEntryForm = ({ entry, onSubmit, onCancel }: TimeEntryFormProps) => {
  const defaultValues: TimeEntryFormValues = {
    project_id: entry?.project_id || "",
    task_id: entry?.task_id || "",
    description: entry?.description || "",
    start_time: entry?.start_time ? new Date(entry.start_time).toISOString().slice(0, 16) : "",
    end_time: entry?.end_time ? new Date(entry.end_time).toISOString().slice(0, 16) : "",
    invoice_number: entry?.invoice_number || "",
  };

  const form = useForm<TimeEntryFormValues>({
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ProjectSelect form={form} />
        <TaskSelect form={form} />
        <TimeFields form={form} />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{entry ? "Update" : "Create"}</Button>
        </div>
      </form>
    </Form>
  );
};

export default TimeEntryForm;