import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Calendar, DollarSign, MapPin, Clock, MessageCircle } from "lucide-react"

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get bookings where user is the helper
  const { data: helperBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      requests (
        title,
        description,
        skill_needed,
        location
      ),
      profiles!bookings_requester_id_fkey (
        display_name,
        avatar_url,
        rating
      )
    `)
    .eq("helper_id", data.user.id)
    .order("created_at", { ascending: false })

  // Get bookings where user is the requester
  const { data: requesterBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      requests (
        title,
        description,
        skill_needed,
        location
      ),
      profiles!bookings_helper_id_fkey (
        display_name,
        avatar_url,
        rating
      )
    `)
    .eq("requester_id", data.user.id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "accepted":
        return "secondary"
      case "completed":
        return "outline"
      case "cancelled":
        return "destructive"
      case "declined":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Review"
      case "accepted":
        return "Accepted"
      case "completed":
        return "Completed"
      case "cancelled":
        return "Cancelled"
      case "declined":
        return "Declined"
      default:
        return status
    }
  }

  const BookingCard = ({ booking, isHelper }: { booking: any; isHelper: boolean }) => (
    <Card key={booking.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={
                  isHelper
                    ? booking.profiles?.avatar_url || "/placeholder.svg"
                    : booking.profiles?.avatar_url || "/placeholder.svg"
                }
              />
              <AvatarFallback>
                {isHelper
                  ? booking.profiles?.display_name?.charAt(0) || "U"
                  : booking.profiles?.display_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {isHelper ? booking.profiles?.display_name || "Anonymous" : booking.profiles?.display_name || "Helper"}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>★ {booking.profiles?.rating?.toFixed(1) || "0.0"}</span>
              </div>
            </div>
          </div>
          <Badge variant={getStatusColor(booking.status)}>{getStatusText(booking.status)}</Badge>
        </div>
        <CardTitle className="text-lg">{booking.requests?.title}</CardTitle>
        <CardDescription className="line-clamp-2">{booking.requests?.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">{booking.requests?.skill_needed}</Badge>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          {booking.requests?.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {booking.requests.location}
            </div>
          )}

          {booking.agreed_price && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />${booking.agreed_price}
            </div>
          )}

          {booking.scheduled_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(booking.scheduled_date).toLocaleDateString()}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Applied {new Date(booking.created_at).toLocaleDateString()}
          </div>
        </div>

        {booking.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">{booking.notes}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/bookings/${booking.id}`}>View Details</Link>
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
            <p className="text-muted-foreground">Manage your help requests and applications</p>
          </div>

          <Tabs defaultValue="helping" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="helping">Helping Others ({helperBookings?.length || 0})</TabsTrigger>
              <TabsTrigger value="requesting">My Requests ({requesterBookings?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="helping" className="space-y-6">
              {helperBookings && helperBookings.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {helperBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} isHelper={true} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven&apos;t applied to help with any requests yet.
                    </p>
                    <Button asChild>
                      <Link href="/requests">Browse Requests</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="requesting" className="space-y-6">
              {requesterBookings && requesterBookings.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {requesterBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} isHelper={false} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">No applications received</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven&apos;t received any applications for your requests yet.
                    </p>
                    <Button asChild>
                      <Link href="/requests/new">Post a Request</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
