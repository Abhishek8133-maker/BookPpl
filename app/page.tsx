import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { ArrowRight, Users, HandHeart, Star, MapPin, Clock, TrendingUp } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get recent requests for showcase
  const { data: recentRequests } = await supabase
    .from("requests")
    .select(`
      *,
      profiles!requests_requester_id_fkey (
        display_name,
        avatar_url
      )
    `)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(6)

  // Get community stats
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })
  const { count: totalRequests } = await supabase.from("requests").select("*", { count: "exact", head: true })
  const { count: completedBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed")

  // Get trending skills
  const { data: skillRequests } = await supabase.from("requests").select("skill_needed").eq("status", "open").limit(50)

  const skillCounts = skillRequests?.reduce(
    (acc, req) => {
      acc[req.skill_needed] = (acc[req.skill_needed] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topSkills = Object.entries(skillCounts || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
            Your Community,
            <br />
            <span className="text-primary">Always There to Help</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Connect with neighbors and community members to give and receive help with everyday tasks. From home repairs
            to tech support, we&apos;re stronger together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                  <Link href="/requests">Browse Requests</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href="/auth/signup">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Users className="w-8 h-8 text-primary mb-2" />
              </div>
              <h3 className="text-3xl font-bold">{totalUsers || 0}+</h3>
              <p className="text-muted-foreground">Community Members</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <HandHeart className="w-8 h-8 text-primary mb-2" />
              </div>
              <h3 className="text-3xl font-bold">{totalRequests || 0}+</h3>
              <p className="text-muted-foreground">Help Requests</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Star className="w-8 h-8 text-primary mb-2" />
              </div>
              <h3 className="text-3xl font-bold">{completedBookings || 0}+</h3>
              <p className="text-muted-foreground">Successful Connections</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How BookPpl Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting help or helping others is just a few clicks away
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <CardTitle>Post or Browse</CardTitle>
                <CardDescription>
                  Post a request for help or browse available requests in your community
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <CardTitle>Connect & Agree</CardTitle>
                <CardDescription>Connect with community members, discuss details, and agree on terms</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <CardTitle>Help & Review</CardTitle>
                <CardDescription>Complete the task and leave reviews to build trust in the community</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Requests */}
      {recentRequests && recentRequests.length > 0 && (
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Recent Requests</h2>
                <p className="text-xl text-muted-foreground">See what your community needs help with</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/requests">View All Requests</Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentRequests.slice(0, 6).map((request: any) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={request.profiles?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {request.profiles?.display_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {request.profiles?.display_name || "Anonymous"}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{request.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline" className="text-xs">
                      {request.skill_needed}
                    </Badge>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {request.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {user ? (
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/requests/${request.id}`}>View Details</Link>
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="w-full">
                        <Link href="/auth/signup">Sign Up to Help</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Skills */}
      {topSkills.length > 0 && (
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                Trending Skills
              </h2>
              <p className="text-xl text-muted-foreground">Most requested skills in your community</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {topSkills.map(([skill, count]) => (
                <Card key={skill} className="text-center">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{skill}</h3>
                    <Badge variant="secondary">{count} requests</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join Your Community?</h2>
          <p className="text-xl mb-8 opacity-90">
            Whether you need help or want to help others, BookPpl makes it easy to connect with your neighbors.
          </p>
          {user ? (
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link href="/auth/signup">Sign Up Free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
