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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ApplyToRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const [requestId, setRequestId] = useState<string>("")
  const [formData, setFormData] = useState({
    agreed_price: "",
    notes: "",
  })
  const [request, setRequest] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params
      setRequestId(resolvedParams.id)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)

      // Load request details
      const { data: requestData } = await supabase
        .from("requests")
        .select(`
          *,
          profiles!requests_requester_id_fkey (
            display_name
          )
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (!requestData) {
        router.push("/requests")
        return
      }

      setRequest(requestData)

      // Pre-fill price if budget is specified
      if (requestData.budget_min && requestData.budget_max) {
        setFormData({
          ...formData,
          agreed_price: ((requestData.budget_min + requestData.budget_max) / 2).toString(),
        })
      } else if (requestData.budget_min) {
        setFormData({ ...formData, agreed_price: requestData.budget_min.toString() })
      } else if (requestData.budget_max) {
        setFormData({ ...formData, agreed_price: requestData.budget_max.toString() })
      }
    }

    loadData()
  }, [params, supabase, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !request) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("bookings").insert({
        request_id: requestId,
        helper_id: user.id,
        requester_id: request.requester_id,
        agreed_price: formData.agreed_price ? Number.parseFloat(formData.agreed_price) : null,
        notes: formData.notes || null,
        status: "pending",
      })

      if (error) throw error

      router.push(`/requests/${requestId}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!request) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/requests/${requestId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Request
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Apply to Help</CardTitle>
              <CardDescription>
                Apply to help with &quot;{request.title}&quot; by {request.profiles?.display_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="agreed_price">Your Price ($)</Label>
                  <Input
                    id="agreed_price"
                    type="number"
                    placeholder="Enter your price for this job"
                    value={formData.agreed_price}
                    onChange={(e) => setFormData({ ...formData, agreed_price: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                  {request.budget_min && request.budget_max && (
                    <p className="text-sm text-muted-foreground">
                      Requested budget: ${request.budget_min} - ${request.budget_max}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Message to Requester</Label>
                  <Textarea
                    id="notes"
                    placeholder="Introduce yourself, explain your experience with this type of work, and any questions you have..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Submitting..." : "Submit Application"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/requests/${requestId}`}>Cancel</Link>
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
