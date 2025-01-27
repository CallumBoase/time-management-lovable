import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "../types";
import { UseFormReturn } from "react-hook-form";
import { TimeEntryFormValues } from "./types";

interface ProjectSelectProps {
  form: UseFormReturn<TimeEntryFormValues>;
}

const ProjectSelect = ({ form }: ProjectSelectProps) => {
  const { data: projects } = useQuery<Project[]>({
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

  return (
    <FormField
      control={form.control}
      name="project_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Project</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
  );
};

export default ProjectSelect;