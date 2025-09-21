import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { MapPin, Star, Clock, DollarSign, Users, TrendingUp } from "lucide-react"

export default async function DiscoverPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user's skills to find matching requests
  const { data: userSkills } = await supabase
    .from("user_skills")
    .select(`
      skills (
        name
      )
    `)
    .eq("user_id", data.user.id)

  const skillNames = userSkills?.map((us: any) => us.skills.name) || []

  // Get matching requests based on user skills
  let matchingRequestsQuery = supabase
    .from("requests")
    .select(`
      *,
      profiles!requests_requester_id_fkey (
        display_name,
        avatar_url,
        rating
      )
    `)
    .eq("status", "open")
    .neq("requester_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(6)

  if (skillNames.length > 0) {
    matchingRequestsQuery = matchingRequestsQuery.in("skill_needed", skillNames)
  }

  const { data: matchingRequests } = await matchingRequestsQuery

  // Get trending skills (most requested)
  const { data: trendingSkills } = await supabase
    .from("requests")
    .select("skill_needed")
    .eq("status", "open")
    .limit(100)

  const skillCounts = trendingSkills?.reduce(
    (acc, req) => {
      acc[req.skill_needed] = (acc[req.skill_needed] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topSkills = Object.entries(skillCounts || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Get recent community members
  const { data: recentMembers } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(6)

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Discover Opportunities</h1>
            <p className="text-muted-foreground">
              Find requests that match your skills and connect with your community
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Matching Requests */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold">Requests for You</h2>
                    <p className="text-muted-foreground">Based on your skills and interests</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/requests">View All</Link>
                  </Button>
                </div>

                {matchingRequests && matchingRequests.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {matchingRequests.map((request: any) => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={request.profiles?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {request.profiles?.display_name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{request.profiles?.display_name || "Anonymous"}</p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span>{request.profiles?.rating?.toFixed(1) || "0.0"}</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant={getUrgencyColor(request.urgency)} className="text-xs">
                              {request.urgency}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{request.title}</CardTitle>
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
                              <DollarSign className="w-3 h-3" />
                              {formatBudget(request.budget_min, request.budget_max)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          <Button asChild size="sm" className="w-full">
                            <Link href={`/requests/${request.id}`}>View Details</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        {skillNames.length > 0
                          ? "No matching requests found for your skills right now"
                          : "Add skills to your profile to see personalized recommendations"}
                      </p>
                      <Button asChild>
                        <Link href={skillNames.length > 0 ? "/requests" : "/skills/manage"}>
                          {skillNames.length > 0 ? "Browse All Requests" : "Add Skills"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Trending Skills
                  </CardTitle>
                  <CardDescription>Most requested skills this week</CardDescription>
                </CardHeader>
                <CardContent>
                  {topSkills.length > 0 ? (
                    <div className="space-y-3">
                      {topSkills.map(([skill, count], index) => (
                        <div key={skill} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                            <span className="text-sm">{skill}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {count} requests
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No trending skills yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Community Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    New Members
                  </CardTitle>
                  <CardDescription>Welcome new community members</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentMembers && recentMembers.length > 0 ? (
                    <div className="space-y-3">
                      {recentMembers.slice(0, 4).map((member: any) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{member.display_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.display_name || "New User"}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{member.rating?.toFixed(1) || "0.0"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No new members yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
