"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewRequestPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_needed: "",
    location: "",
    budget_min: "",
    budget_max: "",
    urgency: "medium",
  })
  const [skills, setSkills] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)

      // Load available skills
      const { data: skillsData } = await supabase.from("skills").select("*").order("category", { ascending: true })
      setSkills(skillsData || [])
    }

    loadData()
  }, [supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("requests").insert({
        requester_id: user.id,
        title: formData.title,
        description: formData.description,
        skill_needed: formData.skill_needed,
        location: formData.location || null,
        budget_min: formData.budget_min ? Number.parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? Number.parseFloat(formData.budget_max) : null,
        urgency: formData.urgency,
        status: "open",
      })

      if (error) throw error

      router.push("/requests")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const groupedSkills = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    },
    {} as Record<string, any[]>,
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/requests">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Requests
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Post a Help Request</CardTitle>
              <CardDescription>
                Describe what you need help with and connect with skilled community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Request Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Need help fixing a leaky faucet"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about what you need help with, when you need it, and any specific requirements..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skill">Skill Needed *</Label>
                  <Select
                    value={formData.skill_needed}
                    onValueChange={(value) => setFormData({ ...formData, skill_needed: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the skill you need help with" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                        <div key={category}>
                          <div className="px-2 py-1 text-sm font-medium text-muted-foreground">{category}</div>
                          {categorySkills.map((skill) => (
                            <SelectItem key={skill.id} value={skill.name}>
                              {skill.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State or specific address"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="budget_min">Minimum Budget ($)</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      placeholder="25.00"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_max">Maximum Budget ($)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      placeholder="100.00"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Can wait a week or more</SelectItem>
                      <SelectItem value="medium">Medium - Needed within a few days</SelectItem>
                      <SelectItem value="high">High - Needed within 24 hours</SelectItem>
                      <SelectItem value="urgent">Urgent - Needed immediately</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Posting..." : "Post Request"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/requests">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
