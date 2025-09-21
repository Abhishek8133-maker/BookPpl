import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Bell, Check, Clock, MessageCircle, User, FileText } from "lucide-react"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  // Mark all as read when viewing
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", data.user.id).eq("is_read", false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_request":
        return <MessageCircle className="w-5 h-5 text-primary" />
      case "booking_accepted":
        return <Check className="w-5 h-5 text-green-500" />
      case "booking_declined":
        return <Clock className="w-5 h-5 text-red-500" />
      case "new_request":
        return <FileText className="w-5 h-5 text-blue-500" />
      case "profile_update":
        return <User className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getNotificationAction = (notification: any) => {
    switch (notification.type) {
      case "booking_request":
        return (
          <Button size="sm" asChild>
            <Link href={`/bookings/${notification.related_id}`}>View Application</Link>
          </Button>
        )
      case "new_request":
        return (
          <Button size="sm" asChild>
            <Link href={`/requests/${notification.related_id}`}>View Request</Link>
          </Button>
        )
      case "booking_accepted":
      case "booking_declined":
        return (
          <Button size="sm" asChild>
            <Link href={`/bookings/${notification.related_id}`}>View Booking</Link>
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with your community activities</p>
            </div>
            <Badge variant="outline">{notifications?.length || 0} total</Badge>
          </div>

          {notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <Card key={notification.id} className={`${!notification.is_read ? "border-primary/50" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-foreground">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.is_read && <Badge variant="secondary">New</Badge>}
                            {getNotificationAction(notification)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                <p className="text-muted-foreground mb-4">
                  You&apos;ll see notifications here when people interact with your requests or when new opportunities
                  match your skills.
                </p>
                <Button asChild>
                  <Link href="/requests">Browse Requests</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
