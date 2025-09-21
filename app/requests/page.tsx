import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { MapPin, Clock, DollarSign, Plus, Search } from "lucide-react"

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; urgency?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query with filters
  let query = supabase
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
    .order("created_at", { ascending: false })

  if (params.skill) {
    query = query.ilike("skill_needed", `%${params.skill}%`)
  }

  if (params.urgency) {
    query = query.eq("urgency", params.urgency)
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  const { data: requests } = await query

  // Get available skills for filter
  const { data: skills } = await supabase.from("skills").select("name").order("name")

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Help Requests</h1>
            <p className="text-muted-foreground">Find ways to help your community</p>
          </div>
          <Button asChild>
            <Link href="/requests/new">
              <Plus className="w-4 h-4 mr-2" />
              Post Request
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search requests..." className="pl-9" defaultValue={params.search} />
              </div>
              <Select defaultValue={params.skill || "all"}>
                {" "}
                {/* Updated default value */}
                <SelectTrigger>
                  <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All skills</SelectItem> {/* Updated value */}
                  {skills?.map((skill) => (
                    <SelectItem key={skill.name} value={skill.name}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue={params.urgency || "all"}>
                {" "}
                {/* Updated default value */}
                <SelectTrigger>
                  <SelectValue placeholder="Filter by urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All urgency levels</SelectItem> {/* Updated value */}
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button>Apply Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Requests Grid */}
        {requests && requests.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request: any) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={request.profiles?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{request.profiles?.display_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.profiles?.display_name || "Anonymous"}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>★ {request.profiles?.rating?.toFixed(1) || "0.0"}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
                  </div>
                  <CardTitle className="text-lg">{request.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{request.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{request.skill_needed}</Badge>
                  </div>

                  {request.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {request.location}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    {formatBudget(request.budget_min, request.budget_max)}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {new Date(request.created_at).toLocaleDateString()}
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/requests/${request.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">No requests found matching your criteria</p>
              <Button asChild>
                <Link href="/requests/new">Post the First Request</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
