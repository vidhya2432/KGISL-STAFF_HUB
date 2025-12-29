'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { performanceData } from '@/lib/data';

export function GradeDistributionChart() {
  const gradeRanges = [
    { name: '0-59 (F)', range: [0, 59] },
    { name: '60-69 (D)', range: [60, 69] },
    { name: '70-79 (C)', range: [70, 79] },
    { name: '80-89 (B)', range: [80, 89] },
    { name: '90-100 (A)', range: [90, 100] },
  ];

  const data = gradeRanges.map(grade => ({
    name: grade.name,
    total: performanceData.filter(p => p.average >= grade.range[0] && p.average <= grade.range[1]).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Distribution</CardTitle>
        <CardDescription>Overall student performance based on average scores.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--card-foreground))',
              }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
