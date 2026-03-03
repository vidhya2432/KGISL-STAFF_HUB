'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function RecentSubmissions() {
  const db = useFirestore();
  const submissionsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'submissions'), limit(5));
  }, [db]);

  const { data: submissions, loading } = useCollection(submissionsQuery);

  if (loading) return <div className="text-center py-12 animate-pulse text-muted-foreground">Loading submissions...</div>;

  return (
    <div className="grid gap-4">
      {submissions && submissions.length > 0 ? (
        submissions.map((sub) => (
          <div key={sub.id} className="flex items-center justify-between p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border">
                <AvatarImage src={sub.avatarUrl} alt={sub.studentName} />
                <AvatarFallback>{sub.studentName?.charAt(0) || 'S'}</AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground font-medium">{sub.courseCode || 'Assignment'}</p>
                <h4 className="font-bold tracking-tight">{sub.studentName}</h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{sub.status}</p>
              <p className="text-[12px] text-muted-foreground">{sub.submittedAt}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-24 rounded-2xl bg-secondary/10 border border-dashed">
          <p className="text-muted-foreground font-medium">No recent submissions found.</p>
        </div>
      )}
    </div>
  );
}