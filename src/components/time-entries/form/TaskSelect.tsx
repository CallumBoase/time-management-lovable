import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "../types";
import { UseFormReturn } from "react-hook-form";
import { TimeEntryFormValues } from "./types";

interface TaskSelectProps {
  form: UseFormReturn<TimeEntryFormValues>;
}

const TaskSelect = ({ form }: TaskSelectProps) => {
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks", form.watch("project_id")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", form.watch("project_id"))
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!form.watch("project_id"),
  });

  return (
    <FormField
      control={form.control}
      name="task_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Task</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={!form.watch("project_id")}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {tasks?.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskSelect;