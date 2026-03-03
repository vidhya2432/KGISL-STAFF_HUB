'use client';

import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { useMemo } from 'react';

export function UpcomingClasses() {
  const db = useFirestore();
  const timetableQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'timetable'), limit(5));
  }, [db]);

  const { data: schedule, loading } = useCollection(timetableQuery);

  if (loading) return <div className="text-center py-12 animate-pulse text-muted-foreground">Loading schedule...</div>;

  return (
    <div className="grid gap-6">
      {schedule && schedule.length > 0 ? (
        schedule.map((item) => (
          <div key={item.id} className="group flex items-center justify-between p-8 rounded-3xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border">
            <div className="space-y-1">
              <p className="text-sm font-bold tracking-tight uppercase text-muted-foreground">{item.day} • {item.time}</p>
              <h3 className="text-2xl font-bold tracking-tight">{item.course}</h3>
              <p className="text-muted-foreground font-medium">{item.location}</p>
            </div>
            <button className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xl">›</span>
            </button>
          </div>
        ))
      ) : (
        <div className="text-center py-24 rounded-3xl bg-secondary/20 border border-dashed">
          <p className="text-muted-foreground font-medium">No upcoming classes scheduled.</p>
        </div>
      )}
    </div>
  );
}