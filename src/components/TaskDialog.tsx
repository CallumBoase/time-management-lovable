import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDialog = ({ open, onOpenChange }: TaskDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [editingTask, setEditingTask] = useState<any>(null);

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
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, project:projects(name)")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast({
        variant: "destructive",
        title: "Please select a project",
      });
      return;
    }

    try {
      const { error } = editingTask
        ? await supabase
            .from("tasks")
            .update({ name, description, project_id: projectId })
            .eq("id", editingTask.id)
        : await supabase
            .from("tasks")
            .insert({ name, description, project_id: projectId });

      if (error) throw error;

      toast({
        title: `Task ${editingTask ? "updated" : "created"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setName("");
      setDescription("");
      setProjectId("");
      setEditingTask(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving task",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Task deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting task",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Tasks</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Select
              value={projectId}
              onValueChange={setProjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Task name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Textarea
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            {editingTask && (
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => {
                  setEditingTask(null);
                  setName("");
                  setDescription("");
                  setProjectId("");
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              {editingTask ? "Update Task" : "Add Task"}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <h3 className="font-medium mb-4">Existing Tasks</h3>
          <div className="space-y-2">
            {tasks?.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <h4 className="font-medium">{task.name}</h4>
                  <p className="text-sm text-gray-500">
                    Project: {task.project.name}
                  </p>
                  {task.description && (
                    <p className="text-sm text-gray-500">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingTask(task);
                      setName(task.name);
                      setDescription(task.description || "");
                      setProjectId(task.project_id);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;