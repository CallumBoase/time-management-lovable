import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useTimeEntry = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveTimeEntry = async (values: any, entry?: any) => {
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
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving time entry",
        description: error.message,
      });
      return false;
    }
  };

  return { saveTimeEntry };
};