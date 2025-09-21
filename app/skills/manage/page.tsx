"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

export default function ManageSkillsPage() {
  const [skills, setSkills] = useState<any[]>([])
  const [userSkills, setUserSkills] = useState<any[]>([])
  const [selectedSkill, setSelectedSkill] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
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

      // Load all available skills
      const { data: skillsData } = await supabase.from("skills").select("*").order("category", { ascending: true })
      setSkills(skillsData || [])

      // Load user's current skills
      const { data: userSkillsData } = await supabase
        .from("user_skills")
        .select(`
          *,
          skills (
            name,
            category
          )
        `)
        .eq("user_id", user.id)
      setUserSkills(userSkillsData || [])
    }

    loadData()
  }, [supabase, router])

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedSkill || !experienceLevel) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("user_skills").insert({
        user_id: user.id,
        skill_id: selectedSkill,
        experience_level: experienceLevel,
        hourly_rate: hourlyRate ? Number.parseFloat(hourlyRate) : null,
      })

      if (error) throw error

      // Reload user skills
      const { data: userSkillsData } = await supabase
        .from("user_skills")
        .select(`
          *,
          skills (
            name,
            category
          )
        `)
        .eq("user_id", user.id)
      setUserSkills(userSkillsData || [])

      // Reset form
      setSelectedSkill("")
      setExperienceLevel("")
      setHourlyRate("")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveSkill = async (userSkillId: string) => {
    try {
      const { error } = await supabase.from("user_skills").delete().eq("id", userSkillId)

      if (error) throw error

      setUserSkills(userSkills.filter((skill) => skill.id !== userSkillId))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const availableSkills = skills.filter((skill) => !userSkills.some((userSkill) => userSkill.skill_id === skill.id))

  const groupedSkills = availableSkills.reduce(
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Add New Skill */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Skill</CardTitle>
                <CardDescription>Add skills you can offer to help others</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSkill} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill">Skill</Label>
                    <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                          <div key={category}>
                            <div className="px-2 py-1 text-sm font-medium text-muted-foreground">{category}</div>
                            {categorySkills.map((skill) => (
                              <SelectItem key={skill.id} value={skill.id}>
                                {skill.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience Level</Label>
                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">Hourly Rate (optional)</Label>
                    <Input
                      id="rate"
                      type="number"
                      placeholder="25.00"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" disabled={isLoading || !selectedSkill || !experienceLevel} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    {isLoading ? "Adding..." : "Add Skill"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Your Skills</CardTitle>
                <CardDescription>Skills you currently offer</CardDescription>
              </CardHeader>
              <CardContent>
                {userSkills.length > 0 ? (
                  <div className="space-y-4">
                    {userSkills.map((userSkill) => (
                      <div key={userSkill.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{userSkill.skills.name}</h3>
                            <Badge variant="outline">{userSkill.experience_level}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{userSkill.skills.category}</p>
                          {userSkill.hourly_rate && (
                            <p className="text-sm font-medium text-primary">${userSkill.hourly_rate}/hour</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSkill(userSkill.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No skills added yet</p>
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
