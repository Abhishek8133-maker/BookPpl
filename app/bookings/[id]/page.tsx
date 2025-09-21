"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Calendar, DollarSign, MapPin, Clock, Star, MessageCircle, Check, X } from "lucide-react"

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [bookingId, setBookingId] = useState<string>("")
  const [booking, setBooking] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState("")
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      setBookingId(resolvedParams.id)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)

      // Load booking details
      const { data: bookingData } = await supabase
        .from("bookings")
        .select(`
          *,
          requests (
            title,
            description,
            skill_needed,
            location,
            budget_min,
            budget_max
          ),
          profiles!bookings_requester_id_fkey (
            display_name,
            avatar_url,
            rating,
            total_reviews
          ),
          helper_profile:profiles!bookings_helper_id_fkey (
            display_name,
            avatar_url,
            rating,
            total_reviews
          )
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (!bookingData) {
        router.push("/bookings")
        return
      }

      setBooking(bookingData)
      if (bookingData.scheduled_date) {
        setScheduledDate(new Date(bookingData.scheduled_date).toISOString().slice(0, 16))
      }
    }

    loadData()
  }, [params, supabase, router])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return

    setIsLoading(true)
    setError(null)

    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() }

      if (newStatus === "accepted" && scheduledDate) {
        updateData.scheduled_date = new Date(scheduledDate).toISOString()
      }

      const { error } = await supabase.from("bookings").update(updateData).eq("id", bookingId)

      if (error) throw error

      setBooking({ ...booking, ...updateData })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteBooking = async () => {
    await handleStatusUpdate("completed")
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking || !user) return

    setIsLoading(true)
    setError(null)

    try {
      const revieweeId = user.id === booking.requester_id ? booking.helper_id : booking.requester_id

      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      })

      if (error) throw error

      // Update the reviewee's rating
      const { data: reviews } = await supabase.from("reviews").select("rating").eq("reviewee_id", revieweeId)

      if (reviews) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        await supabase
          .from("profiles")
          .update({
            rating: avgRating,
            total_reviews: reviews.length,
          })
          .eq("id", revieweeId)
      }

      setReviewData({ rating: 5, comment: "" })
      // Reload booking to show review submitted
      window.location.reload()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!booking) {
    return <div>Loading...</div>
  }

  const isRequester = user?.id === booking.requester_id
  const isHelper = user?.id === booking.helper_id
  const otherUser = isRequester ? booking.helper_profile : booking.profiles

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bookings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bookings
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
                      <CardTitle className="text-2xl mb-2">{booking.requests?.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline">{booking.requests?.skill_needed}</Badge>
                        <Badge variant={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Request Description</h3>
                    <p className="text-muted-foreground leading-relaxed">{booking.requests?.description}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {booking.requests?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{booking.requests.location}</span>
                      </div>
                    )}

                    {booking.agreed_price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Agreed Price: ${booking.agreed_price}</span>
                      </div>
                    )}

                    {booking.scheduled_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          Scheduled: {new Date(booking.scheduled_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Applied {new Date(booking.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Application Message</h3>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review Section */}
              {booking.status === "completed" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Leave a Review</CardTitle>
                    <CardDescription>Share your experience with {otherUser?.display_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewData({ ...reviewData, rating: star })}
                              className={`p-1 ${star <= reviewData.rating ? "text-yellow-400" : "text-gray-300"}`}
                            >
                              <Star className="w-6 h-6 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea
                          id="comment"
                          placeholder="Share your experience..."
                          value={reviewData.comment}
                          onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Submitting..." : "Submit Review"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Other User Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{isRequester ? "Helper" : "Requester"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={otherUser?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{otherUser?.display_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{otherUser?.display_name || "Anonymous"}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{otherUser?.rating?.toFixed(1) || "0.0"}</span>
                        <span>({otherUser?.total_reviews || 0} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isRequester && booking.status === "pending" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="scheduled_date">Schedule Date (Optional)</Label>
                        <Input
                          id="scheduled_date"
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                        />
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Button onClick={() => handleStatusUpdate("accepted")} disabled={isLoading} className="flex-1">
                          <Check className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleStatusUpdate("declined")}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </>
                  )}

                  {booking.status === "accepted" && (
                    <Button onClick={handleCompleteBooking} disabled={isLoading} className="w-full">
                      Mark as Completed
                    </Button>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
