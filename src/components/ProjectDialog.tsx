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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectDialog = ({ open, onOpenChange }: ProjectDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingProject, setEditingProject] = useState<any>(null);

  const { data: projects, isLoading } = useQuery({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = editingProject
        ? await supabase
            .from("projects")
            .update({ name, description })
            .eq("id", editingProject.id)
        : await supabase.from("projects").insert({ name, description });

      if (error) throw error;

      toast({
        title: `Project ${editingProject ? "updated" : "created"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setDescription("");
      setEditingProject(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving project",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Project deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting project",
        description: error.message,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Textarea
              placeholder="Project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            {editingProject && (
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => {
                  setEditingProject(null);
                  setName("");
                  setDescription("");
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              {editingProject ? "Update Project" : "Add Project"}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <h3 className="font-medium mb-4">Existing Projects</h3>
          <div className="space-y-2">
            {projects?.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <h4 className="font-medium">{project.name}</h4>
                  {project.description && (
                    <p className="text-sm text-gray-500">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingProject(project);
                      setName(project.name);
                      setDescription(project.description || "");
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(project.id)}
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

export default ProjectDialog;