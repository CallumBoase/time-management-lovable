export interface TimeEntry {
  id: string;
  project_id: string;
  task_id: string;
  description?: string;
  start_time: string;
  end_time?: string;
  invoice_number?: string;
  user_id: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  name: string;
  project_id: string;
}