import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import TimeEntryDialog from "@/components/TimeEntryDialog";
import ProjectDialog from "@/components/ProjectDialog";
import TaskDialog from "@/components/TaskDialog";
import debounce from "lodash/debounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 10;

const Timesheet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [taskSelectOpen, setTaskSelectOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [localSearchQuery, setLocalSearchQuery] = useState(""); // Local state for input
  const [searchQuery, setSearchQuery] = useState(""); // Debounced state for query
  const [sortColumn, setSortColumn] = useState("start_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
    value: string;
  } | null>(null);

  // Debounced search function
  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // Handle input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value); // Update local state immediately
    debouncedSetSearchQuery(value); // Debounce the actual search
  };

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name");

      if (error) throw error;
      return data;
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, name, project_id");

      if (error) throw error;
      return data;
    },
  });

  const { data: timeEntries, isLoading: isLoadingEntries } = useQuery({
    queryKey: [
      "timeEntries",
      page,
      searchQuery,
      sortColumn,
      sortOrder,
      projectFilter,
    ],
    queryFn: async () => {
      let query = supabase.from("time_entries").select(
        `
          *,
          project:projects(name),
          task:tasks(name)
        `,
        { count: "exact" }
      );

      // Apply search
      if (searchQuery) {
        query = query.or(
          `description.ilike.%${searchQuery}%,invoice_number.ilike.%${searchQuery}%`
        );
      }

      // Apply project filter
      if (projectFilter) {
        query = query.eq("project_id", projectFilter);
      }

      // Apply sorting
      query = query.order(sortColumn, { ascending: sortOrder === "asc" });

      // Apply pagination
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading time entries",
          description: error.message,
        });
        return { data: [], count: 0 };
      }

      return { data, count };
    },
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const handleCellEdit = async (id: string, field: string, value: string) => {

    const updateData = { [field]: value };

    // If project is changing, clear the task
    if (field === "project_id") {
      updateData.task_id = null;
    }

    const { error } = await supabase
      .from("time_entries")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating entry",
        description: error.message,
      });
    } else {
      toast({
        title: "Entry updated",
        description: "The time entry has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
    }
  };

  if (isLoadingEntries) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalPages = timeEntries?.count
    ? Math.ceil(timeEntries.count / PAGE_SIZE)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Timesheet</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => setProjectDialogOpen(true)}>
            Manage Projects
          </Button>
          <Button variant="outline" onClick={() => setTaskDialogOpen(true)}>
            Manage Tasks
          </Button>
          <Button onClick={() => setTimeEntryDialogOpen(true)}>
            <Plus className="mr-2" />
            New Time Entry
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search entries..."
          value={localSearchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        <Select
          value={projectFilter || "all"}
          onValueChange={(value) =>
            setProjectFilter(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort("project_id")}
                className="cursor-pointer"
              >
                Project{" "}
                {sortColumn === "project_id" &&
                  (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("task_id")}
                className="cursor-pointer"
              >
                Task{" "}
                {sortColumn === "task_id" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("description")}
                className="cursor-pointer"
              >
                Description{" "}
                {sortColumn === "description" &&
                  (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("start_time")}
                className="cursor-pointer"
              >
                Start Time{" "}
                {sortColumn === "start_time" &&
                  (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("end_time")}
                className="cursor-pointer"
              >
                End Time{" "}
                {sortColumn === "end_time" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("duration")}
                className="cursor-pointer"
              >
                Duration{" "}
                {sortColumn === "duration" && (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("invoice_number")}
                className="cursor-pointer"
              >
                Invoice #{" "}
                {sortColumn === "invoice_number" &&
                  (sortOrder === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeEntries?.data.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell
                  onClick={() => {
                    setEditingCell({
                      id: entry.id,
                      field: "project_id",
                      value: entry.project_id || "",
                    })
                    setProjectSelectOpen(true)
                  }}
                >
                  {editingCell?.id === entry.id &&
                  editingCell?.field === "project_id" ? (
                    <Select
                      open={projectSelectOpen}
                      onOpenChange={setProjectSelectOpen}
                      value={editingCell.value}
                      onValueChange={(value) => {
                        handleCellEdit(entry.id, "project_id", value);
                        setEditingCell(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="cursor-pointer hover:bg-gray-100 p-1 rounded">
                      {entry.project?.name || ""}
                    </span>
                  )}
                </TableCell>

                <TableCell
                  onClick={() => {
                    setEditingCell({
                      id: entry.id,
                      field: "task_id",
                      value: entry.task_id || "",
                    })
                    setTaskSelectOpen(true)
                  }}
                >
                  {editingCell?.id === entry.id &&
                  editingCell?.field === "task_id" ? (
                    <Select
                      open={taskSelectOpen}
                      onOpenChange={setTaskSelectOpen}
                      value={editingCell.value}
                      onValueChange={(value) => {
                        handleCellEdit(entry.id, "task_id", value);
                        setEditingCell(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task" />
                      </SelectTrigger>
                      <SelectContent>
                        {tasks
                          ?.filter(
                            (task) => task.project_id === entry.project_id
                          )
                          .map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="cursor-pointer hover:bg-gray-100 p-1 rounded">
                      {entry.task?.name || ""}
                    </span>
                  )}
                </TableCell>
                <TableCell
                  onClick={() =>
                    setEditingCell({
                      id: entry.id,
                      field: "description",
                      value: entry.description || "",
                    })
                  }
                >
                  {editingCell?.id === entry.id &&
                  editingCell?.field === "description" ? (
                    <Input
                      value={editingCell.value}
                      onChange={(e) =>
                        setEditingCell({
                          ...editingCell,
                          value: e.target.value,
                        })
                      }
                      onBlur={() => {
                        handleCellEdit(
                          entry.id,
                          "description",
                          editingCell.value
                        );
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCellEdit(
                            entry.id,
                            "description",
                            editingCell.value
                          );
                          setEditingCell(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="cursor-pointer hover:bg-gray-100 p-1 rounded">
                      {entry.description || ""}
                    </span>
                  )}
                </TableCell>

                <TableCell
                  onClick={() => {
                    const date = entry.start_time
                      ? new Date(entry.start_time)
                      : new Date();
                    const localDate = new Date(
                      date.getTime() - date.getTimezoneOffset() * 60000
                    );
                    setEditingCell({
                      id: entry.id,
                      field: "start_time",
                      value: localDate.toISOString().slice(0, 16),
                    });
                  }}
                >
                  {editingCell?.id === entry.id &&
                  editingCell?.field === "start_time" ? (
                    <Input
                      type="datetime-local"
                      value={editingCell.value}
                      onChange={(e) =>
                        setEditingCell({
                          ...editingCell,
                          value: e.target.value,
                        })
                      }
                      onBlur={() => {
                        const isoDate = new Date(
                          editingCell.value
                        ).toISOString();
                        handleCellEdit(entry.id, "start_time", isoDate);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const isoDate = new Date(
                            editingCell.value
                          ).toISOString();
                          handleCellEdit(entry.id, "start_time", isoDate);
                          setEditingCell(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="cursor-pointer hover:bg-gray-100 p-1 rounded">
                      {format(new Date(entry.start_time), "PPp")}
                    </span>
                  )}
                </TableCell>

                <TableCell
                  onClick={() => {
                    const date = entry.end_time
                      ? new Date(entry.end_time)
                      : new Date();
                    const localDate = new Date(
                      date.getTime() - date.getTimezoneOffset() * 60000
                    );
                    setEditingCell({
                      id: entry.id,
                      field: "end_time",
                      value: localDate.toISOString().slice(0, 16),
                    });
                  }}
                >
                  {editingCell?.id === entry.id &&
                  editingCell?.field === "end_time" ? (
                    <Input
                      type="datetime-local"
                      value={editingCell.value}
                      onChange={(e) =>
                        setEditingCell({
                          ...editingCell,
                          value: e.target.value,
                        })
                      }
                      onBlur={() => {
                        const isoDate = new Date(
                          editingCell.value
                        ).toISOString();
                        handleCellEdit(entry.id, "end_time", isoDate);
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const isoDate = new Date(
                            editingCell.value
                          ).toISOString();
                          handleCellEdit(entry.id, "end_time", isoDate);
                          setEditingCell(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="cursor-pointer hover:bg-gray-100 p-1 rounded">
                      {entry.end_time
                        ? format(new Date(entry.end_time), "PPp")
                        : "In Progress"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.duration ? String(entry.duration) : ""}
                </TableCell>
                <TableCell
                  onClick={() =>
                    setEditingCell({
                      id: entry.id,
                      field: "invoice_number",
                      value: entry.invoice_number || "",
                    })
                  }
                >
                  {editingCell?.id === entry.id &&
                  editingCell?.field === "invoice_number" ? (
                    <Input
                      value={editingCell.value}
                      onChange={(e) =>
                        setEditingCell({
                          ...editingCell,
                          value: e.target.value,
                        })
                      }
                      onBlur={() => {
                        handleCellEdit(
                          entry.id,
                          "invoice_number",
                          editingCell.value
                        );
                        setEditingCell(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCellEdit(
                            entry.id,
                            "invoice_number",
                            editingCell.value
                          );
                          setEditingCell(null);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="cursor-pointer hover:bg-gray-100 p-1 rounded">
                      {entry.invoice_number || ""}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setTimeEntryDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage(page > 1 ? page - 1 : 1)}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setPage(page < totalPages ? page + 1 : totalPages)
                }
                className={
                  page === totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <TimeEntryDialog
        open={timeEntryDialogOpen}
        onOpenChange={setTimeEntryDialogOpen}
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
      />

      <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />
    </div>
  );
};

export default Timesheet;
