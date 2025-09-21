import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { MapPin, Clock, DollarSign, ArrowLeft, MessageCircle, Star } from "lucide-react"

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get request details
  const { data: request } = await supabase
    .from("requests")
    .select(`
      *,
      profiles!requests_requester_id_fkey (
        display_name,
        avatar_url,
        rating,
        total_reviews,
        location
      )
    `)
    .eq("id", id)
    .single()

  if (!request) {
    notFound()
  }

  // Check if current user has already applied
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("*")
    .eq("request_id", id)
    .eq("helper_id", user.id)
    .single()

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "default"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "Budget not specified"
    if (min && max) return `$${min} - $${max}`
    if (min) return `$${min}+`
    if (max) return `Up to $${max}`
    return "Budget not specified"
  }

  const isOwnRequest = request.requester_id === user.id

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/requests">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Requests
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{request.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline">{request.skill_needed}</Badge>
                        <Badge variant={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
                        <Badge variant={request.status === "open" ? "default" : "secondary"}>{request.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">{request.description}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {request.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{request.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{formatBudget(request.budget_min, request.budget_max)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Posted {new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Requester Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Requested by</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.profiles?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{request.profiles?.display_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.profiles?.display_name || "Anonymous"}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{request.profiles?.rating?.toFixed(1) || "0.0"}</span>
                        <span>({request.profiles?.total_reviews || 0} reviews)</span>
                      </div>
                    </div>
                  </div>

                  {request.profiles?.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {request.profiles.location}
                    </div>
                  )}

                  {!isOwnRequest && (
                    <Button className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Action Card */}
              {!isOwnRequest && request.status === "open" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Interested in helping?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {existingBooking ? (
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">You&apos;ve already applied for this request</p>
                        <Badge variant="outline">Application {existingBooking.status}</Badge>
                      </div>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href={`/requests/${id}/apply`}>Apply to Help</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {isOwnRequest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Manage Request</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full bg-transparent">
                      Edit Request
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Applications
                    </Button>
                    {request.status === "open" && (
                      <Button variant="destructive" className="w-full">
                        Close Request
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
