"use client";

import { useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown, Edit, Trash2 } from "lucide-react";
import type { Job } from "@/lib/types/job";
import { getStatusColor, getStatusLabel, getUrgencyColor, getUrgencyLabel } from "@/lib/types/job";
import { formatDateGB } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DeleteJobDialog } from "@/components/admin/delete-job-dialog";

type SortKey = "title" | "customerName" | "status" | "createdAt";

export default function JobsPageClient({ jobs, isAdmin }: { jobs: Job[]; isAdmin?: boolean }) {
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedJobs = jobs
    .filter(Boolean)
    .filter(job => {
      const title = job.title?.toLowerCase() || "";
      // FIX: Access the nested customer name property correctly
      const customerName = job.customerContact?.name?.toLowerCase() || "";
      return title.includes(filter.toLowerCase()) || customerName.includes(filter.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;

      // Handle sorting for the nested customer name
      if (sortConfig.key === "customerName") {
        const aValue = a.customerContact?.name ?? "";
        const bValue = b.customerContact?.name ?? "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      }

      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <>
      <div className="space-y-4">
        <Input
          placeholder="Filter by job title or customer..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("title")} className="cursor-pointer">
                    <div className="flex items-center">
                      Title <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                    <div className="flex items-center">
                      Status <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("customerName")} className="cursor-pointer">
                    <div className="flex items-center">
                      Customer <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("createdAt")} className="cursor-pointer">
                    <div className="flex items-center">
                      Posted <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedJobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(job.urgency)}>{getUrgencyLabel(job.urgency)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                    </TableCell>
                    {/* FIX: Display the customer name from the nested object */}
                    <TableCell>{job.customerContact?.name}</TableCell>
                    <TableCell>{formatDateGB(job.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/admin/jobs/${job.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Job</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedJob(job);
                              setIsDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Job</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <DeleteJobDialog job={selectedJob} isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
