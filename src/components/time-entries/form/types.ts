export interface TimeEntryFormValues {
  project_id: string;
  task_id: string;
  description?: string;
  start_time: string;
  end_time?: string;
  invoice_number?: string;
}