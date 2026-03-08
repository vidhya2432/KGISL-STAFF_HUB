'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collectionGroup, query, limit, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText } from 'lucide-react';

export function RecentSubmissions() {
  const db = useFirestore();
  const submissionsQuery = useMemo(() => {
    if (!db) return null;
    return query(collectionGroup(db, 'submissions'), limit(5));
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
                <AvatarFallback>{sub.studentName?.charAt(0) || 'S'}</AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground font-medium">{sub.rollNumber || 'Assignment'}</p>
                <h4 className="font-bold tracking-tight">{sub.studentName || 'Unknown'}</h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{sub.status || 'Pending'}</p>
              <p className="text-[12px] text-muted-foreground">
                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
              </p>
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