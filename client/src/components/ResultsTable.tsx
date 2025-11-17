import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { Search } from "lucide-react";
import { useState } from "react";
import type { PhoneCheck } from "@shared/schema";

interface ResultsTableProps {
  results: PhoneCheck[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResults = results.filter((result) =>
    result.phoneNumber.includes(searchQuery)
  );

  const sortedResults = [...filteredResults].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <Card data-testid="card-results-table">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-semibold">Hasil Checking</CardTitle>
            <CardDescription>
              {results.length} nomor total
            </CardDescription>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Cari nomor..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
              aria-label="Search phone numbers"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12 bg-muted">#</TableHead>
                  <TableHead className="bg-muted">Nomor Telepon</TableHead>
                  <TableHead className="bg-muted">Status</TableHead>
                  <TableHead className="text-right bg-muted">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? "Tidak ada hasil yang cocok" : "Belum ada hasil checking"}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedResults.map((result, index) => (
                    <TableRow 
                      key={result.id} 
                      className={`hover-elevate ${index % 2 === 1 ? "bg-muted/20" : ""}`}
                      data-testid={`row-result-${index}`}
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-medium" data-testid={`text-number-${index}`}>
                        {result.phoneNumber}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={result.status} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground" data-testid={`text-time-${index}`}>
                        {new Date(result.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
