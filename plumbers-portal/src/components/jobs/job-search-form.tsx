// src/components/jobs/job-search-form.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface JobSearchFormProps {
  onSearch: (filters: { query: string; urgency: string }) => void;
  defaultQuery?: string;
  defaultUrgency?: string;
}

export function JobSearchForm({ onSearch, defaultQuery = "", defaultUrgency = "" }: JobSearchFormProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [urgency, setUrgency] = useState(defaultUrgency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, urgency });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
      <Input
        placeholder="Search jobs..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="md:max-w-sm"
      />
      <Select value={urgency} onValueChange={setUrgency}>
        <SelectTrigger className="md:w-[180px]">
          <SelectValue placeholder="Urgency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="emergency">Emergency</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
          <SelectItem value="soon">Soon</SelectItem>
          <SelectItem value="flexible">Flexible</SelectItem>
        </SelectContent>
      </Select>
      {/* <select
        value={urgency}
        onChange={e => setUrgency(e.target.value)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[180px]">
        <option value="">All Urgencies</option>
        <option value="emergency">Emergency</option>
        <option value="urgent">Urgent</option>
        <option value="soon">Soon</option>
        <option value="flexible">Flexible</option>
      </select> */}
      <Button type="submit" className="md:w-auto bg-blue-500 text-white">
        <Search className="h-4 w-4 mr-2" /> Search
      </Button>
    </form>
  );
}
