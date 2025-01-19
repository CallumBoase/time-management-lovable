import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      project_id: "",
      task_id: "",
      description: "",
      start_time: "",
      end_time: "",
      invoice_number: "",
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const { data: tasks } = useQuery({
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

  useEffect(() => {
    if (entry) {
      form.reset({
        project_id: entry.project_id,
        task_id: entry.task_id,
        description: entry.description,
        start_time: new Date(entry.start_time).toISOString().slice(0, 16),
        end_time: entry.end_time
          ? new Date(entry.end_time).toISOString().slice(0, 16)
          : "",
        invoice_number: entry.invoice_number,
      });
    } else {
      form.reset({
        project_id: "",
        task_id: "",
        description: "",
        start_time: "",
        end_time: "",
        invoice_number: "",
      });
    }
  }, [entry, form]);

  const onSubmit = async (values: any) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to create a time entry",
        });
        return;
      }

      const { error } = entry
        ? await supabase
            .from("time_entries")
            .update({
              ...values,
              start_time: new Date(values.start_time).toISOString(),
              end_time: values.end_time
                ? new Date(values.end_time).toISOString()
                : null,
            })
            .eq("id", entry.id)
        : await supabase.from("time_entries").insert({
            ...values,
            user_id: session.session.user.id,
            start_time: new Date(values.start_time).toISOString(),
            end_time: values.end_time
              ? new Date(values.end_time).toISOString()
              : null,
          });

      if (error) throw error;

      toast({
        title: `Time entry ${entry ? "updated" : "created"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      onOpenChange(false);
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving time entry",
        description: error.message,
      });
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {entry ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TimeEntryDialog;