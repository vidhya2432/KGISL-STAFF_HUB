import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { notifications } from '@/lib/data';
import { BellRing, Check } from 'lucide-react';

export default function NotificationsPage() {
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);
  
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Notifications</h1>
        <p className="text-muted-foreground">Stay up-to-date with important alerts and reminders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Notifications</CardTitle>
          <CardDescription>
            You have {unreadNotifications.length} unread notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unreadNotifications.length > 0 ? (
            unreadNotifications.map(notification => (
              <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg bg-secondary">
                <div className="flex-shrink-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <BellRing className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.date}</p>
                </div>
                <Button variant="ghost" size="sm">Mark as read</Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No new notifications.</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Read Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {readNotifications.map(notification => (
            <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="flex-shrink-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Check className="h-5 w-5" />
                </span>
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-muted-foreground">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                 <p className="text-xs text-muted-foreground mt-1">{notification.date}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
