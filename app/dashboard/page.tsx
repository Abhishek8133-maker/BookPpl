import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { MapPin, Star, Clock, Plus } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single()

  // Get user skills
  const { data: userSkills } = await supabase
    .from("user_skills")
    .select(`
      *,
      skills (
        name,
        category
      )
    `)
    .eq("user_id", data.user.id)

  // Get recent requests
  const { data: recentRequests } = await supabase
    .from("requests")
    .select("*")
    .eq("requester_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">
                  {profile?.display_name?.charAt(0) || data.user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profile?.display_name || "New User"}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile?.location || "Location not set"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{profile?.rating?.toFixed(1) || "0.0"}</span>
                <span className="text-muted-foreground">({profile?.total_reviews || 0} reviews)</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                <Badge variant={profile?.is_available ? "default" : "secondary"}>
                  {profile?.is_available ? "Available" : "Busy"}
                </Badge>
              </div>
              <Button asChild className="w-full">
                <Link href="/profile/edit">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Skills Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Skills</CardTitle>
                  <CardDescription>Skills you can offer to help others</CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/skills/manage">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Skills
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {userSkills && userSkills.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userSkills.map((userSkill: any) => (
                      <div key={userSkill.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{userSkill.skills.name}</h3>
                          <Badge variant="outline">{userSkill.experience_level}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{userSkill.skills.category}</p>
                        {userSkill.hourly_rate && (
                          <p className="text-sm font-medium text-primary">${userSkill.hourly_rate}/hour</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No skills added yet</p>
                    <Button asChild>
                      <Link href="/skills/manage">Add Your First Skill</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Recent Requests</CardTitle>
                  <CardDescription>Help requests you&apos;ve posted</CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link href="/requests/new">
                    <Plus className="w-4 h-4 mr-2" />
                    New Request
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentRequests && recentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {recentRequests.map((request: any) => (
                      <div key={request.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{request.title}</h3>
                          <Badge
                            variant={
                              request.status === "open"
                                ? "default"
                                : request.status === "completed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{request.skill_needed}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No requests yet</p>
                    <Button asChild>
                      <Link href="/requests/new">Post Your First Request</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
