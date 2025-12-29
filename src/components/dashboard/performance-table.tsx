'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { performanceData, assignments } from '@/lib/data';

export function PerformanceTable() {

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    const headers = ["Student Name", ...assignments.map(a => a.title), "Average"];
    csvContent += headers.join(",") + "\r\n";

    performanceData.forEach(row => {
      const rowData = [
        `"${row.studentName}"`,
        ...assignments.map(a => row[a.id] ?? 'N/A'),
        row.average.toFixed(1)
      ];
      csvContent += rowData.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "performance_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Student Performance</CardTitle>
            <CardDescription>Detailed grade book for all students and assignments.</CardDescription>
        </div>
        <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              {assignments.map(a => <TableHead key={a.id}>{a.title}</TableHead>)}
              <TableHead className="text-right">Average</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {performanceData.map((data) => (
              <TableRow key={data.studentId}>
                <TableCell className="font-medium">{data.studentName}</TableCell>
                {assignments.map(a => (
                    <TableCell key={a.id}>
                        {data[a.id] ?? <span className="text-muted-foreground">-</span>}
                    </TableCell>
                ))}
                <TableCell className="text-right font-bold">{data.average.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
